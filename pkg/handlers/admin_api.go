package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"

	"github.com/felipekafuri/bandeira/ent"
	"github.com/felipekafuri/bandeira/ent/apitoken"
	entconstraint "github.com/felipekafuri/bandeira/ent/constraint"
	"github.com/felipekafuri/bandeira/ent/environment"
	entflag "github.com/felipekafuri/bandeira/ent/flag"
	"github.com/felipekafuri/bandeira/ent/flagenvironment"
	"github.com/felipekafuri/bandeira/ent/project"
	"github.com/felipekafuri/bandeira/ent/strategy"
	"github.com/felipekafuri/bandeira/pkg/context"
	"github.com/felipekafuri/bandeira/pkg/middleware"
	"github.com/felipekafuri/bandeira/pkg/routenames"
	"github.com/felipekafuri/bandeira/pkg/services"
	"github.com/felipekafuri/bandeira/pkg/token"
)

type AdminAPI struct {
	ORM *ent.Client
	Hub *services.Hub
}

func init() {
	Register(new(AdminAPI))
}

func (h *AdminAPI) Init(c *services.Container) error {
	h.ORM = c.ORM
	h.Hub = c.Hub
	return nil
}

func (h *AdminAPI) Routes(_ *echo.Group) {}

func (h *AdminAPI) APIRoutes(api *echo.Group) {
	admin := api.Group("/admin", middleware.RequireTokenAuth(h.ORM, "admin"))

	// Projects
	admin.GET("/projects", h.ListProjects).Name = routenames.AdminProjectList
	admin.POST("/projects", h.CreateProject).Name = routenames.AdminProjectCreate
	admin.GET("/projects/:id", h.GetProject).Name = routenames.AdminProjectGet
	admin.PUT("/projects/:id", h.UpdateProject).Name = routenames.AdminProjectUpdate
	admin.DELETE("/projects/:id", h.DeleteProject).Name = routenames.AdminProjectDelete

	// Environments (nested under project)
	admin.GET("/projects/:id/environments", h.ListEnvironments).Name = routenames.AdminEnvironmentList
	admin.POST("/projects/:id/environments", h.CreateEnvironment).Name = routenames.AdminEnvironmentCreate
	admin.PUT("/projects/:id/environments/:envId", h.UpdateEnvironment).Name = routenames.AdminEnvironmentUpdate
	admin.DELETE("/projects/:id/environments/:envId", h.DeleteEnvironment).Name = routenames.AdminEnvironmentDelete

	// Flags (nested under project)
	admin.GET("/projects/:id/flags", h.ListFlags).Name = routenames.AdminFlagList
	admin.POST("/projects/:id/flags", h.CreateFlag).Name = routenames.AdminFlagCreate
	admin.GET("/projects/:id/flags/:flagId", h.GetFlag).Name = routenames.AdminFlagGet
	admin.PUT("/projects/:id/flags/:flagId", h.UpdateFlag).Name = routenames.AdminFlagUpdate
	admin.DELETE("/projects/:id/flags/:flagId", h.DeleteFlag).Name = routenames.AdminFlagDelete
	admin.PATCH("/projects/:id/flags/:flagId/environments/:envId", h.PatchFlagEnv).Name = routenames.AdminFlagEnvPatch

	// Tokens
	admin.GET("/api-tokens", h.ListTokens).Name = routenames.AdminTokenList
	admin.POST("/api-tokens", h.CreateToken).Name = routenames.AdminTokenCreate
	admin.DELETE("/api-tokens/:id", h.DeleteToken).Name = routenames.AdminTokenDelete
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func adminTokenFromContext(ctx echo.Context) *ent.ApiToken {
	return ctx.Get(context.APITokenKey).(*ent.ApiToken)
}

var errAccessDenied = errors.New("access denied")

func (h *AdminAPI) requireProjectAccess(ctx echo.Context) (int, error) {
	tok := adminTokenFromContext(ctx)
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusNotFound, map[string]any{"error": "Not found"})
		return 0, errAccessDenied
	}
	if id != tok.ProjectID {
		ctx.JSON(http.StatusForbidden, map[string]any{"error": "Forbidden"})
		return 0, errAccessDenied
	}
	return id, nil
}

