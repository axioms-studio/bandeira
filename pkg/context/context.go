package context

import (
	"context"
	"errors"

	"github.com/labstack/echo/v4"
)

const (
	// FormKey is the key used to store a form in context.
	FormKey = "form"

	// LoggerKey is the key used to store a structured logger in context.
	LoggerKey = "logger"

	// SessionKey is the key used to store the session data in context.
	SessionKey = "session"

	// CSRFKey is the key used to store the CSRF token in context.
	CSRFKey = "csrf"

	// ConfigKey is the key used to store the configuration in context.
	ConfigKey = "config"

	// AuthKey is the key used to store auth state in context.
	AuthKey = "auth"

	// APITokenKey is the key used to store a resolved API token in context.
	APITokenKey = "api_token"
)

// IsCanceledError determines if an error is due to a context cancellation.
func IsCanceledError(err error) bool {
	return errors.Is(err, context.Canceled)
}

// Cache checks if a value of a given type exists in the Echo context for a given key and returns that, otherwise
// it will use a callback to generate a value, which is stored in the context then returned.
func Cache[T any](ctx echo.Context, key string, gen func(echo.Context) T) T {
	if val := ctx.Get(key); val != nil {
		if v, ok := val.(T); ok {
			return v
		}
	}
	val := gen(ctx)
	ctx.Set(key, val)
	return val
}
