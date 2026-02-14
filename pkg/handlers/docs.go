package handlers

import (
	"github.com/labstack/echo/v4"

	"github.com/felipekafuri/bandeira/pkg/middleware"
	"github.com/felipekafuri/bandeira/pkg/routenames"
	"github.com/felipekafuri/bandeira/pkg/services"
	inertia "github.com/romsar/gonertia/v2"
)

type Docs struct {
	Inertia *inertia.Inertia
}

func init() {
	Register(new(Docs))
}

func (h *Docs) Init(c *services.Container) error {
	h.Inertia = c.Inertia
	return nil
}

func (h *Docs) Routes(g *echo.Group) {
	g.GET("/docs", h.Index, middleware.RequireAuth()).Name = routenames.Docs
}

func (h *Docs) Index(ctx echo.Context) error {
	return h.Inertia.Render(
		ctx.Response().Writer,
		ctx.Request(),
		"Docs",
		inertia.Props{},
	)
}
