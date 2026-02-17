package middleware

import (
	"github.com/labstack/echo/v4"
	"github.com/felipekafuri/bandeira/ent"
	"github.com/felipekafuri/bandeira/pkg/msg"
	"github.com/felipekafuri/bandeira/pkg/session"
	"github.com/romsar/gonertia/v2"
)

func InertiaProps(orm *ent.Client) echo.MiddlewareFunc {
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
			if userID, ok := session.GetAuthenticatedUserID(ctx); ok {
				u, err := orm.User.Get(ctx.Request().Context(), userID)
				if err == nil {
					auth = map[string]any{
						"user": map[string]any{
							"id":    u.ID,
							"name":  u.Name,
							"email": u.Email,
							"role":  string(u.Role),
						},
					}
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
