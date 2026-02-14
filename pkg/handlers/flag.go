package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"

	"github.com/felipekafuri/bandeira/ent"
	entconstraint "github.com/felipekafuri/bandeira/ent/constraint"
	entflag "github.com/felipekafuri/bandeira/ent/flag"
	"github.com/felipekafuri/bandeira/ent/flagenvironment"
	"github.com/felipekafuri/bandeira/ent/strategy"
	"github.com/felipekafuri/bandeira/pkg/form"
	"github.com/felipekafuri/bandeira/pkg/middleware"
	"github.com/felipekafuri/bandeira/pkg/msg"
	"github.com/felipekafuri/bandeira/pkg/routenames"
	"github.com/felipekafuri/bandeira/pkg/services"
	inertia "github.com/romsar/gonertia/v2"
)

type FlagHandler struct {
	Inertia *inertia.Inertia
	ORM     *ent.Client
}

type FlagForm struct {
	form.Submission

	Name        string `form:"name" json:"name" validate:"required"`
	Description string `form:"description" json:"description"`
	FlagType    string `form:"flag_type" json:"flag_type" validate:"required,oneof=release experiment operational kill_switch"`
}

type StrategyInput struct {
	EnvironmentID int                    `json:"environment_id"`
	Name          string                 `json:"name"`
	Parameters    map[string]interface{} `json:"parameters"`
	SortOrder     int                    `json:"sort_order"`
	Constraints   []ConstraintInput      `json:"constraints"`
}

type ConstraintInput struct {
	ContextName     string   `json:"context_name"`
	Operator        string   `json:"operator"`
	Values          []string `json:"values"`
	Inverted        bool     `json:"inverted"`
	CaseInsensitive bool     `json:"case_insensitive"`
}

func init() {
	Register(new(FlagHandler))
}

func (h *FlagHandler) Init(c *services.Container) error {
	h.Inertia = c.Inertia
	h.ORM = c.ORM
	return nil
}

func (h *FlagHandler) Routes(g *echo.Group) {
	flags := g.Group("/projects/:projectId/flags", middleware.RequireAuth())
	flags.GET("/create", h.Create).Name = routenames.FlagCreate
	flags.POST("", h.Store).Name = routenames.FlagStore
	flags.GET("/:id/edit", h.Edit).Name = routenames.FlagEdit
	flags.PUT("/:id", h.Update).Name = routenames.FlagUpdate
	flags.DELETE("/:id", h.Delete).Name = routenames.FlagDelete
	flags.POST("/:id/toggle", h.Toggle).Name = routenames.FlagToggle

	flags.GET("/:id/strategies", h.ListStrategies).Name = routenames.StrategyList
	flags.POST("/:id/strategies", h.StoreStrategy).Name = routenames.StrategyStore
	flags.PUT("/:id/strategies/:strategyId", h.UpdateStrategy).Name = routenames.StrategyUpdate
	flags.DELETE("/:id/strategies/:strategyId", h.DeleteStrategy).Name = routenames.StrategyDelete
}

func (h *FlagHandler) Create(ctx echo.Context) error {
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
		"Projects/Flags/Create",
		inertia.Props{
			"project": map[string]any{
				"id":   p.ID,
				"name": p.Name,
			},
		},
	)
}

func (h *FlagHandler) Store(ctx echo.Context) error {
	projectID, err := strconv.Atoi(ctx.Param("projectId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Project not found")
	}

	var f FlagForm
	if err := form.Submit(ctx, &f); err != nil {
		form.ShareErrors(ctx, &f)
		h.Inertia.Back(ctx.Response(), ctx.Request())
		return nil
	}

	_, err = h.ORM.Flag.
		Create().
		SetName(f.Name).
		SetNillableDescription(nilIfEmpty(f.Description)).
		SetFlagType(entflag.FlagType(f.FlagType)).
		SetProjectID(projectID).
		Save(ctx.Request().Context())
	if err != nil {
		return fail(err, "failed to create flag", h.Inertia, ctx)
	}

	msg.Success(ctx, "Flag created successfully.")
	return ctx.Redirect(http.StatusSeeOther, fmt.Sprintf("/projects/%d", projectID))
}

