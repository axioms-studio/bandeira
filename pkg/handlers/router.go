package handlers

import (
	"net/http"

	"github.com/gorilla/sessions"
	"github.com/labstack/echo/v4"
	echomw "github.com/labstack/echo/v4/middleware"
	"github.com/felipekafuri/bandeira/config"
	"github.com/felipekafuri/bandeira/pkg/context"
	"github.com/felipekafuri/bandeira/pkg/middleware"
	"github.com/felipekafuri/bandeira/pkg/services"
)

// BuildRouter builds the router.
func BuildRouter(c *services.Container) error {
	// Static files with proper cache control.
	c.Web.Group("", middleware.CacheControl(c.Config.Cache.Expiration.StaticFile)).
		Static(config.StaticPrefix, config.StaticDir)

	// Non-static file route group.
	g := c.Web.Group("")

	// Force HTTPS, if enabled.
	if c.Config.HTTP.TLS.Enabled {
		g.Use(echomw.HTTPSRedirect())
	}

	// Create a cookie store for session data.
	cookieStore := sessions.NewCookieStore([]byte(c.Config.App.EncryptionKey))
	cookieStore.Options.HttpOnly = true
	cookieStore.Options.SameSite = http.SameSiteStrictMode

	g.Use(
		echomw.RemoveTrailingSlashWithConfig(echomw.TrailingSlashConfig{
			RedirectCode: http.StatusMovedPermanently,
		}),
		echomw.Recover(),
		echomw.Secure(),
		echomw.RequestID(),
		middleware.SetLogger(),
		middleware.LogRequest(),
		echomw.Gzip(),
		echomw.TimeoutWithConfig(echomw.TimeoutConfig{
			Timeout: c.Config.App.Timeout,
		}),
		middleware.Config(c.Config),
		middleware.Session(cookieStore),
		echomw.CSRFWithConfig(echomw.CSRFConfig{
			TokenLookup:    "header:X-XSRF-TOKEN",
			CookieName:     "XSRF-TOKEN",
			CookiePath:     "/",
			CookieHTTPOnly: false,
			CookieSameSite: http.SameSiteStrictMode,
			ContextKey:     context.CSRFKey,
		}),
		echo.WrapMiddleware(c.Inertia.Middleware),
		middleware.InertiaProps(),
	)

	// API route group — no session, CSRF, or Inertia middleware.
	api := c.Web.Group("/api")
	api.Use(
		echomw.Recover(),
		echomw.Secure(),
		echomw.RequestID(),
		middleware.SetLogger(),
		middleware.LogRequest(),
		echomw.Gzip(),
		echomw.TimeoutWithConfig(echomw.TimeoutConfig{
			Timeout: c.Config.App.Timeout,
		}),
	)

	// Error handler.
	errHandler := &Error{}
	_ = errHandler.Init(c)

	c.Web.HTTPErrorHandler = func(err error, ctx echo.Context) {
		errHandler.Page(err, ctx)
	}

	// Initialize and register all handlers.
	for _, h := range GetHandlers() {
		if err := h.Init(c); err != nil {
			return err
		}

		h.Routes(g)

		if apiH, ok := h.(APIHandler); ok {
			apiH.APIRoutes(api)
		}
	}

	return nil
}
