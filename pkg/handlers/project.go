package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"entgo.io/ent/dialect/sql"
	"github.com/labstack/echo/v4"

	"github.com/felipekafuri/bandeira/ent"
	"github.com/felipekafuri/bandeira/ent/flagenvironment"
	"github.com/felipekafuri/bandeira/ent/project"
	"github.com/felipekafuri/bandeira/pkg/form"
	"github.com/felipekafuri/bandeira/pkg/middleware"
	"github.com/felipekafuri/bandeira/pkg/msg"
	"github.com/felipekafuri/bandeira/pkg/routenames"
	"github.com/felipekafuri/bandeira/pkg/services"
	inertia "github.com/romsar/gonertia/v2"
)

type Project struct {
	Inertia *inertia.Inertia
	ORM     *ent.Client
}

type ProjectForm struct {
	form.Submission

	Name        string `form:"name" json:"name" validate:"required"`
	Description string `form:"description" json:"description"`
}

func init() {
	Register(new(Project))
}

func (h *Project) Init(c *services.Container) error {
	h.Inertia = c.Inertia
	h.ORM = c.ORM
	return nil
}

func (h *Project) Routes(g *echo.Group) {
	projects := g.Group("/projects", middleware.RequireAuth())
	projects.GET("", h.Index).Name = routenames.ProjectIndex
	projects.GET("/create", h.Create).Name = routenames.ProjectCreate
	projects.POST("", h.Store).Name = routenames.ProjectStore
	projects.GET("/:id", h.Show).Name = routenames.ProjectShow
	projects.GET("/:id/edit", h.Edit).Name = routenames.ProjectEdit
	projects.PUT("/:id", h.Update).Name = routenames.ProjectUpdate
	projects.DELETE("/:id", h.Delete).Name = routenames.ProjectDelete
}