func (h *FlagHandler) Edit(ctx echo.Context) error {
	projectID, err := strconv.Atoi(ctx.Param("projectId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Project not found")
	}

	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Flag not found")
	}

	reqCtx := ctx.Request().Context()

	p, err := h.ORM.Project.Get(reqCtx, projectID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Project not found")
	}

	f, err := h.ORM.Flag.Get(reqCtx, id)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Flag not found")
	}

	type envItem struct {
		ID        int    `json:"id"`
		Name      string `json:"name"`
		Type      string `json:"type"`
		SortOrder int    `json:"sortOrder"`
	}

	environments, _ := p.QueryEnvironments().All(reqCtx)

	envs := make([]envItem, 0, len(environments))
	for _, e := range environments {
		envs = append(envs, envItem{
			ID:        e.ID,
			Name:      e.Name,
			Type:      string(e.Type),
			SortOrder: e.SortOrder,
		})
	}

	type toggleState struct {
		EnvironmentID int  `json:"environmentId"`
		Enabled       bool `json:"enabled"`
	}

	fes, _ := h.ORM.FlagEnvironment.
		Query().
		Where(flagenvironment.FlagID(id)).
		All(reqCtx)

	toggles := make([]toggleState, 0, len(fes))
	for _, fe := range fes {
		toggles = append(toggles, toggleState{
			EnvironmentID: fe.EnvironmentID,
			Enabled:       fe.Enabled,
		})
	}

	return h.Inertia.Render(
		ctx.Response().Writer,
		ctx.Request(),
		"Projects/Flags/Edit",
		inertia.Props{
			"project": map[string]any{
				"id":   p.ID,
				"name": p.Name,
			},
			"flag": map[string]any{
				"id":          f.ID,
				"name":        f.Name,
				"description": f.Description,
				"flagType":    string(f.FlagType),
			},
			"environments": envs,
			"toggles":      toggles,
		},
	)
}

func (h *FlagHandler) Update(ctx echo.Context) error {
	projectID, err := strconv.Atoi(ctx.Param("projectId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Project not found")
	}

	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Flag not found")
	}

	var f FlagForm
	if err := form.Submit(ctx, &f); err != nil {
		form.ShareErrors(ctx, &f)
		h.Inertia.Back(ctx.Response(), ctx.Request())
		return nil
	}

	_, err = h.ORM.Flag.
		UpdateOneID(id).
		SetName(f.Name).
		SetNillableDescription(nilIfEmpty(f.Description)).
		SetFlagType(entflag.FlagType(f.FlagType)).
		Save(ctx.Request().Context())
	if err != nil {
		return fail(err, "failed to update flag", h.Inertia, ctx)
	}

	msg.Success(ctx, "Flag updated successfully.")
	return ctx.Redirect(http.StatusSeeOther, fmt.Sprintf("/projects/%d", projectID))
}

func (h *FlagHandler) Delete(ctx echo.Context) error {
	projectID, err := strconv.Atoi(ctx.Param("projectId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Project not found")
	}

	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Flag not found")
	}

	if err := h.ORM.Flag.DeleteOneID(id).Exec(ctx.Request().Context()); err != nil {
		return fail(err, "failed to delete flag", h.Inertia, ctx)
	}

	msg.Success(ctx, "Flag deleted successfully.")
	return ctx.Redirect(http.StatusSeeOther, fmt.Sprintf("/projects/%d", projectID))
}

// Toggle creates or updates a FlagEnvironment record to toggle a flag's enabled state.
func (h *FlagHandler) Toggle(ctx echo.Context) error {
	projectID, err := strconv.Atoi(ctx.Param("projectId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Project not found")
	}

	flagID, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Flag not found")
	}

	var body struct {
		EnvironmentID int  `json:"environmentId"`
		Enabled       bool `json:"enabled"`
	}
	if err := json.NewDecoder(ctx.Request().Body).Decode(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	reqCtx := ctx.Request().Context()

	fe, err := getOrCreateFlagEnvironment(reqCtx, h.ORM, flagID, body.EnvironmentID)
	if err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]any{"error": "failed to toggle flag"})
	}

	_, err = fe.Update().SetEnabled(body.Enabled).Save(reqCtx)
	if err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]any{"error": "failed to toggle flag"})
	}

	_ = projectID // validated above
	return ctx.JSON(http.StatusOK, map[string]any{"enabled": body.Enabled})
}