func jsonError(ctx echo.Context, code int, msg string) error {
	return ctx.JSON(code, map[string]any{"error": msg})
}

func jsonValidationError(ctx echo.Context, fields map[string]string) error {
	return ctx.JSON(http.StatusUnprocessableEntity, map[string]any{
		"error":  "Validation failed",
		"fields": fields,
	})
}

func timeRFC3339(t time.Time) string {
	return t.Format(time.RFC3339)
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

func (h *AdminAPI) ListProjects(ctx echo.Context) error {
	tok := adminTokenFromContext(ctx)
	reqCtx := ctx.Request().Context()

	p, err := h.ORM.Project.Query().
		Where(project.ID(tok.ProjectID)).
		WithFlags().
		WithEnvironments().
		Only(reqCtx)
	if err != nil {
		return jsonError(ctx, http.StatusInternalServerError, "Failed to load project")
	}

	return ctx.JSON(http.StatusOK, map[string]any{
		"projects": []map[string]any{projectDTO(p)},
	})
}

func (h *AdminAPI) CreateProject(ctx echo.Context) error {
	return jsonError(ctx, http.StatusForbidden, "Admin tokens are project-scoped; use the dashboard to create projects")
}

func (h *AdminAPI) GetProject(ctx echo.Context) error {
	projectID, err := h.requireProjectAccess(ctx)
	if err != nil {
		return nil
	}

	reqCtx := ctx.Request().Context()
	p, err := h.ORM.Project.Query().
		Where(project.ID(projectID)).
		WithFlags().
		WithEnvironments().
		Only(reqCtx)
	if err != nil {
		return jsonError(ctx, http.StatusNotFound, "Project not found")
	}

	return ctx.JSON(http.StatusOK, projectDTO(p))
}

func (h *AdminAPI) UpdateProject(ctx echo.Context) error {
	projectID, err := h.requireProjectAccess(ctx)
	if err != nil {
		return nil
	}

	var body struct {
		Name        *string `json:"name"`
		Description *string `json:"description"`
	}
	if err := json.NewDecoder(ctx.Request().Body).Decode(&body); err != nil {
		return jsonError(ctx, http.StatusBadRequest, "Invalid JSON")
	}

	fields := map[string]string{}
	if body.Name != nil && *body.Name == "" {
		fields["name"] = "Name is required"
	}
	if len(fields) > 0 {
		return jsonValidationError(ctx, fields)
	}

	update := h.ORM.Project.UpdateOneID(projectID)
	if body.Name != nil {
		update.SetName(*body.Name)
	}
	if body.Description != nil {
		update.SetNillableDescription(nilIfEmpty(*body.Description))
	}

	p, err := update.Save(ctx.Request().Context())
	if err != nil {
		return jsonError(ctx, http.StatusInternalServerError, "Failed to update project")
	}

	return ctx.JSON(http.StatusOK, map[string]any{
		"id":          p.ID,
		"name":        p.Name,
		"description": p.Description,
		"created_at":  timeRFC3339(p.CreatedAt),
		"updated_at":  timeRFC3339(p.UpdatedAt),
	})
}

func (h *AdminAPI) DeleteProject(ctx echo.Context) error {
	projectID, err := h.requireProjectAccess(ctx)
	if err != nil {
		return nil
	}

	reqCtx := ctx.Request().Context()

	// Cascade-delete children (SQLite has no FK cascade).
	// Delete strategies+constraints for flags in this project.
	flagIDs, _ := h.ORM.Flag.Query().Where(entflag.ProjectID(projectID)).IDs(reqCtx)
	if len(flagIDs) > 0 {
		feIDs, _ := h.ORM.FlagEnvironment.Query().Where(flagenvironment.FlagIDIn(flagIDs...)).IDs(reqCtx)
		if len(feIDs) > 0 {
			stratIDs, _ := h.ORM.Strategy.Query().Where(strategy.FlagEnvironmentIDIn(feIDs...)).IDs(reqCtx)
			if len(stratIDs) > 0 {
				h.ORM.Constraint.Delete().Where(entconstraint.StrategyIDIn(stratIDs...)).Exec(reqCtx)
				h.ORM.Strategy.Delete().Where(strategy.IDIn(stratIDs...)).Exec(reqCtx)
			}
			h.ORM.FlagEnvironment.Delete().Where(flagenvironment.IDIn(feIDs...)).Exec(reqCtx)
		}
		h.ORM.Flag.Delete().Where(entflag.ProjectID(projectID)).Exec(reqCtx)
	}
	h.ORM.Environment.Delete().Where(environment.ProjectID(projectID)).Exec(reqCtx)
	h.ORM.ApiToken.Delete().Where(apitoken.ProjectID(projectID)).Exec(reqCtx)

	if err := h.ORM.Project.DeleteOneID(projectID).Exec(reqCtx); err != nil {
		return jsonError(ctx, http.StatusInternalServerError, "Failed to delete project")
	}

	return ctx.JSON(http.StatusOK, map[string]any{"ok": true})
}

func projectDTO(p *ent.Project) map[string]any {
	return map[string]any{
		"id":                p.ID,
		"name":              p.Name,
		"description":       p.Description,
		"flag_count":        len(p.Edges.Flags),
		"environment_count": len(p.Edges.Environments),
		"created_at":        timeRFC3339(p.CreatedAt),
		"updated_at":        timeRFC3339(p.UpdatedAt),
	}
}

// ---------------------------------------------------------------------------
// Environments
// ---------------------------------------------------------------------------

func (h *AdminAPI) ListEnvironments(ctx echo.Context) error {
	projectID, err := h.requireProjectAccess(ctx)
	if err != nil {
		return nil
	}

	envs, err := h.ORM.Environment.Query().
		Where(environment.ProjectID(projectID)).
		Order(environment.BySortOrder()).
		All(ctx.Request().Context())
	if err != nil {
		return jsonError(ctx, http.StatusInternalServerError, "Failed to load environments")
	}

	items := make([]map[string]any, 0, len(envs))
	for _, e := range envs {
		items = append(items, envDTO(e))
	}

	return ctx.JSON(http.StatusOK, map[string]any{"environments": items})
}

func (h *AdminAPI) CreateEnvironment(ctx echo.Context) error {
	projectID, err := h.requireProjectAccess(ctx)
	if err != nil {
		return nil
	}

	var body struct {
		Name      string `json:"name"`
		Type      string `json:"type"`
		SortOrder *int   `json:"sort_order"`
	}
	if err := json.NewDecoder(ctx.Request().Body).Decode(&body); err != nil {
		return jsonError(ctx, http.StatusBadRequest, "Invalid JSON")
	}

	fields := map[string]string{}
	if body.Name == "" {
		fields["name"] = "Name is required"
	}
	validTypes := map[string]bool{"development": true, "staging": true, "production": true}
	if !validTypes[body.Type] {
		fields["type"] = "Type must be one of: development, staging, production"
	}
	if len(fields) > 0 {
		return jsonValidationError(ctx, fields)
	}

	create := h.ORM.Environment.Create().
		SetName(body.Name).
		SetType(environment.Type(body.Type)).
		SetProjectID(projectID)
	if body.SortOrder != nil {
		create.SetSortOrder(*body.SortOrder)
	}

	e, err := create.Save(ctx.Request().Context())
	if err != nil {
		return jsonError(ctx, http.StatusInternalServerError, "Failed to create environment")
	}

	return ctx.JSON(http.StatusCreated, envDTO(e))
}

func (h *AdminAPI) UpdateEnvironment(ctx echo.Context) error {
	projectID, err := h.requireProjectAccess(ctx)
	if err != nil {
		return nil
	}

	envID, err := strconv.Atoi(ctx.Param("envId"))
	if err != nil {
		return jsonError(ctx, http.StatusNotFound, "Environment not found")
	}

	reqCtx := ctx.Request().Context()

	// Verify env belongs to this project.
	e, err := h.ORM.Environment.Query().
		Where(environment.ID(envID), environment.ProjectID(projectID)).
		Only(reqCtx)
	if err != nil {
		return jsonError(ctx, http.StatusNotFound, "Environment not found")
	}

	var body struct {
		Name      *string `json:"name"`
		Type      *string `json:"type"`
		SortOrder *int    `json:"sort_order"`
	}
	if err := json.NewDecoder(ctx.Request().Body).Decode(&body); err != nil {
		return jsonError(ctx, http.StatusBadRequest, "Invalid JSON")
	}

	fields := map[string]string{}
	if body.Name != nil && *body.Name == "" {
		fields["name"] = "Name is required"
	}
	if body.Type != nil {
		validTypes := map[string]bool{"development": true, "staging": true, "production": true}
		if !validTypes[*body.Type] {
			fields["type"] = "Type must be one of: development, staging, production"
		}
	}
	if len(fields) > 0 {
		return jsonValidationError(ctx, fields)
	}

	update := e.Update()
	if body.Name != nil {
		update.SetName(*body.Name)
	}
	if body.Type != nil {
		update.SetType(environment.Type(*body.Type))
	}
	if body.SortOrder != nil {
		update.SetSortOrder(*body.SortOrder)
	}

	updated, err := update.Save(reqCtx)
	if err != nil {
		return jsonError(ctx, http.StatusInternalServerError, "Failed to update environment")
	}

	return ctx.JSON(http.StatusOK, envDTO(updated))
}

func (h *AdminAPI) DeleteEnvironment(ctx echo.Context) error {
	projectID, err := h.requireProjectAccess(ctx)
	if err != nil {
		return nil
	}

	envID, err := strconv.Atoi(ctx.Param("envId"))
	if err != nil {
		return jsonError(ctx, http.StatusNotFound, "Environment not found")
	}

	// Verify env belongs to this project.
	exists, err := h.ORM.Environment.Query().
		Where(environment.ID(envID), environment.ProjectID(projectID)).
		Exist(ctx.Request().Context())
	if err != nil || !exists {
		return jsonError(ctx, http.StatusNotFound, "Environment not found")
	}

	if err := h.ORM.Environment.DeleteOneID(envID).Exec(ctx.Request().Context()); err != nil {
		return jsonError(ctx, http.StatusInternalServerError, "Failed to delete environment")
	}

	return ctx.JSON(http.StatusOK, map[string]any{"ok": true})
}

func envDTO(e *ent.Environment) map[string]any {
	return map[string]any{
		"id":         e.ID,
		"name":       e.Name,
		"type":       string(e.Type),
		"sort_order": e.SortOrder,
		"project_id": e.ProjectID,
		"created_at": timeRFC3339(e.CreatedAt),
		"updated_at": timeRFC3339(e.UpdatedAt),
	}
}

// ---------------------------------------------------------------------------
// Flags
// ---------------------------------------------------------------------------

func (h *AdminAPI) ListFlags(ctx echo.Context) error {
	projectID, err := h.requireProjectAccess(ctx)
	if err != nil {
		return nil
	}

	flags, err := h.ORM.Flag.Query().
		Where(entflag.ProjectID(projectID)).
		All(ctx.Request().Context())
	if err != nil {
		return jsonError(ctx, http.StatusInternalServerError, "Failed to load flags")
	}

	items := make([]map[string]any, 0, len(flags))
	for _, f := range flags {
		items = append(items, flagSimpleDTO(f))
	}

	return ctx.JSON(http.StatusOK, map[string]any{"flags": items})
}

func (h *AdminAPI) CreateFlag(ctx echo.Context) error {
	projectID, err := h.requireProjectAccess(ctx)
	if err != nil {
		return nil
	}

	var body struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		FlagType    string `json:"flag_type"`
	}
	if err := json.NewDecoder(ctx.Request().Body).Decode(&body); err != nil {
		return jsonError(ctx, http.StatusBadRequest, "Invalid JSON")
	}

	fields := map[string]string{}
	if body.Name == "" {
		fields["name"] = "Name is required"
	}
	validTypes := map[string]bool{"release": true, "experiment": true, "operational": true, "kill_switch": true}
	if !validTypes[body.FlagType] {
		fields["flag_type"] = "Flag type must be one of: release, experiment, operational, kill_switch"
	}
	if len(fields) > 0 {
		return jsonValidationError(ctx, fields)
	}

	f, err := h.ORM.Flag.Create().
		SetName(body.Name).
		SetNillableDescription(nilIfEmpty(body.Description)).
		SetFlagType(entflag.FlagType(body.FlagType)).
		SetProjectID(projectID).
		Save(ctx.Request().Context())
	if err != nil {
		return jsonError(ctx, http.StatusInternalServerError, "Failed to create flag")
	}

	h.Hub.NotifyProject(projectID)

	return ctx.JSON(http.StatusCreated, flagSimpleDTO(f))
}

