package middleware

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"

	"github.com/felipekafuri/bandeira/ent"
	"github.com/felipekafuri/bandeira/ent/apitoken"
	"github.com/felipekafuri/bandeira/pkg/context"
	"github.com/felipekafuri/bandeira/pkg/token"
)

// RequireTokenAuth validates a Bearer token from the Authorization header.
// It hashes the incoming token with SHA-256, looks it up in the database,
// and stores the resolved *ent.ApiToken in the echo context under APITokenKey.
func RequireTokenAuth(orm *ent.Client, tokenType string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(ctx echo.Context) error {
			auth := ctx.Request().Header.Get("Authorization")
			if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
				return echo.NewHTTPError(http.StatusUnauthorized, "Missing or invalid Authorization header")
			}

			raw := strings.TrimPrefix(auth, "Bearer ")
			hashed := token.Hash(raw)

			query := orm.ApiToken.Query().
				Where(apitoken.Secret(hashed)).
				WithProject()

			if tokenType != "" {
				query = query.Where(apitoken.TokenTypeEQ(apitoken.TokenType(tokenType)))
			}

			tok, err := query.Only(ctx.Request().Context())
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "Invalid API token")
			}

			ctx.Set(context.APITokenKey, tok)
			return next(ctx)
		}
	}
}
