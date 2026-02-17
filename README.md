# Bandeira

[![Docker Image](https://img.shields.io/badge/ghcr.io-felipekafuri%2Fbandeira-blue?logo=docker)](https://github.com/felipekafuri/bandeira/pkgs/container/bandeira)
[![Go SDK](https://img.shields.io/badge/Go_SDK-v0.1.0-00ADD8?logo=go)](https://github.com/felipekafuri/bandeira-go)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

<img width="1720" height="945" alt="image" src="https://github.com/user-attachments/assets/9d1b5c15-43c5-4343-a4f6-7354ddeb3301" />

Self-hosted, open-source feature flag service built with Go. Ships as a single binary + SQLite.

**Bandeira** — Portuguese for "flag."

## Features

- **Kill switches** — disable features in production without redeploying
- **Gradual rollouts** — roll features out to a % of users or specific groups
- **Environment toggles** — enable in staging, disable in production
- **Multi-project** — one Bandeira instance serves all projects
- **Admin dashboard** — React UI with matrix toggle view
- **Admin API** — 18 JSON endpoints for CI/CD, Terraform, and scripts
- **Client API** — lightweight SDK endpoint for flag evaluation

## Architecture

```
+---------------------------------------------+
|                  Bandeira                    |
|                                             |
|  +----------+  +----------+  +-----------+  |
|  | Admin UI |  | Admin API|  | Client API|  |
|  | (React/  |  | (18 CRUD |  | (GET      |  |
|  | Inertia) |  | endpoints|  | /api/v1/  |  |
|  |          |  |          |  | flags)    |  |
|  +----+-----+  +----+-----+  +-----+-----+  |
|       |              |              |        |
|       +--------------+--------------+        |
|                      |                       |
|              +-------v--------+              |
|              |   Ent ORM      |              |
|              |   (SQLite)     |              |
|              +----------------+              |
+---------------------------------------------+
        |                          ^
        |  polls every N seconds   |
        v                          |
+------------------+       +------------------+
|  Go SDK          |       |  Future SDKs     |
|  (bandeira-go)   |       |  (Node, Py, etc) |
+------------------+       +------------------+
```

Single Go binary. No Redis, no background workers, no message queue. SQLite is the only dependency.

## Tech Stack

- **Backend**: Go, Echo, Ent ORM
- **Frontend**: React, InertiaJS, Tailwind CSS v4, shadcn/ui
- **Database**: SQLite (embedded, zero config)

## Quick Start

### Docker (recommended)

```bash
docker pull ghcr.io/felipekafuri/bandeira:latest

docker run -d \
  -p 8080:8080 \
  -v bandeira-data:/app/dbs \
  -e BANDEIRA_AUTH_ADMINPASSWORD=your-password \
  -e BANDEIRA_APP_ENCRYPTIONKEY=$(openssl rand -hex 16) \
  ghcr.io/felipekafuri/bandeira:latest
```

Or with Docker Compose:

```bash
docker compose up -d
```

The dashboard is available at `http://localhost:8080`. Log in with the admin password.

### Coolify

Bandeira is available in the [Coolify](https://coolify.io) service store for one-click deployment.

### Go SDK

```bash
go get github.com/felipekafuri/bandeira-go@v0.1.0
```

```go
client := bandeira.NewClient("http://localhost:8080", "your-client-token")
flags, _ := client.GetFlags()

enabled := bandeira.IsEnabled(flags, "my-feature", bandeira.Context{
    UserID: "user-123",
})
```

See the [SDK repository](https://github.com/felipekafuri/bandeira-go) for full documentation.

### From source

```bash
# Install dependencies
npm ci

# Build frontend
npm run build

# Run the server
make run
```

### Development

```bash
make watch     # Start with hot reload (requires air)
make test      # Run all tests
make ent-gen   # Regenerate Ent code after schema changes
```

## Configuration

All settings live in `config/config.yaml` and can be overridden via environment variables with the `BANDEIRA_` prefix.

| Variable | Default | Description |
|----------|---------|-------------|
| `BANDEIRA_HTTP_PORT` | `8080` | HTTP listen port |
| `BANDEIRA_AUTH_ADMINPASSWORD` | `change-me-in-production` | Dashboard login password |
| `BANDEIRA_APP_ENCRYPTIONKEY` | *(set in config)* | 32-char key for session encryption |
| `BANDEIRA_APP_ENVIRONMENT` | `local` | `local`, `test`, or `prod` |
| `BANDEIRA_DATABASE_CONNECTION` | `dbs/main.db?...` | SQLite connection string |

## API Reference

Bandeira exposes two API surfaces:

- **Client API** — read-only flag data for SDKs (`/api/v1/`)
- **Admin API** — full CRUD for managing projects, flags, environments, and tokens (`/api/admin/`)

Both require a `Bearer` token in the `Authorization` header.

---

### Client API

Used by SDKs. Requires a **client** token (scoped to one project + one environment).

#### `GET /api/v1/flags`

Returns all flags for the token's project and environment, with strategies and constraints.

**Response:**

```json
{
  "flags": [
    {
      "name": "new-dashboard",
      "enabled": true,
      "strategies": [
        {
          "name": "gradualRollout",
          "parameters": { "rollout": 50, "stickiness": "userId" },
          "constraints": [
            {
              "context_name": "companyId",
              "operator": "IN",
              "values": ["1", "2", "3"],
              "inverted": false,
              "case_insensitive": false
            }
          ]
        }
      ]
    }
  ]
}
```

**Evaluation logic (performed by SDK, not server):**

1. If `enabled` is `false` — flag is OFF, skip strategies
2. If `enabled` is `true` and no strategies — flag is ON for everyone
3. If `enabled` is `true` with strategies — evaluate each in order; if ANY returns true the flag is ON (OR between strategies, AND between constraints)

---

### Admin API

Used by CI/CD, Terraform, scripts, or the dashboard. Requires an **admin** token (scoped to one project).

All responses use JSON. Timestamps are RFC 3339.

#### Projects

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/projects` | List projects (returns only the token's project) |
| `POST` | `/api/admin/projects` | Returns `403` — admin tokens are project-scoped |
| `GET` | `/api/admin/projects/:id` | Get project with flag/environment counts |
| `PUT` | `/api/admin/projects/:id` | Update project name/description |
| `DELETE` | `/api/admin/projects/:id` | Delete project and all children |

**Example — update project:**

```bash
curl -X PUT http://localhost:8080/api/admin/projects/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "my-project", "description": "Updated description"}'
```

#### Environments

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/projects/:id/environments` | List environments (ordered by sort_order) |
| `POST` | `/api/admin/projects/:id/environments` | Create environment |
| `PUT` | `/api/admin/projects/:id/environments/:envId` | Update environment |
| `DELETE` | `/api/admin/projects/:id/environments/:envId` | Delete environment |

**Create request body:**

```json
{
  "name": "production",
  "type": "production",
  "sort_order": 3
}
```

`type` must be one of: `development`, `staging`, `production`.

#### Flags

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/projects/:id/flags` | List flags |
| `POST` | `/api/admin/projects/:id/flags` | Create flag |
| `GET` | `/api/admin/projects/:id/flags/:flagId` | Get flag with all environment configs, strategies, and constraints |
| `PUT` | `/api/admin/projects/:id/flags/:flagId` | Update flag metadata |
| `DELETE` | `/api/admin/projects/:id/flags/:flagId` | Delete flag |
| `PATCH` | `/api/admin/projects/:id/flags/:flagId/environments/:envId` | Toggle flag and/or replace strategies |

**Create request body:**

```json
{
  "name": "new-feature",
  "description": "Optional description",
  "flag_type": "release"
}
```

`flag_type` must be one of: `release`, `experiment`, `operational`, `kill_switch`.

**PATCH flag/env** — both fields are optional (PATCH semantics):

```json
{
  "enabled": true,
  "strategies": [
    {
      "name": "gradualRollout",
      "parameters": { "rollout": 50, "stickiness": "userId" },
      "constraints": [
        {
          "context_name": "region",
          "operator": "IN",
          "values": ["us-east", "us-west"]
        }
      ]
    }
  ]
}
```

When `strategies` is present, all existing strategies are replaced.

#### API Tokens

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/api-tokens` | List tokens for the project |
| `POST` | `/api/admin/api-tokens` | Create token (returns `raw_token` once) |
| `DELETE` | `/api/admin/api-tokens/:id` | Revoke token |

**Create request body:**

```json
{
  "name": "ci-deploy",
  "token_type": "admin"
}
```

For client tokens, include `"environment": "production"` (required for client type).

**Response includes `raw_token`** — save it, it is only shown once:

```json
{
  "id": 5,
  "name": "ci-deploy",
  "token_type": "admin",
  "environment": "",
  "raw_token": "a1b2c3d4e5f6...",
  "created_at": "2026-02-14T12:00:00Z"
}
```

---

### Error Responses

**401 Unauthorized** — missing or invalid token:

```json
{ "message": "Missing or invalid Authorization header" }
```

**403 Forbidden** — token cannot access this resource:

```json
{ "error": "Forbidden" }
```

**422 Validation failed** — invalid input:

```json
{
  "error": "Validation failed",
  "fields": {
    "name": "Name is required",
    "type": "Type must be one of: development, staging, production"
  }
}
```

---

### Authentication

- **Client tokens**: scoped to one project + one environment. Can only read flags via `GET /api/v1/flags`.
- **Admin tokens**: scoped to one project. Full CRUD on that project's resources via `/api/admin/`.
- **Dashboard auth**: session-based, single admin password via `BANDEIRA_AUTH_ADMINPASSWORD`.

## Strategy Reference

Strategies are evaluated by the SDK, not the server. Documented here for SDK implementors.

| Strategy | Parameters | Description |
|----------|-----------|-------------|
| `default` | *(none)* | Always returns true |
| `gradualRollout` | `rollout` (0-100), `stickiness` (context field), `groupId` (optional salt) | Percentage rollout with consistent bucketing |
| `userWithId` | `userIds` (comma-separated) | Match specific user IDs |
| `remoteAddress` | `IPs` (comma-separated, supports CIDR) | Match IP addresses |

### Constraint Operators

| Operator | Category | Description |
|----------|----------|-------------|
| `IN` | Set | Value is in list |
| `NOT_IN` | Set | Value is not in list |
| `STR_CONTAINS` | String | Contains substring |
| `STR_STARTS_WITH` | String | Starts with prefix |
| `STR_ENDS_WITH` | String | Ends with suffix |
| `NUM_EQ` / `NUM_GT` / `NUM_GTE` / `NUM_LT` / `NUM_LTE` | Numeric | Numeric comparisons |
| `DATE_AFTER` / `DATE_BEFORE` | Date | ISO-8601 date comparisons |

## License

MIT