func (h *AdminAPI) GetFlag(ctx echo.Context) error {
	projectID, err := h.requireProjectAccess(ctx)
	if err != nil {
		return nil
	}

	flagID, err := strconv.Atoi(ctx.Param("flagId"))
	if err != nil {
		return jsonError(ctx, http.StatusNotFound, "Flag not found")
	}

	reqCtx := ctx.Request().Context()

	f, err := h.ORM.Flag.Query().
		Where(entflag.ID(flagID), entflag.ProjectID(projectID)).
		WithFlagEnvironments(func(q *ent.FlagEnvironmentQuery) {
			q.WithStrategies(func(sq *ent.StrategyQuery) {
				sq.WithConstraints()
			})
			q.WithEnvironment()
		}).
		Only(reqCtx)
	if err != nil {
		return jsonError(ctx, http.StatusNotFound, "Flag not found")
	}

	envConfigs := make([]map[string]any, 0, len(f.Edges.FlagEnvironments))
	for _, fe := range f.Edges.FlagEnvironments {
		strategies := make([]map[string]any, 0, len(fe.Edges.Strategies))
		for _, s := range fe.Edges.Strategies {
			constraints := make([]map[string]any, 0, len(s.Edges.Constraints))
			for _, c := range s.Edges.Constraints {
				constraints = append(constraints, map[string]any{
					"id":               c.ID,
					"context_name":     c.ContextName,
					"operator":         string(c.Operator),
					"values":           c.Values,
					"inverted":         c.Inverted,
					"case_insensitive": c.CaseInsensitive,
				})
			}
			strategies = append(strategies, map[string]any{
				"id":          s.ID,
				"name":        s.Name,
				"parameters":  s.Parameters,
				"sort_order":  s.SortOrder,
				"constraints": constraints,
			})
		}

		envName := ""
		if fe.Edges.Environment != nil {
			envName = fe.Edges.Environment.Name
		}

		envConfigs = append(envConfigs, map[string]any{
			"environment_id":   fe.EnvironmentID,
			"environment_name": envName,
			"enabled":          fe.Enabled,
			"strategies":       strategies,
		})
	}

	return ctx.JSON(http.StatusOK, map[string]any{
		"id":           f.ID,
		"name":         f.Name,
		"description":  f.Description,
		"flag_type":    string(f.FlagType),
		"project_id":   f.ProjectID,
		"created_at":   timeRFC3339(f.CreatedAt),
		"updated_at":   timeRFC3339(f.UpdatedAt),
		"environments": envConfigs,
	})
}

