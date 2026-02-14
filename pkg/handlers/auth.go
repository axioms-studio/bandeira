package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/felipekafuri/bandeira/config"
	"github.com/felipekafuri/bandeira/pkg/form"
	"github.com/felipekafuri/bandeira/pkg/middleware"
	"github.com/felipekafuri/bandeira/pkg/msg"
	"github.com/felipekafuri/bandeira/pkg/routenames"
	"github.com/felipekafuri/bandeira/pkg/session"
	"github.com/felipekafuri/bandeira/pkg/services"
	inertia "github.com/romsar/gonertia/v2"
)

type Auth struct {
	Inertia *inertia.Inertia
	Config  *config.Config
}

type LoginForm struct {
	form.Submission

	Password string `form:"password" validate:"required"`
}

func init() {
	Register(new(Auth))
}

func (h *Auth) Init(c *services.Container) error {
	h.Inertia = c.Inertia
	h.Config = c.Config
	return nil
}

func (h *Auth) Routes(g *echo.Group) {
	user := g.Group("/user")
	user.GET("/login", h.LoginPage, middleware.RequireGuest()).Name = routenames.UserLogin
	user.POST("/login", h.LoginSubmit, middleware.RequireGuest())
	user.POST("/logout", h.Logout).Name = routenames.UserLogout
}

func (h *Auth) LoginPage(ctx echo.Context) error {
	return h.Inertia.Render(
		ctx.Response().Writer,
		ctx.Request(),
		"Auth/Login",
		inertia.Props{},
	)
}

func (h *Auth) LoginSubmit(ctx echo.Context) error {
	var f LoginForm
	if err := form.Submit(ctx, &f); err != nil {
		form.ShareErrors(ctx, &f)
		h.Inertia.Back(ctx.Response(), ctx.Request())
		return nil
	}

	if f.Password != h.Config.Auth.AdminPassword {
		f.SetFieldError("Password", "Invalid password.")
		form.ShareErrors(ctx, &f)
		h.Inertia.Back(ctx.Response(), ctx.Request())
		return nil
	}

	if err := session.SetAuthenticated(ctx, true); err != nil {
		return err
	}

	msg.Success(ctx, "Welcome back!")
	return ctx.Redirect(http.StatusSeeOther, "/dashboard")
}

func (h *Auth) Logout(ctx echo.Context) error {
	if err := session.SetAuthenticated(ctx, false); err != nil {
		return err
	}

	msg.Success(ctx, "You have been logged out.")
	return ctx.Redirect(http.StatusSeeOther, "/")
}
