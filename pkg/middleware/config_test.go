package middleware

import (
	"testing"

	"github.com/felipekafuri/bandeira/config"
	"github.com/felipekafuri/bandeira/pkg/context"
	"github.com/felipekafuri/bandeira/pkg/tests"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestConfig(t *testing.T) {
	ctx, _ := tests.NewContext(c.Web, "/")
	cfg := &config.Config{}
	err := tests.ExecuteMiddleware(ctx, Config(cfg))
	require.NoError(t, err)

	got, ok := ctx.Get(context.ConfigKey).(*config.Config)
	require.True(t, ok)
	assert.Same(t, got, cfg)
}