// getOrCreateFlagEnvironment finds or creates a FlagEnvironment record for the given flag+environment pair.
func getOrCreateFlagEnvironment(ctx context.Context, orm *ent.Client, flagID, envID int) (*ent.FlagEnvironment, error) {
	fe, err := orm.FlagEnvironment.
		Query().
		Where(
			flagenvironment.FlagID(flagID),
			flagenvironment.EnvironmentID(envID),
		).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return orm.FlagEnvironment.
				Create().
				SetFlagID(flagID).
				SetEnvironmentID(envID).
				SetEnabled(false).
				Save(ctx)
		}
		return nil, err
	}
	return fe, nil
}

// ListStrategies returns all strategies (with constraints) for a flag+environment pair.
func (h *FlagHandler) ListStrategies(ctx echo.Context) error {
	flagID, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Flag not found")
	}

	envIDStr := ctx.QueryParam("env")
	envID, err := strconv.Atoi(envIDStr)
	if err != nil {
		return ctx.JSON(http.StatusBadRequest, map[string]any{"error": "env query param required"})
	}

	reqCtx := ctx.Request().Context()

	fe, err := h.ORM.FlagEnvironment.
		Query().
		Where(
			flagenvironment.FlagID(flagID),
			flagenvironment.EnvironmentID(envID),
		).
		Only(reqCtx)
	if err != nil {
		if ent.IsNotFound(err) {
			return ctx.JSON(http.StatusOK, map[string]any{"strategies": []any{}})
		}
		return ctx.JSON(http.StatusInternalServerError, map[string]any{"error": "failed to query"})
	}

	strategies, err := h.ORM.Strategy.
		Query().
		Where(strategy.FlagEnvironmentID(fe.ID)).
		WithConstraints().
		Order(ent.Asc(strategy.FieldSortOrder)).
		All(reqCtx)
	if err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]any{"error": "failed to query strategies"})
	}

	result := make([]map[string]any, 0, len(strategies))
	for _, s := range strategies {
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
		result = append(result, map[string]any{
			"id":          s.ID,
			"name":        s.Name,
			"parameters":  s.Parameters,
			"sort_order":  s.SortOrder,
			"constraints": constraints,
		})
	}

	return ctx.JSON(http.StatusOK, map[string]any{"strategies": result})
}

// StoreStrategy creates a new strategy with constraints for a flag+environment pair.
func (h *FlagHandler) StoreStrategy(ctx echo.Context) error {
	flagID, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Flag not found")
	}

	var input StrategyInput
	if err := json.NewDecoder(ctx.Request().Body).Decode(&input); err != nil {
		return ctx.JSON(http.StatusBadRequest, map[string]any{"error": "Invalid request body"})
	}

	if input.Name == "" {
		return ctx.JSON(http.StatusBadRequest, map[string]any{"error": "name is required"})
	}

	reqCtx := ctx.Request().Context()

	fe, err := getOrCreateFlagEnvironment(reqCtx, h.ORM, flagID, input.EnvironmentID)
	if err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]any{"error": "failed to get/create flag environment"})
	}

	tx, err := h.ORM.Tx(reqCtx)
	if err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]any{"error": "failed to start transaction"})
	}

	s, err := tx.Strategy.
		Create().
		SetName(input.Name).
		SetParameters(input.Parameters).
		SetSortOrder(input.SortOrder).
		SetFlagEnvironmentID(fe.ID).
		Save(reqCtx)
	if err != nil {
		tx.Rollback()
		return ctx.JSON(http.StatusInternalServerError, map[string]any{"error": "failed to create strategy"})
	}

	constraints := make([]map[string]any, 0, len(input.Constraints))
	for _, ci := range input.Constraints {
		c, err := tx.Constraint.
			Create().
			SetContextName(ci.ContextName).
			SetOperator(entconstraint.Operator(ci.Operator)).
			SetValues(ci.Values).
			SetInverted(ci.Inverted).
			SetCaseInsensitive(ci.CaseInsensitive).
			SetStrategyID(s.ID).
			Save(reqCtx)
		if err != nil {
			tx.Rollback()
			return ctx.JSON(http.StatusInternalServerError, map[string]any{"error": "failed to create constraint"})
		}
		constraints = append(constraints, map[string]any{
			"id":               c.ID,
			"context_name":     c.ContextName,
			"operator":         string(c.Operator),
			"values":           c.Values,
			"inverted":         c.Inverted,
			"case_insensitive": c.CaseInsensitive,
		})
	}

	if err := tx.Commit(); err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]any{"error": "failed to commit"})
	}

	return ctx.JSON(http.StatusCreated, map[string]any{
		"id":          s.ID,
		"name":        s.Name,
		"parameters":  s.Parameters,
		"sort_order":  s.SortOrder,
		"constraints": constraints,
	})
}

