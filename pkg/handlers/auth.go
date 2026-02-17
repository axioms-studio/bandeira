package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/felipekafuri/bandeira/ent"
	"github.com/felipekafuri/bandeira/ent/user"
	"github.com/felipekafuri/bandeira/pkg/form"
	"github.com/felipekafuri/bandeira/pkg/middleware"
	"github.com/felipekafuri/bandeira/pkg/msg"
	"github.com/felipekafuri/bandeira/pkg/routenames"
	"github.com/felipekafuri/bandeira/pkg/session"
	"github.com/felipekafuri/bandeira/pkg/services"
	inertia "github.com/romsar/gonertia/v2"
	"golang.org/x/crypto/bcrypt"
)

type Auth struct {
	Inertia *inertia.Inertia
	ORM     *ent.Client
}

type LoginForm struct {
	form.Submission

	Email    string `form:"email" validate:"required,email"`
	Password string `form:"password" validate:"required"`
}

func init() {
	Register(new(Auth))
}

func (h *Auth) Init(c *services.Container) error {
	h.Inertia = c.Inertia
	h.ORM = c.ORM
	return nil
}

func (h *Auth) Routes(g *echo.Group) {
	u := g.Group("/user")
	u.GET("/login", h.LoginPage, middleware.RequireGuest()).Name = routenames.UserLogin
	u.POST("/login", h.LoginSubmit, middleware.RequireGuest())
	u.POST("/logout", h.Logout).Name = routenames.UserLogout
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

	u, err := h.ORM.User.Query().Where(user.Email(f.Email)).Only(ctx.Request().Context())
	if err != nil {
		f.SetFieldError("Email", "Invalid email or password.")
		form.ShareErrors(ctx, &f)
		h.Inertia.Back(ctx.Response(), ctx.Request())
		return nil
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(f.Password)); err != nil {
		f.SetFieldError("Email", "Invalid email or password.")
		form.ShareErrors(ctx, &f)
		h.Inertia.Back(ctx.Response(), ctx.Request())
		return nil
	}

	if err := session.SetAuthenticatedUser(ctx, u.ID); err != nil {
		return err
	}

	msg.Success(ctx, "Welcome back!")
	return ctx.Redirect(http.StatusSeeOther, "/dashboard")
}

func (h *Auth) Logout(ctx echo.Context) error {
	if err := session.ClearAuth(ctx); err != nil {
		return err
	}

	msg.Success(ctx, "You have been logged out.")
	return ctx.Redirect(http.StatusSeeOther, "/")
}
