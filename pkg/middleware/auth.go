package middleware

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/felipekafuri/bandeira/ent"
	"github.com/felipekafuri/bandeira/pkg/context"
	"github.com/felipekafuri/bandeira/pkg/session"
)

// RequireAuth redirects unauthenticated users to the login page.
func RequireAuth() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(ctx echo.Context) error {
			if !session.IsAuthenticated(ctx) {
				return ctx.Redirect(http.StatusSeeOther, "/user/login")
			}
			return next(ctx)
		}
	}
}

// RequireGuest redirects authenticated users to the dashboard.
func RequireGuest() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(ctx echo.Context) error {
			if session.IsAuthenticated(ctx) {
				return ctx.Redirect(http.StatusSeeOther, "/dashboard")
			}
			return next(ctx)
		}
	}
}

// RequireRole checks that the authenticated user has one of the allowed roles.
// It loads the user from the database and stores it in the context for downstream handlers.
// Returns 403 if the user's role is not in the allowed set.
func RequireRole(orm *ent.Client, roles ...string) echo.MiddlewareFunc {
	allowed := make(map[string]bool, len(roles))
	for _, r := range roles {
		allowed[r] = true
	}

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(ctx echo.Context) error {
			userID, ok := session.GetAuthenticatedUserID(ctx)
			if !ok {
				return ctx.Redirect(http.StatusSeeOther, "/user/login")
			}

			u, err := orm.User.Get(ctx.Request().Context(), userID)
			if err != nil {
				return ctx.Redirect(http.StatusSeeOther, "/user/login")
			}

			if !allowed[string(u.Role)] {
				return echo.NewHTTPError(http.StatusForbidden, "You do not have permission to perform this action")
			}

			ctx.Set(context.AuthKey, u)
			return next(ctx)
		}
	}
}