func (h *AdminAPI) UpdateFlag(ctx echo.Context) error {
	projectID, err := h.requireProjectAccess(ctx)
	if err != nil {
		return nil
	}

	flagID, err := strconv.Atoi(ctx.Param("flagId"))
	if err != nil {
		return jsonError(ctx, http.StatusNotFound, "Flag not found")
	}

	reqCtx := ctx.Request().Context()

	// Verify flag belongs to project.
	f, err := h.ORM.Flag.Query().
		Where(entflag.ID(flagID), entflag.ProjectID(projectID)).
		Only(reqCtx)
	if err != nil {
		return jsonError(ctx, http.StatusNotFound, "Flag not found")
	}

	var body struct {
		Name        *string `json:"name"`
		Description *string `json:"description"`
		FlagType    *string `json:"flag_type"`
	}
	if err := json.NewDecoder(ctx.Request().Body).Decode(&body); err != nil {
		return jsonError(ctx, http.StatusBadRequest, "Invalid JSON")
	}

	fields := map[string]string{}
	if body.Name != nil && *body.Name == "" {
		fields["name"] = "Name is required"
	}
	if body.FlagType != nil {
		validTypes := map[string]bool{"release": true, "experiment": true, "operational": true, "kill_switch": true}
		if !validTypes[*body.FlagType] {
			fields["flag_type"] = "Flag type must be one of: release, experiment, operational, kill_switch"
		}
	}
	if len(fields) > 0 {
		return jsonValidationError(ctx, fields)
	}

	update := f.Update()
	if body.Name != nil {
		update.SetName(*body.Name)
	}
	if body.Description != nil {
		update.SetNillableDescription(nilIfEmpty(*body.Description))
	}
	if body.FlagType != nil {
		update.SetFlagType(entflag.FlagType(*body.FlagType))
	}

	updated, err := update.Save(reqCtx)
	if err != nil {
		return jsonError(ctx, http.StatusInternalServerError, "Failed to update flag")
	}

	h.Hub.NotifyProject(projectID)

	return ctx.JSON(http.StatusOK, flagSimpleDTO(updated))
}

