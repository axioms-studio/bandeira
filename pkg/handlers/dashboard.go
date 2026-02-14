package handlers

import (
	"entgo.io/ent/dialect/sql"
	"github.com/labstack/echo/v4"

	"github.com/felipekafuri/bandeira/ent"
	"github.com/felipekafuri/bandeira/ent/project"
	"github.com/felipekafuri/bandeira/pkg/middleware"
	"github.com/felipekafuri/bandeira/pkg/routenames"
	"github.com/felipekafuri/bandeira/pkg/services"
	inertia "github.com/romsar/gonertia/v2"
)

type Dashboard struct {
	Inertia *inertia.Inertia
	ORM     *ent.Client
}

func init() {
	Register(new(Dashboard))
}

func (h *Dashboard) Init(c *services.Container) error {
	h.Inertia = c.Inertia
	h.ORM = c.ORM
	return nil
}

func (h *Dashboard) Routes(g *echo.Group) {
	g.GET("/dashboard", h.Index, middleware.RequireAuth()).Name = routenames.Dashboard
}

func (h *Dashboard) Index(ctx echo.Context) error {
	reqCtx := ctx.Request().Context()

	projectCount, _ := h.ORM.Project.Query().Count(reqCtx)
	flagCount, _ := h.ORM.Flag.Query().Count(reqCtx)
	environmentCount, _ := h.ORM.Environment.Query().Count(reqCtx)

	recentProjects, _ := h.ORM.Project.
		Query().
		WithFlags().
		WithEnvironments().
		Order(project.ByCreatedAt(sql.OrderDesc())).
		Limit(5).
		All(reqCtx)

	type recentProject struct {
		ID               int    `json:"id"`
		Name             string `json:"name"`
		Description      string `json:"description"`
		FlagCount        int    `json:"flagCount"`
		EnvironmentCount int    `json:"environmentCount"`
		CreatedAt        string `json:"createdAt"`
	}

	recent := make([]recentProject, 0, len(recentProjects))
	for _, p := range recentProjects {
		recent = append(recent, recentProject{
			ID:               p.ID,
			Name:             p.Name,
			Description:      p.Description,
			FlagCount:        len(p.Edges.Flags),
			EnvironmentCount: len(p.Edges.Environments),
			CreatedAt:        p.CreatedAt.Format("Jan 2, 2006"),
		})
	}

	return h.Inertia.Render(
		ctx.Response().Writer,
		ctx.Request(),
		"Dashboard",
		inertia.Props{
			"projectCount":     projectCount,
			"flagCount":        flagCount,
			"environmentCount": environmentCount,
			"recentProjects":   recent,
		},
	)
}
