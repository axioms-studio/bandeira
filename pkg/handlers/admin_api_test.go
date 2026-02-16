package handlers

import (
	"bytes"
	gocontext "context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"testing"

	"github.com/felipekafuri/bandeira/ent/apitoken"
	"github.com/felipekafuri/bandeira/pkg/token"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type adminFixture struct {
	projectID int
	rawToken  string
}

func setupAdminFixtureNamed(t *testing.T, suffix string) adminFixture {
	t.Helper()
	return setupAdminFixtureWithName(t, fmt.Sprintf("admin-test-%s-%s", t.Name(), suffix))
}

func setupAdminFixture(t *testing.T) adminFixture {
	t.Helper()
	return setupAdminFixtureWithName(t, fmt.Sprintf("admin-test-%s", t.Name()))
}

func setupAdminFixtureWithName(t *testing.T, name string) adminFixture {
	t.Helper()
	ctx := gocontext.Background()

	p, err := c.ORM.Project.Create().
		SetName(name).
		Save(ctx)
	require.NoError(t, err)

	raw, hashed, err := token.Generate()
	require.NoError(t, err)

	_, err = c.ORM.ApiToken.Create().
		SetName("admin-token").
		SetSecret(hashed).
		SetPlainToken(raw).
		SetTokenType(apitoken.TokenTypeAdmin).
		SetProjectID(p.ID).
		Save(ctx)
	require.NoError(t, err)

	t.Cleanup(func() {
		// Best-effort cleanup — ignore errors if already deleted by tests.
		c.ORM.Project.DeleteOneID(p.ID).Exec(ctx)
	})

	return adminFixture{projectID: p.ID, rawToken: raw}
}

func adminRequest(t *testing.T, method, path string, body any, token string) *http.Response {
	t.Helper()
	var reader io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		require.NoError(t, err)
		reader = bytes.NewReader(b)
	}

	req, err := http.NewRequest(method, srv.URL+path, reader)
	require.NoError(t, err)
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	return resp
}

