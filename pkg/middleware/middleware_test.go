package middleware

import (
	"os"
	"testing"

	"github.com/felipekafuri/bandeira/config"
	"github.com/felipekafuri/bandeira/pkg/services"
)

var (
	c *services.Container
)

func TestMain(m *testing.M) {
	// Set the environment to test
	config.SwitchEnvironment(config.EnvTest)

	// Create a new container
	c = services.NewContainer()

	// Run tests
	exitVal := m.Run()

	// Shutdown the container
	if err := c.Shutdown(); err != nil {
		panic(err)
	}

	os.Exit(exitVal)
}
