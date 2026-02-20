package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"

	"github.com/felipekafuri/bandeira/ent"
	"github.com/felipekafuri/bandeira/ent/environment"
	entflag "github.com/felipekafuri/bandeira/ent/flag"
	"github.com/felipekafuri/bandeira/ent/flagenvironment"
	appctx "github.com/felipekafuri/bandeira/pkg/context"
	"github.com/felipekafuri/bandeira/pkg/middleware"
	"github.com/felipekafuri/bandeira/pkg/routenames"
	"github.com/felipekafuri/bandeira/pkg/services"
)

type ClientAPI struct {
	ORM *ent.Client
	Hub *services.Hub
}

func init() {
	Register(new(ClientAPI))
}

func (h *ClientAPI) Init(c *services.Container) error {
	h.ORM = c.ORM
	h.Hub = c.Hub
	return nil
}

func (h *ClientAPI) Routes(_ *echo.Group) {}

func (h *ClientAPI) APIRoutes(api *echo.Group) {
	v1 := api.Group("/v1", middleware.RequireTokenAuth(h.ORM, "client"))
	v1.GET("/flags", h.GetFlags).Name = routenames.APIGetFlags
}

func (h *ClientAPI) StreamAPIRoutes(g *echo.Group) {
	g.GET("", h.Stream, middleware.RequireTokenAuth(h.ORM, "client")).Name = routenames.APIStreamFlags
}

func (h *ClientAPI) GetFlags(ctx echo.Context) error {
	tok := ctx.Get(appctx.APITokenKey).(*ent.ApiToken)
	reqCtx := ctx.Request().Context()

	payload, err := buildFlagPayload(reqCtx, h.ORM, tok.ProjectID, tok.Environment)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to load flags")
	}

	return ctx.JSONBlob(http.StatusOK, payload)
}

// Stream serves an SSE endpoint that pushes flag state whenever it changes.
func (h *ClientAPI) Stream(ctx echo.Context) error {
	tok := ctx.Get(appctx.APITokenKey).(*ent.ApiToken)
	reqCtx := ctx.Request().Context()

	// Set SSE headers.
	res := ctx.Response()
	res.Header().Set("Content-Type", "text/event-stream")
	res.Header().Set("Cache-Control", "no-cache")
	res.Header().Set("Connection", "keep-alive")
	res.WriteHeader(http.StatusOK)
	res.Flush()

	// Send initial flag state.
	if err := writeSSEFlags(res, h.ORM, tok.ProjectID, tok.Environment); err != nil {
		return nil
	}

	notify, unsub := h.Hub.Subscribe(tok.ProjectID, tok.Environment)
	defer unsub()

	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-reqCtx.Done():
			return nil
		case _, ok := <-notify:
			if !ok {
				return nil
			}
			if err := writeSSEFlags(res, h.ORM, tok.ProjectID, tok.Environment); err != nil {
				return nil
			}
		case <-ticker.C:
			if _, err := fmt.Fprint(res, ":heartbeat\n\n"); err != nil {
				return nil
			}
			res.Flush()
		}
	}
}

// writeSSEFlags queries the current flag state and writes it as an SSE event.
func writeSSEFlags(res *echo.Response, orm *ent.Client, projectID int, envName string) error {
	payload, err := buildFlagPayload(context.Background(), orm, projectID, envName)
	if err != nil {
		return err
	}

	if _, err := fmt.Fprintf(res, "event: flags\ndata: %s\n\n", payload); err != nil {
		return err
	}
	res.Flush()
	return nil
}

// buildFlagPayload queries all flags for a project+environment and returns
// the JSON-encoded response. Shared by GetFlags and Stream.
func buildFlagPayload(ctx context.Context, orm *ent.Client, projectID int, envName string) ([]byte, error) {
	env, err := orm.Environment.Query().
		Where(
			environment.Name(envName),
			environment.ProjectID(projectID),
		).
		Only(ctx)
	if err != nil {
		return nil, err
	}

	flags, err := orm.Flag.Query().
		Where(entflag.ProjectID(projectID)).
		WithFlagEnvironments(func(q *ent.FlagEnvironmentQuery) {
			q.Where(flagenvironment.EnvironmentID(env.ID))
			q.WithStrategies(func(sq *ent.StrategyQuery) {
				sq.WithConstraints()
			})
		}).
		All(ctx)
	if err != nil {
		return nil, err
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

	return json.Marshal(map[string]any{"flags": result})
}