func (h *AdminAPI) DeleteFlag(ctx echo.Context) error {
	projectID, err := h.requireProjectAccess(ctx)
	if err != nil {
		return nil
	}

	flagID, err := strconv.Atoi(ctx.Param("flagId"))
	if err != nil {
		return jsonError(ctx, http.StatusNotFound, "Flag not found")
	}

	// Verify flag belongs to project.
	exists, err := h.ORM.Flag.Query().
		Where(entflag.ID(flagID), entflag.ProjectID(projectID)).
		Exist(ctx.Request().Context())
	if err != nil || !exists {
		return jsonError(ctx, http.StatusNotFound, "Flag not found")
	}

	if err := h.ORM.Flag.DeleteOneID(flagID).Exec(ctx.Request().Context()); err != nil {
		return jsonError(ctx, http.StatusInternalServerError, "Failed to delete flag")
	}

	h.Hub.NotifyProject(projectID)

	return ctx.JSON(http.StatusOK, map[string]any{"ok": true})
}

func flagSimpleDTO(f *ent.Flag) map[string]any {
	return map[string]any{
		"id":          f.ID,
		"name":        f.Name,
		"description": f.Description,
		"flag_type":   string(f.FlagType),
		"project_id":  f.ProjectID,
		"created_at":  timeRFC3339(f.CreatedAt),
		"updated_at":  timeRFC3339(f.UpdatedAt),
	}
}

