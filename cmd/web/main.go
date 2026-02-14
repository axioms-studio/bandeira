package main

import (
	"crypto/tls"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/signal"

	"github.com/felipekafuri/bandeira/pkg/handlers"
	"github.com/felipekafuri/bandeira/pkg/log"
	"github.com/felipekafuri/bandeira/pkg/services"
)

func main() {
	// Start a new container.
	c := services.NewContainer()
	defer func() {
		fatal("shutdown failed", c.Shutdown())
	}()

	// Build the router.
	if err := handlers.BuildRouter(c); err != nil {
		fatal("failed to build the router", err)
	}

	// Start the server.
	go func() {
		srv := http.Server{
			Addr:         fmt.Sprintf("%s:%d", c.Config.HTTP.Hostname, c.Config.HTTP.Port),
			Handler:      c.Web,
			ReadTimeout:  c.Config.HTTP.ReadTimeout,
			WriteTimeout: c.Config.HTTP.WriteTimeout,
			IdleTimeout:  c.Config.HTTP.IdleTimeout,
		}

		if c.Config.HTTP.TLS.Enabled {
			certs, err := tls.LoadX509KeyPair(c.Config.HTTP.TLS.Certificate, c.Config.HTTP.TLS.Key)
			fatal("cannot load TLS certificate", err)

			srv.TLSConfig = &tls.Config{
				Certificates: []tls.Certificate{certs},
			}
		}

		if err := c.Web.StartServer(&srv); errors.Is(err, http.ErrServerClosed) {
			fatal("shutting down the server", err)
		}
	}()

	// Wait for interrupt signal to gracefully shut down the server.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)
	signal.Notify(quit, os.Kill)
	<-quit
}

func fatal(msg string, err error) {
	if err != nil {
		log.Default().Error(msg, "error", err)
		os.Exit(1)
	}
}