func (h *Project) Index(ctx echo.Context) error {
	projects, err := h.ORM.Project.
		Query().
		WithFlags().
		WithEnvironments().
		Order(project.ByCreatedAt(sql.OrderDesc())).
		All(ctx.Request().Context())
	if err != nil {
		return fail(err, "failed to query projects", h.Inertia, ctx)
	}

	type projectItem struct {
		ID               int    `json:"id"`
		Name             string `json:"name"`
		Description      string `json:"description"`
		FlagCount        int    `json:"flagCount"`
		EnvironmentCount int    `json:"environmentCount"`
		CreatedAt        string `json:"createdAt"`
	}

	items := make([]projectItem, 0, len(projects))
	for _, p := range projects {
		items = append(items, projectItem{
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
		"Projects/Index",
		inertia.Props{
			"projects": items,
		},
	)
}

func (h *Project) Create(ctx echo.Context) error {
	return h.Inertia.Render(
		ctx.Response().Writer,
		ctx.Request(),
		"Projects/Create",
		inertia.Props{},
	)
}

func (h *Project) Store(ctx echo.Context) error {
	var f ProjectForm
	if err := form.Submit(ctx, &f); err != nil {
		form.ShareErrors(ctx, &f)
		h.Inertia.Back(ctx.Response(), ctx.Request())
		return nil
	}

	p, err := h.ORM.Project.
		Create().
		SetName(f.Name).
		SetNillableDescription(nilIfEmpty(f.Description)).
		Save(ctx.Request().Context())
	if err != nil {
		return fail(err, "failed to create project", h.Inertia, ctx)
	}

	msg.Success(ctx, "Project created successfully.")
	return ctx.Redirect(http.StatusSeeOther, fmt.Sprintf("/projects/%d", p.ID))
}

func (h *Project) Show(ctx echo.Context) error {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Project not found")
	}

	reqCtx := ctx.Request().Context()

	p, err := h.ORM.Project.
		Query().
		Where(project.ID(id)).
		WithFlags().
		WithEnvironments().
		Only(reqCtx)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Project not found")
	}

	// Query all FlagEnvironment records for this project's flags so we can
	// build the matrix of enabled states.
	flagIDs := make([]int, 0, len(p.Edges.Flags))
	for _, f := range p.Edges.Flags {
		flagIDs = append(flagIDs, f.ID)
	}

	type toggleState struct {
		FlagID        int  `json:"flagId"`
		EnvironmentID int  `json:"environmentId"`
		Enabled       bool `json:"enabled"`
	}

	var toggles []toggleState
	if len(flagIDs) > 0 {
		fes, err := h.ORM.FlagEnvironment.
			Query().
			Where(flagenvironment.FlagIDIn(flagIDs...)).
			All(reqCtx)
		if err == nil {
			for _, fe := range fes {
				toggles = append(toggles, toggleState{
					FlagID:        fe.FlagID,
					EnvironmentID: fe.EnvironmentID,
					Enabled:       fe.Enabled,
				})
			}
		}
	}

	type flagItem struct {
		ID          int    `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
		FlagType    string `json:"flagType"`
		CreatedAt   string `json:"createdAt"`
	}

	type envItem struct {
		ID        int    `json:"id"`
		Name      string `json:"name"`
		Type      string `json:"type"`
		SortOrder int    `json:"sortOrder"`
	}

	flags := make([]flagItem, 0, len(p.Edges.Flags))
	for _, f := range p.Edges.Flags {
		flags = append(flags, flagItem{
			ID:          f.ID,
			Name:        f.Name,
			Description: f.Description,
			FlagType:    string(f.FlagType),
			CreatedAt:   f.CreatedAt.Format("Jan 2, 2006"),
		})
	}

	envs := make([]envItem, 0, len(p.Edges.Environments))
	for _, e := range p.Edges.Environments {
		envs = append(envs, envItem{
			ID:        e.ID,
			Name:      e.Name,
			Type:      string(e.Type),
			SortOrder: e.SortOrder,
		})
	}

	return h.Inertia.Render(
		ctx.Response().Writer,
		ctx.Request(),
		"Projects/Show",
		inertia.Props{
			"project": map[string]any{
				"id":           p.ID,
				"name":         p.Name,
				"description":  p.Description,
				"createdAt":    p.CreatedAt.Format("Jan 2, 2006"),
				"flags":        flags,
				"environments": envs,
				"toggles":      toggles,
			},
		},
	)
}

func (h *Project) Edit(ctx echo.Context) error {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Project not found")
	}

	p, err := h.ORM.Project.Get(ctx.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Project not found")
	}

	return h.Inertia.Render(
		ctx.Response().Writer,
		ctx.Request(),
		"Projects/Edit",
		inertia.Props{
			"project": map[string]any{
				"id":          p.ID,
				"name":        p.Name,
				"description": p.Description,
			},
		},
	)
}

func (h *Project) Update(ctx echo.Context) error {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Project not found")
	}

	var f ProjectForm
	if err := form.Submit(ctx, &f); err != nil {
		form.ShareErrors(ctx, &f)
		h.Inertia.Back(ctx.Response(), ctx.Request())
		return nil
	}

	_, err = h.ORM.Project.
		UpdateOneID(id).
		SetName(f.Name).
		SetNillableDescription(nilIfEmpty(f.Description)).
		Save(ctx.Request().Context())
	if err != nil {
		return fail(err, "failed to update project", h.Inertia, ctx)
	}

	msg.Success(ctx, "Project updated successfully.")
	h.Inertia.Back(ctx.Response(), ctx.Request())
	return nil
}

func (h *Project) Delete(ctx echo.Context) error {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Project not found")
	}

	if err := h.ORM.Project.DeleteOneID(id).Exec(ctx.Request().Context()); err != nil {
		return fail(err, "failed to delete project", h.Inertia, ctx)
	}

	msg.Success(ctx, "Project deleted successfully.")
	return ctx.Redirect(http.StatusSeeOther, "/projects")
}

func nilIfEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