// ---------------------------------------------------------------------------
// PATCH flag/env
// ---------------------------------------------------------------------------

func (h *AdminAPI) PatchFlagEnv(ctx echo.Context) error {
	projectID, err := h.requireProjectAccess(ctx)
	if err != nil {
		return nil
	}

	flagID, err := strconv.Atoi(ctx.Param("flagId"))
	if err != nil {
		return jsonError(ctx, http.StatusNotFound, "Flag not found")
	}

	envID, err := strconv.Atoi(ctx.Param("envId"))
	if err != nil {
		return jsonError(ctx, http.StatusNotFound, "Environment not found")
	}

	reqCtx := ctx.Request().Context()

	// Verify flag belongs to project.
	exists, err := h.ORM.Flag.Query().
		Where(entflag.ID(flagID), entflag.ProjectID(projectID)).
		Exist(reqCtx)
	if err != nil || !exists {
		return jsonError(ctx, http.StatusNotFound, "Flag not found")
	}

	// Verify env belongs to project.
	exists, err = h.ORM.Environment.Query().
		Where(environment.ID(envID), environment.ProjectID(projectID)).
		Exist(reqCtx)
	if err != nil || !exists {
		return jsonError(ctx, http.StatusNotFound, "Environment not found")
	}

	var body struct {
		Enabled    *bool           `json:"enabled"`
		Strategies *json.RawMessage `json:"strategies"`
	}
	if err := json.NewDecoder(ctx.Request().Body).Decode(&body); err != nil {
		return jsonError(ctx, http.StatusBadRequest, "Invalid JSON")
	}

	fe, err := getOrCreateFlagEnvironment(reqCtx, h.ORM, flagID, envID)
	if err != nil {
		return jsonError(ctx, http.StatusInternalServerError, "Failed to get flag environment")
	}

	// Toggle enabled state.
	if body.Enabled != nil {
		fe, err = fe.Update().SetEnabled(*body.Enabled).Save(reqCtx)
		if err != nil {
			return jsonError(ctx, http.StatusInternalServerError, "Failed to update enabled state")
		}
	}

	// Replace strategies if provided.
	if body.Strategies != nil {
		var strategyInputs []StrategyInput
		if err := json.Unmarshal(*body.Strategies, &strategyInputs); err != nil {
			return jsonError(ctx, http.StatusBadRequest, "Invalid strategies format")
		}

		tx, err := h.ORM.Tx(reqCtx)
		if err != nil {
			return jsonError(ctx, http.StatusInternalServerError, "Failed to start transaction")
		}

		// Delete old constraints then strategies.
		oldStrategies, _ := tx.Strategy.Query().
			Where(strategy.FlagEnvironmentID(fe.ID)).
			IDs(reqCtx)
		if len(oldStrategies) > 0 {
			_, _ = tx.Constraint.Delete().
				Where(entconstraint.StrategyIDIn(oldStrategies...)).
				Exec(reqCtx)
			_, _ = tx.Strategy.Delete().
				Where(strategy.FlagEnvironmentID(fe.ID)).
				Exec(reqCtx)
		}

		// Recreate from input.
		for i, si := range strategyInputs {
			s, err := tx.Strategy.Create().
				SetName(si.Name).
				SetParameters(si.Parameters).
				SetSortOrder(i).
				SetFlagEnvironmentID(fe.ID).
				Save(reqCtx)
			if err != nil {
				tx.Rollback()
				return jsonError(ctx, http.StatusInternalServerError, "Failed to create strategy")
			}
			for _, ci := range si.Constraints {
				_, err := tx.Constraint.Create().
					SetContextName(ci.ContextName).
					SetOperator(entconstraint.Operator(ci.Operator)).
					SetValues(ci.Values).
					SetInverted(ci.Inverted).
					SetCaseInsensitive(ci.CaseInsensitive).
					SetStrategyID(s.ID).
					Save(reqCtx)
				if err != nil {
					tx.Rollback()
					return jsonError(ctx, http.StatusInternalServerError, "Failed to create constraint")
				}
			}
		}

		if err := tx.Commit(); err != nil {
			return jsonError(ctx, http.StatusInternalServerError, "Failed to commit")
		}
	}

	// Reload to return fresh state.
	fe, err = h.ORM.FlagEnvironment.Query().
		Where(flagenvironment.ID(fe.ID)).
		WithStrategies(func(sq *ent.StrategyQuery) {
			sq.WithConstraints()
			sq.Order(ent.Asc(strategy.FieldSortOrder))
		}).
		Only(reqCtx)
	if err != nil {
		return jsonError(ctx, http.StatusInternalServerError, "Failed to reload")
	}

	strategies := make([]map[string]any, 0, len(fe.Edges.Strategies))
	for _, s := range fe.Edges.Strategies {
		constraints := make([]map[string]any, 0, len(s.Edges.Constraints))
		for _, c := range s.Edges.Constraints {
			constraints = append(constraints, map[string]any{
				"id":               c.ID,
				"context_name":     c.ContextName,
				"operator":         string(c.Operator),
				"values":           c.Values,
				"inverted":         c.Inverted,
				"case_insensitive": c.CaseInsensitive,
			})
		}
		strategies = append(strategies, map[string]any{
			"id":          s.ID,
			"name":        s.Name,
			"parameters":  s.Parameters,
			"sort_order":  s.SortOrder,
			"constraints": constraints,
		})
	}

	if env, err := h.ORM.Environment.Get(reqCtx, envID); err == nil {
		h.Hub.Notify(projectID, env.Name)
	}

	return ctx.JSON(http.StatusOK, map[string]any{
		"environment_id": fe.EnvironmentID,
		"flag_id":        fe.FlagID,
		"enabled":        fe.Enabled,
		"strategies":     strategies,
	})
}

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