func parseJSON(t *testing.T, resp *http.Response) map[string]any {
	t.Helper()
	defer resp.Body.Close()
	var result map[string]any
	err := json.NewDecoder(resp.Body).Decode(&result)
	require.NoError(t, err)
	return result
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

func TestAdminAPI_Auth_NoToken(t *testing.T) {
	resp := adminRequest(t, "GET", "/api/admin/projects", nil, "")
	assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	resp.Body.Close()
}

func TestAdminAPI_Auth_BadToken(t *testing.T) {
	resp := adminRequest(t, "GET", "/api/admin/projects", nil, "invalid-token-value")
	assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	resp.Body.Close()
}

func TestAdminAPI_Auth_ClientToken(t *testing.T) {
	fix := setupAdminFixture(t)

	// Create an environment so we can create a client token.
	env, err := c.ORM.Environment.Create().
		SetName("dev").
		SetType("development").
		SetProjectID(fix.projectID).
		Save(gocontext.Background())
	require.NoError(t, err)
	_ = env

	raw, hashed, err := token.Generate()
	require.NoError(t, err)
	_, err = c.ORM.ApiToken.Create().
		SetName("client-tok").
		SetSecret(hashed).
		SetPlainToken(raw).
		SetTokenType(apitoken.TokenTypeClient).
		SetEnvironment("dev").
		SetProjectID(fix.projectID).
		Save(gocontext.Background())
	require.NoError(t, err)

	resp := adminRequest(t, "GET", "/api/admin/projects", nil, raw)
	assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	resp.Body.Close()
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

func TestAdminAPI_Projects_List(t *testing.T) {
	fix := setupAdminFixture(t)

	resp := adminRequest(t, "GET", "/api/admin/projects", nil, fix.rawToken)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body := parseJSON(t, resp)
	projects, ok := body["projects"].([]any)
	require.True(t, ok)
	assert.Len(t, projects, 1)

	p := projects[0].(map[string]any)
	assert.Equal(t, float64(fix.projectID), p["id"])
}

func TestAdminAPI_Projects_Get(t *testing.T) {
	fix := setupAdminFixture(t)
	path := fmt.Sprintf("/api/admin/projects/%d", fix.projectID)

	resp := adminRequest(t, "GET", path, nil, fix.rawToken)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body := parseJSON(t, resp)
	assert.Equal(t, float64(fix.projectID), body["id"])
}

func TestAdminAPI_Projects_Get_WrongProject(t *testing.T) {
	fix := setupAdminFixture(t)

	resp := adminRequest(t, "GET", "/api/admin/projects/999999", nil, fix.rawToken)
	assert.Equal(t, http.StatusForbidden, resp.StatusCode)
	resp.Body.Close()
}

func TestAdminAPI_Projects_Update(t *testing.T) {
	fix := setupAdminFixture(t)
	path := fmt.Sprintf("/api/admin/projects/%d", fix.projectID)

	newName := fmt.Sprintf("updated-%s", t.Name())
	resp := adminRequest(t, "PUT", path, map[string]any{"name": newName}, fix.rawToken)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body := parseJSON(t, resp)
	assert.Equal(t, newName, body["name"])
}

func TestAdminAPI_Projects_Delete(t *testing.T) {
	fix := setupAdminFixture(t)
	path := fmt.Sprintf("/api/admin/projects/%d", fix.projectID)

	resp := adminRequest(t, "DELETE", path, nil, fix.rawToken)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body := parseJSON(t, resp)
	assert.Equal(t, true, body["ok"])
}

func TestAdminAPI_Projects_CreateForbidden(t *testing.T) {
	fix := setupAdminFixture(t)

	resp := adminRequest(t, "POST", "/api/admin/projects", map[string]any{"name": "nope"}, fix.rawToken)
	assert.Equal(t, http.StatusForbidden, resp.StatusCode)
	resp.Body.Close()
}

// ---------------------------------------------------------------------------
// Environments
// ---------------------------------------------------------------------------

func TestAdminAPI_Environments_List(t *testing.T) {
	fix := setupAdminFixture(t)

	_, err := c.ORM.Environment.Create().
		SetName("staging").
		SetType("staging").
		SetProjectID(fix.projectID).
		Save(gocontext.Background())
	require.NoError(t, err)

	path := fmt.Sprintf("/api/admin/projects/%d/environments", fix.projectID)
	resp := adminRequest(t, "GET", path, nil, fix.rawToken)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body := parseJSON(t, resp)
	envs := body["environments"].([]any)
	assert.GreaterOrEqual(t, len(envs), 1)
}

func TestAdminAPI_Environments_Create(t *testing.T) {
	fix := setupAdminFixture(t)
	path := fmt.Sprintf("/api/admin/projects/%d/environments", fix.projectID)

	resp := adminRequest(t, "POST", path, map[string]any{
		"name": "production",
		"type": "production",
	}, fix.rawToken)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	body := parseJSON(t, resp)
	assert.Equal(t, "production", body["name"])
	assert.Equal(t, "production", body["type"])
}

func TestAdminAPI_Environments_Create_Validation(t *testing.T) {
	fix := setupAdminFixture(t)
	path := fmt.Sprintf("/api/admin/projects/%d/environments", fix.projectID)

	resp := adminRequest(t, "POST", path, map[string]any{
		"name": "",
		"type": "invalid",
	}, fix.rawToken)
	assert.Equal(t, http.StatusUnprocessableEntity, resp.StatusCode)

	body := parseJSON(t, resp)
	fields := body["fields"].(map[string]any)
	assert.Contains(t, fields, "name")
	assert.Contains(t, fields, "type")
}

func TestAdminAPI_Environments_Update(t *testing.T) {
	fix := setupAdminFixture(t)

	env, err := c.ORM.Environment.Create().
		SetName("dev-update").
		SetType("development").
		SetProjectID(fix.projectID).
		Save(gocontext.Background())
	require.NoError(t, err)

	path := fmt.Sprintf("/api/admin/projects/%d/environments/%d", fix.projectID, env.ID)
	resp := adminRequest(t, "PUT", path, map[string]any{"name": "dev-renamed"}, fix.rawToken)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body := parseJSON(t, resp)
	assert.Equal(t, "dev-renamed", body["name"])
}

func TestAdminAPI_Environments_Delete(t *testing.T) {
	fix := setupAdminFixture(t)

	env, err := c.ORM.Environment.Create().
		SetName("to-delete").
		SetType("development").
		SetProjectID(fix.projectID).
		Save(gocontext.Background())
	require.NoError(t, err)

	path := fmt.Sprintf("/api/admin/projects/%d/environments/%d", fix.projectID, env.ID)
	resp := adminRequest(t, "DELETE", path, nil, fix.rawToken)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body := parseJSON(t, resp)
	assert.Equal(t, true, body["ok"])
}

// ---------------------------------------------------------------------------
// Flags
// ---------------------------------------------------------------------------

func TestAdminAPI_Flags_List(t *testing.T) {
	fix := setupAdminFixture(t)

	_, err := c.ORM.Flag.Create().
		SetName("my-flag").
		SetFlagType("release").
		SetProjectID(fix.projectID).
		Save(gocontext.Background())
	require.NoError(t, err)

	path := fmt.Sprintf("/api/admin/projects/%d/flags", fix.projectID)
	resp := adminRequest(t, "GET", path, nil, fix.rawToken)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body := parseJSON(t, resp)
	flags := body["flags"].([]any)
	assert.GreaterOrEqual(t, len(flags), 1)
}

func TestAdminAPI_Flags_Create(t *testing.T) {
	fix := setupAdminFixture(t)
	path := fmt.Sprintf("/api/admin/projects/%d/flags", fix.projectID)

	resp := adminRequest(t, "POST", path, map[string]any{
		"name":      "new-flag",
		"flag_type": "experiment",
	}, fix.rawToken)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	body := parseJSON(t, resp)
	assert.Equal(t, "new-flag", body["name"])
	assert.Equal(t, "experiment", body["flag_type"])
}

func TestAdminAPI_Flags_Create_Validation(t *testing.T) {
	fix := setupAdminFixture(t)
	path := fmt.Sprintf("/api/admin/projects/%d/flags", fix.projectID)

	resp := adminRequest(t, "POST", path, map[string]any{
		"name":      "",
		"flag_type": "bogus",
	}, fix.rawToken)
	assert.Equal(t, http.StatusUnprocessableEntity, resp.StatusCode)

	body := parseJSON(t, resp)
	fields := body["fields"].(map[string]any)
	assert.Contains(t, fields, "name")
	assert.Contains(t, fields, "flag_type")
}

func TestAdminAPI_Flags_Get_WithStrategies(t *testing.T) {
	fix := setupAdminFixture(t)

	flag, err := c.ORM.Flag.Create().
		SetName("get-flag").
		SetFlagType("release").
		SetProjectID(fix.projectID).
		Save(gocontext.Background())
	require.NoError(t, err)

	env, err := c.ORM.Environment.Create().
		SetName("dev-get").
		SetType("development").
		SetProjectID(fix.projectID).
		Save(gocontext.Background())
	require.NoError(t, err)

	fe, err := c.ORM.FlagEnvironment.Create().
		SetFlagID(flag.ID).
		SetEnvironmentID(env.ID).
		SetEnabled(true).
		Save(gocontext.Background())
	require.NoError(t, err)

	s, err := c.ORM.Strategy.Create().
		SetName("gradualRollout").
		SetParameters(map[string]any{"rollout": 50}).
		SetFlagEnvironmentID(fe.ID).
		Save(gocontext.Background())
	require.NoError(t, err)

	_, err = c.ORM.Constraint.Create().
		SetContextName("country").
		SetOperator("IN").
		SetValues([]string{"US", "CA"}).
		SetStrategyID(s.ID).
		Save(gocontext.Background())
	require.NoError(t, err)

	path := fmt.Sprintf("/api/admin/projects/%d/flags/%d", fix.projectID, flag.ID)
	resp := adminRequest(t, "GET", path, nil, fix.rawToken)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body := parseJSON(t, resp)
	assert.Equal(t, "get-flag", body["name"])

	envConfigs := body["environments"].([]any)
	assert.Len(t, envConfigs, 1)

	ec := envConfigs[0].(map[string]any)
	assert.Equal(t, true, ec["enabled"])

	strategies := ec["strategies"].([]any)
	assert.Len(t, strategies, 1)

	strat := strategies[0].(map[string]any)
	assert.Equal(t, "gradualRollout", strat["name"])

	constraints := strat["constraints"].([]any)
	assert.Len(t, constraints, 1)
	assert.Equal(t, "country", constraints[0].(map[string]any)["context_name"])
}

func TestAdminAPI_Flags_Update(t *testing.T) {
	fix := setupAdminFixture(t)

	flag, err := c.ORM.Flag.Create().
		SetName("update-flag").
		SetFlagType("release").
		SetProjectID(fix.projectID).
		Save(gocontext.Background())
	require.NoError(t, err)

	path := fmt.Sprintf("/api/admin/projects/%d/flags/%d", fix.projectID, flag.ID)
	resp := adminRequest(t, "PUT", path, map[string]any{"name": "renamed-flag"}, fix.rawToken)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body := parseJSON(t, resp)
	assert.Equal(t, "renamed-flag", body["name"])
}

func TestAdminAPI_Flags_Delete(t *testing.T) {
	fix := setupAdminFixture(t)

	flag, err := c.ORM.Flag.Create().
		SetName("delete-flag").
		SetFlagType("release").
		SetProjectID(fix.projectID).
		Save(gocontext.Background())
	require.NoError(t, err)

	path := fmt.Sprintf("/api/admin/projects/%d/flags/%d", fix.projectID, flag.ID)
	resp := adminRequest(t, "DELETE", path, nil, fix.rawToken)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body := parseJSON(t, resp)
	assert.Equal(t, true, body["ok"])
}

// ---------------------------------------------------------------------------
// Patch flag/env
// ---------------------------------------------------------------------------

func TestAdminAPI_PatchFlagEnv_ToggleOnly(t *testing.T) {
	fix := setupAdminFixture(t)

	flag, err := c.ORM.Flag.Create().
		SetName("toggle-flag").
		SetFlagType("release").
		SetProjectID(fix.projectID).
		Save(gocontext.Background())
	require.NoError(t, err)

	env, err := c.ORM.Environment.Create().
		SetName("dev-toggle").
		SetType("development").
		SetProjectID(fix.projectID).
		Save(gocontext.Background())
	require.NoError(t, err)

	path := fmt.Sprintf("/api/admin/projects/%d/flags/%d/environments/%d", fix.projectID, flag.ID, env.ID)
	resp := adminRequest(t, "PATCH", path, map[string]any{"enabled": true}, fix.rawToken)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body := parseJSON(t, resp)
	assert.Equal(t, true, body["enabled"])
}

func TestAdminAPI_PatchFlagEnv_ReplaceStrategies(t *testing.T) {
	fix := setupAdminFixture(t)

	flag, err := c.ORM.Flag.Create().
		SetName("strat-flag").
		SetFlagType("release").
		SetProjectID(fix.projectID).
		Save(gocontext.Background())
	require.NoError(t, err)

	env, err := c.ORM.Environment.Create().
		SetName("dev-strat").
		SetType("development").
		SetProjectID(fix.projectID).
		Save(gocontext.Background())
	require.NoError(t, err)

	path := fmt.Sprintf("/api/admin/projects/%d/flags/%d/environments/%d", fix.projectID, flag.ID, env.ID)
	resp := adminRequest(t, "PATCH", path, map[string]any{
		"strategies": []map[string]any{
			{
				"name":       "gradualRollout",
				"parameters": map[string]any{"rollout": 80},
				"constraints": []map[string]any{
					{
						"context_name": "region",
						"operator":     "IN",
						"values":       []string{"us-east"},
					},
				},
			},
		},
	}, fix.rawToken)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body := parseJSON(t, resp)
	strategies := body["strategies"].([]any)
	assert.Len(t, strategies, 1)
	assert.Equal(t, "gradualRollout", strategies[0].(map[string]any)["name"])
	constraints := strategies[0].(map[string]any)["constraints"].([]any)
	assert.Len(t, constraints, 1)
}

func TestAdminAPI_PatchFlagEnv_ToggleAndStrategies(t *testing.T) {
	fix := setupAdminFixture(t)

	flag, err := c.ORM.Flag.Create().
		SetName("both-flag").
		SetFlagType("release").
		SetProjectID(fix.projectID).
		Save(gocontext.Background())
	require.NoError(t, err)

	env, err := c.ORM.Environment.Create().
		SetName("dev-both").
		SetType("development").
		SetProjectID(fix.projectID).
		Save(gocontext.Background())
	require.NoError(t, err)

	path := fmt.Sprintf("/api/admin/projects/%d/flags/%d/environments/%d", fix.projectID, flag.ID, env.ID)
	resp := adminRequest(t, "PATCH", path, map[string]any{
		"enabled": true,
		"strategies": []map[string]any{
			{"name": "default", "parameters": map[string]any{}},
		},
	}, fix.rawToken)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body := parseJSON(t, resp)
	assert.Equal(t, true, body["enabled"])
	strategies := body["strategies"].([]any)
	assert.Len(t, strategies, 1)
}

func TestAdminAPI_PatchFlagEnv_WrongProject(t *testing.T) {
	fix := setupAdminFixture(t)

	// Flag/env in a different project.
	other, err := c.ORM.Project.Create().SetName(fmt.Sprintf("other-%s", t.Name())).Save(gocontext.Background())
	require.NoError(t, err)
	t.Cleanup(func() { c.ORM.Project.DeleteOneID(other.ID).Exec(gocontext.Background()) })

	flag, err := c.ORM.Flag.Create().
		SetName("other-flag").
		SetFlagType("release").
		SetProjectID(other.ID).
		Save(gocontext.Background())
	require.NoError(t, err)

	env, err := c.ORM.Environment.Create().
		SetName("other-env").
		SetType("development").
		SetProjectID(other.ID).
		Save(gocontext.Background())
	require.NoError(t, err)

	// Try to PATCH using fix's token (wrong project).
	path := fmt.Sprintf("/api/admin/projects/%d/flags/%d/environments/%d", fix.projectID, flag.ID, env.ID)
	resp := adminRequest(t, "PATCH", path, map[string]any{"enabled": true}, fix.rawToken)
	// Flag doesn't belong to fix.projectID → 404.
	assert.Equal(t, http.StatusNotFound, resp.StatusCode)
	resp.Body.Close()
}

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

func TestAdminAPI_Tokens_List(t *testing.T) {
	fix := setupAdminFixture(t)

	resp := adminRequest(t, "GET", "/api/admin/api-tokens", nil, fix.rawToken)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body := parseJSON(t, resp)
	tokens := body["tokens"].([]any)
	assert.GreaterOrEqual(t, len(tokens), 1) // At least the admin token itself.
}

func TestAdminAPI_Tokens_CreateClient(t *testing.T) {
	fix := setupAdminFixture(t)

	// Need an environment for client token.
	_, err := c.ORM.Environment.Create().
		SetName("dev-tok").
		SetType("development").
		SetProjectID(fix.projectID).
		Save(gocontext.Background())
	require.NoError(t, err)

	resp := adminRequest(t, "POST", "/api/admin/api-tokens", map[string]any{
		"name":        "my-client",
		"token_type":  "client",
		"environment": "dev-tok",
	}, fix.rawToken)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	body := parseJSON(t, resp)
	assert.Equal(t, "client", body["token_type"])
	assert.NotEmpty(t, body["raw_token"])
}

func TestAdminAPI_Tokens_CreateAdmin(t *testing.T) {
	fix := setupAdminFixture(t)

	resp := adminRequest(t, "POST", "/api/admin/api-tokens", map[string]any{
		"name":       "my-admin",
		"token_type": "admin",
	}, fix.rawToken)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	body := parseJSON(t, resp)
	assert.Equal(t, "admin", body["token_type"])
	assert.NotEmpty(t, body["raw_token"])
}

func TestAdminAPI_Tokens_Delete(t *testing.T) {
	fix := setupAdminFixture(t)

	// Create a token to delete.
	raw, hashed, err := token.Generate()
	require.NoError(t, err)
	_ = raw

	tok, err := c.ORM.ApiToken.Create().
		SetName("to-delete").
		SetSecret(hashed).
		SetPlainToken(raw).
		SetTokenType(apitoken.TokenTypeAdmin).
		SetProjectID(fix.projectID).
		Save(gocontext.Background())
	require.NoError(t, err)

	path := fmt.Sprintf("/api/admin/api-tokens/%d", tok.ID)
	resp := adminRequest(t, "DELETE", path, nil, fix.rawToken)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body := parseJSON(t, resp)
	assert.Equal(t, true, body["ok"])
}

// ---------------------------------------------------------------------------
// Cross-project isolation
// ---------------------------------------------------------------------------

func TestAdminAPI_CrossProjectIsolation(t *testing.T) {
	fixA := setupAdminFixtureNamed(t, "cross-A")
	fixB := setupAdminFixtureNamed(t, "cross-B")

	// Token A cannot access project B.
	path := fmt.Sprintf("/api/admin/projects/%d", fixB.projectID)
	resp := adminRequest(t, "GET", path, nil, fixA.rawToken)
	assert.Equal(t, http.StatusForbidden, resp.StatusCode)
	resp.Body.Close()

	// Token B cannot access project A.
	path = fmt.Sprintf("/api/admin/projects/%d", fixA.projectID)
	resp = adminRequest(t, "GET", path, nil, fixB.rawToken)
	assert.Equal(t, http.StatusForbidden, resp.StatusCode)
	resp.Body.Close()
}
