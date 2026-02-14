package session

import (
	"github.com/labstack/echo/v4"
)

const (
	authSessionName = "auth"
	authKey         = "authenticated"
)

// IsAuthenticated checks if the current session is authenticated.
func IsAuthenticated(ctx echo.Context) bool {
	sess, err := Get(ctx, authSessionName)
	if err != nil {
		return false
	}

	val, ok := sess.Values[authKey].(bool)
	return ok && val
}

// SetAuthenticated sets or clears the authenticated flag in the session.
func SetAuthenticated(ctx echo.Context, authenticated bool) error {
	sess, err := Get(ctx, authSessionName)
	if err != nil {
		return err
	}

	if authenticated {
		sess.Values[authKey] = true
	} else {
		delete(sess.Values, authKey)
	}

	if err := sess.Save(ctx.Request(), ctx.Response()); err != nil {
		return err
	}

	return nil
}
