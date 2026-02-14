package middleware

import (
	"net/http"

	"github.com/labstack/echo/v4"
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
