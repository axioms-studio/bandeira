package middleware

import (
	"github.com/labstack/echo/v4"
	"github.com/felipekafuri/bandeira/pkg/msg"
	"github.com/felipekafuri/bandeira/pkg/session"
	"github.com/romsar/gonertia/v2"
)

func InertiaProps() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(ctx echo.Context) error {
			// Collect errors by type
			flash := make(map[string][]string)
			for _, typ := range []msg.Type{
				msg.TypeSuccess,
				msg.TypeInfo,
				msg.TypeWarning,
				msg.TypeDanger,
			} {
				messages := msg.Get(ctx, typ)
				if len(messages) > 0 {
					flash[string(typ)] = messages
				}
			}

			// Build auth prop
			var auth any
			if session.IsAuthenticated(ctx) {
				auth = map[string]any{
					"user": map[string]any{
						"id":    1,
						"name":  "Admin",
						"email": "admin@bandeira.local",
					},
				}
			}

			// Set Inertia props
			newCtx := gonertia.SetProps(ctx.Request().Context(), map[string]any{
				"flash": flash,
				"auth":  auth,
			})

			// Replace request context
			ctx.SetRequest(ctx.Request().WithContext(newCtx))

			return next(ctx)
		}
	}
}