// UpdateStrategy updates a strategy and replaces its constraints.
func (h *FlagHandler) UpdateStrategy(ctx echo.Context) error {
	strategyID, err := strconv.Atoi(ctx.Param("strategyId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Strategy not found")
	}

	var input StrategyInput
	if err := json.NewDecoder(ctx.Request().Body).Decode(&input); err != nil {
		return ctx.JSON(http.StatusBadRequest, map[string]any{"error": "Invalid request body"})
	}

	if input.Name == "" {
		return ctx.JSON(http.StatusBadRequest, map[string]any{"error": "name is required"})
	}

	reqCtx := ctx.Request().Context()

	tx, err := h.ORM.Tx(reqCtx)
	if err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]any{"error": "failed to start transaction"})
	}

	s, err := tx.Strategy.
		UpdateOneID(strategyID).
		SetName(input.Name).
		SetParameters(input.Parameters).
		SetSortOrder(input.SortOrder).
		Save(reqCtx)
	if err != nil {
		tx.Rollback()
		if ent.IsNotFound(err) {
			return ctx.JSON(http.StatusNotFound, map[string]any{"error": "strategy not found"})
		}
		return ctx.JSON(http.StatusInternalServerError, map[string]any{"error": "failed to update strategy"})
	}

	// Delete all existing constraints for this strategy.
	_, err = tx.Constraint.Delete().
		Where(entconstraint.StrategyID(strategyID)).
		Exec(reqCtx)
	if err != nil {
		tx.Rollback()
		return ctx.JSON(http.StatusInternalServerError, map[string]any{"error": "failed to delete old constraints"})
	}

	// Recreate constraints from input.
	constraints := make([]map[string]any, 0, len(input.Constraints))
	for _, ci := range input.Constraints {
		c, err := tx.Constraint.
			Create().
			SetContextName(ci.ContextName).
			SetOperator(entconstraint.Operator(ci.Operator)).
			SetValues(ci.Values).
			SetInverted(ci.Inverted).
			SetCaseInsensitive(ci.CaseInsensitive).
			SetStrategyID(s.ID).
			Save(reqCtx)
		if err != nil {
			tx.Rollback()
			return ctx.JSON(http.StatusInternalServerError, map[string]any{"error": "failed to create constraint"})
		}
		constraints = append(constraints, map[string]any{
			"id":               c.ID,
			"context_name":     c.ContextName,
			"operator":         string(c.Operator),
			"values":           c.Values,
			"inverted":         c.Inverted,
			"case_insensitive": c.CaseInsensitive,
		})
	}

	if err := tx.Commit(); err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]any{"error": "failed to commit"})
	}

	return ctx.JSON(http.StatusOK, map[string]any{
		"id":          s.ID,
		"name":        s.Name,
		"parameters":  s.Parameters,
		"sort_order":  s.SortOrder,
		"constraints": constraints,
	})
}

// DeleteStrategy deletes a strategy and its constraints.
func (h *FlagHandler) DeleteStrategy(ctx echo.Context) error {
	strategyID, err := strconv.Atoi(ctx.Param("strategyId"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Strategy not found")
	}

	reqCtx := ctx.Request().Context()

	// Delete constraints first (SQLite has no FK cascade).
	_, err = h.ORM.Constraint.Delete().
		Where(entconstraint.StrategyID(strategyID)).
		Exec(reqCtx)
	if err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]any{"error": "failed to delete constraints"})
	}

	err = h.ORM.Strategy.DeleteOneID(strategyID).Exec(reqCtx)
	if err != nil {
		if ent.IsNotFound(err) {
			return ctx.JSON(http.StatusNotFound, map[string]any{"error": "strategy not found"})
		}
		return ctx.JSON(http.StatusInternalServerError, map[string]any{"error": "failed to delete strategy"})
	}

	return ctx.JSON(http.StatusOK, map[string]any{"ok": true})
}
