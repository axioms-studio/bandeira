package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/felipekafuri/bandeira/ent"
	"github.com/felipekafuri/bandeira/ent/environment"
	entflag "github.com/felipekafuri/bandeira/ent/flag"
	"github.com/felipekafuri/bandeira/ent/flagenvironment"
	"github.com/felipekafuri/bandeira/pkg/context"
	"github.com/felipekafuri/bandeira/pkg/middleware"
	"github.com/felipekafuri/bandeira/pkg/routenames"
	"github.com/felipekafuri/bandeira/pkg/services"
)

type ClientAPI struct {
	ORM *ent.Client
}

func init() {
	Register(new(ClientAPI))
}

func (h *ClientAPI) Init(c *services.Container) error {
	h.ORM = c.ORM
	return nil
}

func (h *ClientAPI) Routes(_ *echo.Group) {}

func (h *ClientAPI) APIRoutes(api *echo.Group) {
	v1 := api.Group("/v1", middleware.RequireTokenAuth(h.ORM, "client"))
	v1.GET("/flags", h.GetFlags).Name = routenames.APIGetFlags
}

func (h *ClientAPI) GetFlags(ctx echo.Context) error {
	tok := ctx.Get(context.APITokenKey).(*ent.ApiToken)

	reqCtx := ctx.Request().Context()

	// Resolve the environment by name + project.
	env, err := h.ORM.Environment.Query().
		Where(
			environment.Name(tok.Environment),
			environment.ProjectID(tok.ProjectID),
		).
		Only(reqCtx)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Environment not found for this token")
	}

	// Load all flags for the project, eager-loading FlagEnvironments (filtered
	// to the token's environment) → Strategies → Constraints.
	flags, err := h.ORM.Flag.Query().
		Where(entflag.ProjectID(tok.ProjectID)).
		WithFlagEnvironments(func(q *ent.FlagEnvironmentQuery) {
			q.Where(flagenvironment.EnvironmentID(env.ID))
			q.WithStrategies(func(sq *ent.StrategyQuery) {
				sq.WithConstraints()
			})
		}).
		All(reqCtx)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to load flags")
	}

	type constraintDTO struct {
		ContextName     string   `json:"context_name"`
		Operator        string   `json:"operator"`
		Values          []string `json:"values"`
		Inverted        bool     `json:"inverted"`
		CaseInsensitive bool     `json:"case_insensitive"`
	}

	type strategyDTO struct {
		Name        string          `json:"name"`
		Parameters  map[string]any  `json:"parameters,omitempty"`
		Constraints []constraintDTO `json:"constraints"`
	}

	type flagDTO struct {
		Name       string        `json:"name"`
		Enabled    bool          `json:"enabled"`
		Strategies []strategyDTO `json:"strategies"`
	}

	result := make([]flagDTO, 0, len(flags))
	for _, f := range flags {
		dto := flagDTO{
			Name:       f.Name,
			Enabled:    false,
			Strategies: []strategyDTO{},
		}

		if len(f.Edges.FlagEnvironments) > 0 {
			fe := f.Edges.FlagEnvironments[0]
			dto.Enabled = fe.Enabled

			for _, s := range fe.Edges.Strategies {
				sd := strategyDTO{
					Name:        s.Name,
					Parameters:  s.Parameters,
					Constraints: []constraintDTO{},
				}
				for _, c := range s.Edges.Constraints {
					sd.Constraints = append(sd.Constraints, constraintDTO{
						ContextName:     c.ContextName,
						Operator:        string(c.Operator),
						Values:          c.Values,
						Inverted:        c.Inverted,
						CaseInsensitive: c.CaseInsensitive,
					})
				}
				dto.Strategies = append(dto.Strategies, sd)
			}
		}

		result = append(result, dto)
	}

	return ctx.JSON(http.StatusOK, map[string]any{
		"flags": result,
	})
}
