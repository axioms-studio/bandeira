package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"

	"github.com/felipekafuri/bandeira/ent"
	"github.com/felipekafuri/bandeira/ent/apitoken"
	"github.com/felipekafuri/bandeira/ent/environment"
	"github.com/felipekafuri/bandeira/pkg/form"
	"github.com/felipekafuri/bandeira/pkg/middleware"
	"github.com/felipekafuri/bandeira/pkg/msg"
	"github.com/felipekafuri/bandeira/pkg/routenames"
	"github.com/felipekafuri/bandeira/pkg/services"
	"github.com/felipekafuri/bandeira/pkg/token"
	inertia "github.com/romsar/gonertia/v2"
)

type ApiTokenHandler struct {
	Inertia *inertia.Inertia
	ORM     *ent.Client
}

type ApiTokenForm struct {
	form.Submission

	Name        string `form:"name" json:"name" validate:"required"`
	TokenType   string `form:"token_type" json:"token_type" validate:"required,oneof=client admin"`
	Environment string `form:"environment" json:"environment"`
}

func init() {
	Register(new(ApiTokenHandler))
}

func (h *ApiTokenHandler) Init(c *services.Container) error {
	h.Inertia = c.Inertia
	h.ORM = c.ORM
	return nil
}

func (h *ApiTokenHandler) Routes(g *echo.Group) {
	// Read-only: list tokens
	tokens := g.Group("/projects/:projectId/api-tokens", middleware.RequireAuth())
	tokens.GET("", h.Index).Name = routenames.ApiTokenIndex

	// Mutation routes require admin or editor role
	mut := g.Group("/projects/:projectId/api-tokens", middleware.RequireAuth(), middleware.RequireRole(h.ORM, "admin", "editor"))
	mut.GET("/create", h.Create).Name = routenames.ApiTokenCreate
	mut.POST("", h.Store).Name = routenames.ApiTokenStore
	mut.DELETE("/:id", h.Delete).Name = routenames.ApiTokenDelete
}

func (h *ApiTokenHandler) Index(ctx echo.Context) error {
	projectID, err := strconv.Atoi(ctx.Param("projectId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Project not found")
	}

	p, err := h.ORM.Project.Get(ctx.Request().Context(), projectID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Project not found")
	}

	tokens, err := h.ORM.ApiToken.Query().
		Where(apitoken.ProjectID(projectID)).
		Order(apitoken.ByCreatedAt()).
		All(ctx.Request().Context())
	if err != nil {
		return fail(err, "failed to load API tokens", h.Inertia, ctx)
	}

	tokenList := make([]map[string]any, 0, len(tokens))
	for _, t := range tokens {
		tokenList = append(tokenList, map[string]any{
			"id":          t.ID,
			"name":        t.Name,
			"tokenType":   string(t.TokenType),
			"environment": t.Environment,
			"plainToken":  t.PlainToken,
			"createdAt":   t.CreatedAt.Format("Jan 02, 2006"),
		})
	}

	return h.Inertia.Render(
		ctx.Response().Writer,
		ctx.Request(),
		"Projects/ApiTokens/Index",
		inertia.Props{
			"project": map[string]any{
				"id":   p.ID,
				"name": p.Name,
			},
			"tokens": tokenList,
		},
	)
}

func (h *ApiTokenHandler) Create(ctx echo.Context) error {
	projectID, err := strconv.Atoi(ctx.Param("projectId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Project not found")
	}

	p, err := h.ORM.Project.Get(ctx.Request().Context(), projectID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Project not found")
	}

	envs, err := h.ORM.Environment.Query().
		Where(environment.ProjectID(projectID)).
		All(ctx.Request().Context())
	if err != nil {
		return fail(err, "failed to load environments", h.Inertia, ctx)
	}

	envList := make([]map[string]any, 0, len(envs))
	for _, e := range envs {
		envList = append(envList, map[string]any{
			"id":   e.ID,
			"name": e.Name,
		})
	}

	return h.Inertia.Render(
		ctx.Response().Writer,
		ctx.Request(),
		"Projects/ApiTokens/Create",
		inertia.Props{
			"project": map[string]any{
				"id":   p.ID,
				"name": p.Name,
			},
			"environments": envList,
		},
	)
}

func (h *ApiTokenHandler) Store(ctx echo.Context) error {
	projectID, err := strconv.Atoi(ctx.Param("projectId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Project not found")
	}

	var f ApiTokenForm
	if err := form.Submit(ctx, &f); err != nil {
		form.ShareErrors(ctx, &f)
		h.Inertia.Back(ctx.Response(), ctx.Request())
		return nil
	}

	// Client tokens require an environment.
	if f.TokenType == "client" && f.Environment == "" {
		f.SetFieldError("Environment", "Environment is required for client tokens")
		form.ShareErrors(ctx, &f)
		h.Inertia.Back(ctx.Response(), ctx.Request())
		return nil
	}

	// Validate the environment exists for this project if it's a client token.
	if f.TokenType == "client" {
		exists, err := h.ORM.Environment.Query().
			Where(
				environment.Name(f.Environment),
				environment.ProjectID(projectID),
			).
			Exist(ctx.Request().Context())
		if err != nil || !exists {
			f.SetFieldError("Environment", "Environment not found for this project")
			form.ShareErrors(ctx, &f)
			h.Inertia.Back(ctx.Response(), ctx.Request())
			return nil
		}
	}

	raw, hashed, err := token.Generate()
	if err != nil {
		return fail(err, "failed to generate token", h.Inertia, ctx)
	}

	envValue := ""
	if f.TokenType == "client" {
		envValue = f.Environment
	}

	_, err = h.ORM.ApiToken.Create().
		SetName(f.Name).
		SetSecret(hashed).
		SetPlainToken(raw).
		SetTokenType(apitoken.TokenType(f.TokenType)).
		SetEnvironment(envValue).
		SetProjectID(projectID).
		Save(ctx.Request().Context())
	if err != nil {
		return fail(err, "failed to create API token", h.Inertia, ctx)
	}

	msg.Success(ctx, "API token created successfully.")
	return ctx.Redirect(http.StatusSeeOther, fmt.Sprintf("/projects/%d/api-tokens", projectID))
}

func (h *ApiTokenHandler) Delete(ctx echo.Context) error {
	projectID, err := strconv.Atoi(ctx.Param("projectId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Project not found")
	}

	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Token not found")
	}

	if err := h.ORM.ApiToken.DeleteOneID(id).Exec(ctx.Request().Context()); err != nil {
		return fail(err, "failed to delete API token", h.Inertia, ctx)
	}

	msg.Success(ctx, "API token revoked successfully.")
	return ctx.Redirect(http.StatusSeeOther, fmt.Sprintf("/projects/%d/api-tokens", projectID))
}
