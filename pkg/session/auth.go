package session

import (
	"github.com/labstack/echo/v4"
)

const (
	authSessionName = "auth"
	authUserIDKey   = "user_id"
)

// IsAuthenticated checks if the current session has a valid user ID.
func IsAuthenticated(ctx echo.Context) bool {
	_, ok := GetAuthenticatedUserID(ctx)
	return ok
}

// GetAuthenticatedUserID returns the authenticated user's ID from the session.
func GetAuthenticatedUserID(ctx echo.Context) (int, bool) {
	sess, err := Get(ctx, authSessionName)
	if err != nil {
		return 0, false
	}

	val, ok := sess.Values[authUserIDKey].(int)
	return val, ok && val > 0
}

// SetAuthenticatedUser stores the user ID in the session.
func SetAuthenticatedUser(ctx echo.Context, userID int) error {
	sess, err := Get(ctx, authSessionName)
	if err != nil {
		return err
	}

	sess.Values[authUserIDKey] = userID
	return sess.Save(ctx.Request(), ctx.Response())
}

// ClearAuth removes auth data from the session.
func ClearAuth(ctx echo.Context) error {
	sess, err := Get(ctx, authSessionName)
	if err != nil {
		return err
	}

	delete(sess.Values, authUserIDKey)
	return sess.Save(ctx.Request(), ctx.Response())
}
