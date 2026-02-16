package handlers

import (
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/felipekafuri/bandeira/pkg/routenames"
	"github.com/felipekafuri/bandeira/pkg/services"
	inertia "github.com/romsar/gonertia/v2"
)

type Pages struct {
	Inertia *inertia.Inertia
}

func init() {
	Register(new(Pages))
}

func (h *Pages) Init(c *services.Container) error {
	h.Inertia = c.Inertia
	return nil
}

func (h *Pages) Routes(g *echo.Group) {
	g.GET("/", h.Welcome).Name = routenames.Welcome
	g.GET("/strategies", h.Strategies).Name = routenames.Strategies
	g.GET("/brand", h.Brand).Name = routenames.Brand
}

func (h *Pages) Welcome(ctx echo.Context) error {
	err := h.Inertia.Render(
		ctx.Response().Writer,
		ctx.Request(),
		"Welcome",
		inertia.Props{},
	)
	if err != nil {
		handleServerErr(ctx.Response().Writer, err)
		return err
	}

	return nil
}

func (h *Pages) Strategies(ctx echo.Context) error {
	err := h.Inertia.Render(
		ctx.Response().Writer,
		ctx.Request(),
		"Strategies",
		inertia.Props{},
	)
	if err != nil {
		handleServerErr(ctx.Response().Writer, err)
		return err
	}

	return nil
}

func (h *Pages) Brand(ctx echo.Context) error {
	err := h.Inertia.Render(
		ctx.Response().Writer,
		ctx.Request(),
		"Brand",
		inertia.Props{},
	)
	if err != nil {
		handleServerErr(ctx.Response().Writer, err)
		return err
	}

	return nil
}

func handleServerErr(w http.ResponseWriter, err error) {
	log.Printf("http error: %s\n", err)
	w.WriteHeader(http.StatusInternalServerError)
	w.Write([]byte("server error"))
}
