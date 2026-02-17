package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"

	"github.com/felipekafuri/bandeira/ent"
	"github.com/felipekafuri/bandeira/ent/environment"
	"github.com/felipekafuri/bandeira/pkg/form"
	"github.com/felipekafuri/bandeira/pkg/middleware"
	"github.com/felipekafuri/bandeira/pkg/msg"
	"github.com/felipekafuri/bandeira/pkg/routenames"
	"github.com/felipekafuri/bandeira/pkg/services"
	inertia "github.com/romsar/gonertia/v2"
)

type Environment struct {
	Inertia *inertia.Inertia
	ORM     *ent.Client
}

type EnvironmentForm struct {
	form.Submission

	Name      string `form:"name" json:"name" validate:"required"`
	Type      string `form:"type" json:"type" validate:"required,oneof=development staging production"`
	SortOrder string `form:"sort_order" json:"sort_order"`
}

func init() {
	Register(new(Environment))
}

func (h *Environment) Init(c *services.Container) error {
	h.Inertia = c.Inertia
	h.ORM = c.ORM
	return nil
}

func (h *Environment) Routes(g *echo.Group) {
	// All environment routes require admin or editor role (no read-only views)
	envs := g.Group("/projects/:projectId/environments", middleware.RequireAuth(), middleware.RequireRole(h.ORM, "admin", "editor"))
	envs.GET("/create", h.Create).Name = routenames.EnvironmentCreate
	envs.POST("", h.Store).Name = routenames.EnvironmentStore
	envs.GET("/:id/edit", h.Edit).Name = routenames.EnvironmentEdit
	envs.PUT("/:id", h.Update).Name = routenames.EnvironmentUpdate
	envs.DELETE("/:id", h.Delete).Name = routenames.EnvironmentDelete
}

func (h *Environment) Create(ctx echo.Context) error {
	projectID, err := strconv.Atoi(ctx.Param("projectId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Project not found")
	}

	p, err := h.ORM.Project.Get(ctx.Request().Context(), projectID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Project not found")
	}

	return h.Inertia.Render(
		ctx.Response().Writer,
		ctx.Request(),
		"Projects/Environments/Create",
		inertia.Props{
			"project": map[string]any{
				"id":   p.ID,
				"name": p.Name,
			},
		},
	)
}

func (h *Environment) Store(ctx echo.Context) error {
	projectID, err := strconv.Atoi(ctx.Param("projectId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Project not found")
	}

	var f EnvironmentForm
	if err := form.Submit(ctx, &f); err != nil {
		form.ShareErrors(ctx, &f)
		h.Inertia.Back(ctx.Response(), ctx.Request())
		return nil
	}

	sortOrder := 0
	if f.SortOrder != "" {
		sortOrder, _ = strconv.Atoi(f.SortOrder)
	}

	_, err = h.ORM.Environment.
		Create().
		SetName(f.Name).
		SetType(environment.Type(f.Type)).
		SetSortOrder(sortOrder).
		SetProjectID(projectID).
		Save(ctx.Request().Context())
	if err != nil {
		return fail(err, "failed to create environment", h.Inertia, ctx)
	}

	msg.Success(ctx, "Environment created successfully.")
	return ctx.Redirect(http.StatusSeeOther, fmt.Sprintf("/projects/%d", projectID))
}

func (h *Environment) Edit(ctx echo.Context) error {
	projectID, err := strconv.Atoi(ctx.Param("projectId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Project not found")
	}

	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Environment not found")
	}

	p, err := h.ORM.Project.Get(ctx.Request().Context(), projectID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Project not found")
	}

	env, err := h.ORM.Environment.Get(ctx.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Environment not found")
	}

	return h.Inertia.Render(
		ctx.Response().Writer,
		ctx.Request(),
		"Projects/Environments/Edit",
		inertia.Props{
			"project": map[string]any{
				"id":   p.ID,
				"name": p.Name,
			},
			"environment": map[string]any{
				"id":        env.ID,
				"name":      env.Name,
				"type":      string(env.Type),
				"sortOrder": env.SortOrder,
			},
		},
	)
}

func (h *Environment) Update(ctx echo.Context) error {
	projectID, err := strconv.Atoi(ctx.Param("projectId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Project not found")
	}

	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Environment not found")
	}

	var f EnvironmentForm
	if err := form.Submit(ctx, &f); err != nil {
		form.ShareErrors(ctx, &f)
		h.Inertia.Back(ctx.Response(), ctx.Request())
		return nil
	}

	sortOrder := 0
	if f.SortOrder != "" {
		sortOrder, _ = strconv.Atoi(f.SortOrder)
	}

	_, err = h.ORM.Environment.
		UpdateOneID(id).
		SetName(f.Name).
		SetType(environment.Type(f.Type)).
		SetSortOrder(sortOrder).
		Save(ctx.Request().Context())
	if err != nil {
		return fail(err, "failed to update environment", h.Inertia, ctx)
	}

	msg.Success(ctx, "Environment updated successfully.")
	return ctx.Redirect(http.StatusSeeOther, fmt.Sprintf("/projects/%d", projectID))
}

func (h *Environment) Delete(ctx echo.Context) error {
	projectID, err := strconv.Atoi(ctx.Param("projectId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Project not found")
	}

	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Environment not found")
	}

	if err := h.ORM.Environment.DeleteOneID(id).Exec(ctx.Request().Context()); err != nil {
		return fail(err, "failed to delete environment", h.Inertia, ctx)
	}

	msg.Success(ctx, "Environment deleted successfully.")
	return ctx.Redirect(http.StatusSeeOther, fmt.Sprintf("/projects/%d", projectID))
}
