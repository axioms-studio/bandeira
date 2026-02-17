package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"entgo.io/ent/dialect/sql"
	"github.com/labstack/echo/v4"

	"github.com/felipekafuri/bandeira/ent"
	"github.com/felipekafuri/bandeira/ent/user"
	"github.com/felipekafuri/bandeira/pkg/form"
	"github.com/felipekafuri/bandeira/pkg/middleware"
	"github.com/felipekafuri/bandeira/pkg/msg"
	"github.com/felipekafuri/bandeira/pkg/services"
	"github.com/felipekafuri/bandeira/pkg/session"
	inertia "github.com/romsar/gonertia/v2"
	"golang.org/x/crypto/bcrypt"
)

type UserHandler struct {
	Inertia *inertia.Inertia
	ORM     *ent.Client
}

type UserForm struct {
	form.Submission

	Name     string `form:"name" json:"name" validate:"required"`
	Email    string `form:"email" json:"email" validate:"required,email"`
	Password string `form:"password" json:"password"`
	Role     string `form:"role" json:"role" validate:"required,oneof=admin editor viewer"`
}

func init() {
	Register(new(UserHandler))
}

func (h *UserHandler) Init(c *services.Container) error {
	h.Inertia = c.Inertia
	h.ORM = c.ORM
	return nil
}

func (h *UserHandler) Routes(g *echo.Group) {
	users := g.Group("/users", middleware.RequireAuth(), middleware.RequireRole(h.ORM, "admin"))
	users.GET("", h.Index)
	users.GET("/create", h.Create)
	users.POST("", h.Store)
	users.GET("/:id/edit", h.Edit)
	users.PUT("/:id", h.Update)
	users.DELETE("/:id", h.Delete)
}

func (h *UserHandler) Index(ctx echo.Context) error {
	users, err := h.ORM.User.Query().
		Order(user.ByCreatedAt(sql.OrderDesc())).
		All(ctx.Request().Context())
	if err != nil {
		return fail(err, "failed to query users", h.Inertia, ctx)
	}

	type userItem struct {
		ID        int    `json:"id"`
		Name      string `json:"name"`
		Email     string `json:"email"`
		Role      string `json:"role"`
		CreatedAt string `json:"createdAt"`
	}

	items := make([]userItem, 0, len(users))
	for _, u := range users {
		items = append(items, userItem{
			ID:        u.ID,
			Name:      u.Name,
			Email:     u.Email,
			Role:      string(u.Role),
			CreatedAt: u.CreatedAt.Format("Jan 2, 2006"),
		})
	}

	return h.Inertia.Render(
		ctx.Response().Writer,
		ctx.Request(),
		"Users/Index",
		inertia.Props{
			"users": items,
		},
	)
}

func (h *UserHandler) Create(ctx echo.Context) error {
	return h.Inertia.Render(
		ctx.Response().Writer,
		ctx.Request(),
		"Users/Create",
		inertia.Props{},
	)
}

func (h *UserHandler) Store(ctx echo.Context) error {
	var f UserForm
	if err := form.Submit(ctx, &f); err != nil {
		form.ShareErrors(ctx, &f)
		h.Inertia.Back(ctx.Response(), ctx.Request())
		return nil
	}

	if f.Password == "" {
		f.SetFieldError("Password", "Password is required.")
		form.ShareErrors(ctx, &f)
		h.Inertia.Back(ctx.Response(), ctx.Request())
		return nil
	}

	// Check unique email
	exists, err := h.ORM.User.Query().Where(user.Email(f.Email)).Exist(ctx.Request().Context())
	if err != nil {
		return fail(err, "failed to check email", h.Inertia, ctx)
	}
	if exists {
		f.SetFieldError("Email", "A user with this email already exists.")
		form.ShareErrors(ctx, &f)
		h.Inertia.Back(ctx.Response(), ctx.Request())
		return nil
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(f.Password), bcrypt.DefaultCost)
	if err != nil {
		return fail(err, "failed to hash password", h.Inertia, ctx)
	}

	_, err = h.ORM.User.Create().
		SetName(f.Name).
		SetEmail(f.Email).
		SetPassword(string(hash)).
		SetRole(user.Role(f.Role)).
		Save(ctx.Request().Context())
	if err != nil {
		return fail(err, "failed to create user", h.Inertia, ctx)
	}

	msg.Success(ctx, "User created successfully.")
	return ctx.Redirect(http.StatusSeeOther, "/users")
}

func (h *UserHandler) Edit(ctx echo.Context) error {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "User not found")
	}

	u, err := h.ORM.User.Get(ctx.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "User not found")
	}

	return h.Inertia.Render(
		ctx.Response().Writer,
		ctx.Request(),
		"Users/Edit",
		inertia.Props{
			"editUser": map[string]any{
				"id":    u.ID,
				"name":  u.Name,
				"email": u.Email,
				"role":  string(u.Role),
			},
		},
	)
}

func (h *UserHandler) Update(ctx echo.Context) error {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "User not found")
	}

	var f UserForm
	if err := form.Submit(ctx, &f); err != nil {
		form.ShareErrors(ctx, &f)
		h.Inertia.Back(ctx.Response(), ctx.Request())
		return nil
	}

	// Check unique email (excluding current user)
	exists, err := h.ORM.User.Query().
		Where(user.Email(f.Email), user.IDNEQ(id)).
		Exist(ctx.Request().Context())
	if err != nil {
		return fail(err, "failed to check email", h.Inertia, ctx)
	}
	if exists {
		f.SetFieldError("Email", "A user with this email already exists.")
		form.ShareErrors(ctx, &f)
		h.Inertia.Back(ctx.Response(), ctx.Request())
		return nil
	}

	update := h.ORM.User.UpdateOneID(id).
		SetName(f.Name).
		SetEmail(f.Email).
		SetRole(user.Role(f.Role))

	if f.Password != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(f.Password), bcrypt.DefaultCost)
		if err != nil {
			return fail(err, "failed to hash password", h.Inertia, ctx)
		}
		update = update.SetPassword(string(hash))
	}

	_, err = update.Save(ctx.Request().Context())
	if err != nil {
		return fail(err, "failed to update user", h.Inertia, ctx)
	}

	msg.Success(ctx, "User updated successfully.")
	return ctx.Redirect(http.StatusSeeOther, fmt.Sprintf("/users/%d/edit", id))
}

func (h *UserHandler) Delete(ctx echo.Context) error {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "User not found")
	}

	// Prevent self-delete
	currentUserID, ok := session.GetAuthenticatedUserID(ctx)
	if ok && currentUserID == id {
		msg.Danger(ctx, "You cannot delete your own account.")
		h.Inertia.Back(ctx.Response(), ctx.Request())
		return nil
	}

	if err := h.ORM.User.DeleteOneID(id).Exec(ctx.Request().Context()); err != nil {
		return fail(err, "failed to delete user", h.Inertia, ctx)
	}

	msg.Success(ctx, "User deleted successfully.")
	return ctx.Redirect(http.StatusSeeOther, "/users")
}