func (h *AdminAPI) ListTokens(ctx echo.Context) error {
	tok := adminTokenFromContext(ctx)
	reqCtx := ctx.Request().Context()

	tokens, err := h.ORM.ApiToken.Query().
		Where(apitoken.ProjectID(tok.ProjectID)).
		Order(apitoken.ByCreatedAt()).
		All(reqCtx)
	if err != nil {
		return jsonError(ctx, http.StatusInternalServerError, "Failed to load tokens")
	}

	items := make([]map[string]any, 0, len(tokens))
	for _, t := range tokens {
		items = append(items, map[string]any{
			"id":          t.ID,
			"name":        t.Name,
			"token_type":  string(t.TokenType),
			"environment": t.Environment,
			"created_at":  timeRFC3339(t.CreatedAt),
		})
	}

	return ctx.JSON(http.StatusOK, map[string]any{"tokens": items})
}

func (h *AdminAPI) CreateToken(ctx echo.Context) error {
	tok := adminTokenFromContext(ctx)
	reqCtx := ctx.Request().Context()

	var body struct {
		Name        string `json:"name"`
		TokenType   string `json:"token_type"`
		Environment string `json:"environment"`
	}
	if err := json.NewDecoder(ctx.Request().Body).Decode(&body); err != nil {
		return jsonError(ctx, http.StatusBadRequest, "Invalid JSON")
	}

	fields := map[string]string{}
	if body.Name == "" {
		fields["name"] = "Name is required"
	}
	validTypes := map[string]bool{"client": true, "admin": true}
	if !validTypes[body.TokenType] {
		fields["token_type"] = "Token type must be one of: client, admin"
	}
	if body.TokenType == "client" && body.Environment == "" {
		fields["environment"] = "Environment is required for client tokens"
	}
	if len(fields) > 0 {
		return jsonValidationError(ctx, fields)
	}

	// Validate environment exists for client tokens.
	if body.TokenType == "client" {
		exists, err := h.ORM.Environment.Query().
			Where(
				environment.Name(body.Environment),
				environment.ProjectID(tok.ProjectID),
			).Exist(reqCtx)
		if err != nil || !exists {
			return jsonValidationError(ctx, map[string]string{
				"environment": "Environment not found for this project",
			})
		}
	}

	raw, hashed, err := token.Generate()
	if err != nil {
		return jsonError(ctx, http.StatusInternalServerError, "Failed to generate token")
	}

	envValue := ""
	if body.TokenType == "client" {
		envValue = body.Environment
	}

	t, err := h.ORM.ApiToken.Create().
		SetName(body.Name).
		SetSecret(hashed).
		SetPlainToken(raw).
		SetTokenType(apitoken.TokenType(body.TokenType)).
		SetEnvironment(envValue).
		SetProjectID(tok.ProjectID).
		Save(reqCtx)
	if err != nil {
		return jsonError(ctx, http.StatusInternalServerError, "Failed to create token")
	}

	return ctx.JSON(http.StatusCreated, map[string]any{
		"id":          t.ID,
		"name":        t.Name,
		"token_type":  string(t.TokenType),
		"environment": t.Environment,
		"raw_token":   raw,
		"created_at":  timeRFC3339(t.CreatedAt),
	})
}

func (h *AdminAPI) DeleteToken(ctx echo.Context) error {
	tok := adminTokenFromContext(ctx)

	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return jsonError(ctx, http.StatusNotFound, "Token not found")
	}

	reqCtx := ctx.Request().Context()

	// Verify token belongs to same project.
	exists, err := h.ORM.ApiToken.Query().
		Where(apitoken.ID(id), apitoken.ProjectID(tok.ProjectID)).
		Exist(reqCtx)
	if err != nil || !exists {
		return jsonError(ctx, http.StatusNotFound, "Token not found")
	}

	if err := h.ORM.ApiToken.DeleteOneID(id).Exec(reqCtx); err != nil {
		return jsonError(ctx, http.StatusInternalServerError, "Failed to delete token")
	}

	return ctx.JSON(http.StatusOK, map[string]any{"ok": true})
}
