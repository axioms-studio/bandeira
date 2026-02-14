# Bandeira — Feature Flag Service

**Date:** 2026-02-14
**Status:** Approved
**Author:** Felipe Kafuri + Claude

## What Is Bandeira

A self-hosted, open-source feature flag service built with Go. Ships as a single binary + MySQL. Forked from [Pagode](https://github.com/occult/pagode) (Go/Echo/Ent/InertiaJS/React starter kit).

**Name:** Bandeira — Portuguese for "flag."

**Source:** Fork `github.com/occult/pagode` → `github.com/felipekafuri/bandeira`

**Target:** Open-source from day 1. Language-agnostic by design (own SDK protocol, Go SDK ships first).

## Goals

1. **Kill switches** — disable features in production without redeploying
2. **Gradual rollouts** — roll features out to a % of users or specific groups
3. **Environment toggles** — enable in staging, disable in production
4. **Multi-project** — one Bandeira instance serves all projects

## Non-Goals (v1)

- Variants / A/B testing
- Segments (reusable constraint groups)
- Flag dependencies
- Multi-user auth (single admin password via env var)
- Unleash SDK compatibility (can add as optional compat layer later)

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                 Bandeira                     │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │ Admin UI │  │ Admin API│  │ Client API│  │
│  │ (React/  │  │ (CRUD    │  │ (GET      │  │
│  │ Inertia) │  │ projects,│  │ /api/v1/  │  │
│  │          │  │ flags,   │  │ flags)    │  │
│  │          │  │ tokens)  │  │           │  │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  │
│       │              │              │        │
│       └──────────────┼──────────────┘        │
│                      │                        │
│              ┌───────▼────────┐               │
│              │   Ent ORM      │               │
│              │   (MySQL 8)    │               │
│              └────────────────┘               │
└─────────────────────────────────────────────┘
        │                          ▲
        │  polls every 15s         │
        ▼                          │
┌──────────────┐           ┌──────────────┐
│  Go SDK      │           │  Future SDKs │
│  (bandeira-  │           │  (Node, Py,  │
│   go)        │           │   etc.)      │
└──────────────┘           └──────────────┘
```

Single Go binary. No Redis, no background workers, no message queue. MySQL is the only dependency.

---

## Data Model

Six Ent entities:

### Project

| Field       | Type   | Notes                          |
|-------------|--------|--------------------------------|
| name        | string | Unique, e.g. "licita360"       |
| description | string | Optional                       |

Edges: `environments`, `flags`, `api_tokens`

### Environment

| Field      | Type   | Notes                                     |
|------------|--------|-------------------------------------------|
| name       | string | e.g. "production", "development"          |
| type       | enum   | `development`, `staging`, `production`    |
| sort_order | int    | Display ordering                          |

Edges: `project` (required)

Index: unique `(name, project)` — no duplicate env names per project.

### Flag

| Field       | Type   | Notes                                                  |
|-------------|--------|--------------------------------------------------------|
| name        | string | e.g. "new-dashboard"                                   |
| description | string | Optional                                               |
| flag_type   | enum   | `release`, `experiment`, `operational`, `kill_switch`  |

Edges: `project` (required), `flag_environments`

Index: unique `(name, project)` — no duplicate flag names per project.

### FlagEnvironment

The join entity between Flag and Environment. This is where `enabled` lives — a flag can be on in staging but off in production.

| Field   | Type | Notes                        |
|---------|------|------------------------------|
| enabled | bool | Default false                |

Edges: `flag` (required), `environment` (required), `strategies`

Index: unique `(flag, environment)` — one config per flag per environment.

### Strategy

| Field      | Type   | Notes                                                           |
|------------|--------|-----------------------------------------------------------------|
| name       | string | `default`, `gradualRollout`, `userWithId`, `remoteAddress`     |
| parameters | JSON   | Strategy-specific params (see Strategy Evaluation section)      |
| sort_order | int    | Evaluation order                                                |

Edges: `flag_environment` (required), `constraints`

### Constraint

| Field            | Type   | Notes                                                    |
|------------------|--------|----------------------------------------------------------|
| context_name     | string | e.g. "userId", "companyId", "appVersion"                |
| operator         | enum   | See Operators table below                                |
| values           | JSON   | Array of strings to match against                        |
| inverted         | bool   | Negate the result                                        |
| case_insensitive | bool   | For string operators                                     |

Edges: `strategy` (required)

**Constraint operators:**

| Operator        | Category | Description                    |
|-----------------|----------|--------------------------------|
| IN              | Set      | Value is in list               |
| NOT_IN          | Set      | Value is not in list           |
| STR_CONTAINS    | String   | Contains substring             |
| STR_STARTS_WITH | String   | Starts with prefix             |
| STR_ENDS_WITH   | String   | Ends with suffix               |
| NUM_EQ          | Numeric  | Equal                          |
| NUM_GT          | Numeric  | Greater than                   |
| NUM_GTE         | Numeric  | Greater than or equal          |
| NUM_LT          | Numeric  | Less than                      |
| NUM_LTE         | Numeric  | Less than or equal             |
| DATE_AFTER      | Date     | After ISO-8601 date            |
| DATE_BEFORE     | Date     | Before ISO-8601 date           |

### ApiToken

| Field       | Type   | Notes                                                  |
|-------------|--------|--------------------------------------------------------|
| secret      | string | Hashed token. Raw shown once on creation               |
| name        | string | Human label, e.g. "licita360-prod"                     |
| token_type  | enum   | `client`, `admin`                                      |
| environment | string | Nullable. Client tokens scoped to one environment      |

Edges: `project` (required)

---

## API

### Client API

Used by SDKs. Authenticated via `Authorization: Bearer <client-token>`.

| Method | Path            | Description                                          |
|--------|-----------------|------------------------------------------------------|
| GET    | `/api/v1/flags` | All flags for the token's project + environment      |

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
          "parameters": {"rollout": 50, "stickiness": "userId"},
          "constraints": [
            {"field": "companyId", "op": "IN", "values": ["1", "2", "3"]}
          ]
        }
      ]
    },
    {
      "name": "maintenance-mode",
      "enabled": false,
      "strategies": []
    }
  ]
}
```

**Evaluation logic (done by SDK, not server):**

1. If `enabled` is `false` → flag is OFF, skip strategies
2. If `enabled` is `true` and no strategies → flag is ON for everyone
3. If `enabled` is `true` with strategies → evaluate each strategy in order. If ANY strategy returns true → flag is ON. (OR logic between strategies, AND logic between constraints within a strategy)

### Admin API

Used by the dashboard and external tooling. Authenticated via `Authorization: Bearer <admin-token>`.

| Method | Path                                                        | Description                    |
|--------|-------------------------------------------------------------|--------------------------------|
| GET    | `/api/admin/projects`                                       | List projects                  |
| POST   | `/api/admin/projects`                                       | Create project                 |
| GET    | `/api/admin/projects/:id`                                   | Get project                    |
| PUT    | `/api/admin/projects/:id`                                   | Update project                 |
| DELETE | `/api/admin/projects/:id`                                   | Delete project                 |
| GET    | `/api/admin/projects/:id/environments`                      | List environments              |
| POST   | `/api/admin/projects/:id/environments`                      | Create environment             |
| PUT    | `/api/admin/projects/:id/environments/:envId`               | Update environment             |
| DELETE | `/api/admin/projects/:id/environments/:envId`               | Delete environment             |
| GET    | `/api/admin/projects/:id/flags`                             | List flags                     |
| POST   | `/api/admin/projects/:id/flags`                             | Create flag                    |
| GET    | `/api/admin/projects/:id/flags/:name`                       | Get flag with all env configs  |
| PUT    | `/api/admin/projects/:id/flags/:name`                       | Update flag metadata           |
| DELETE | `/api/admin/projects/:id/flags/:name`                       | Delete flag                    |
| PATCH  | `/api/admin/projects/:id/flags/:name/environments/:env`     | Toggle flag, update strategies |
| GET    | `/api/admin/api-tokens`                                     | List tokens                    |
| POST   | `/api/admin/api-tokens`                                     | Create token (returns raw once)|
| DELETE | `/api/admin/api-tokens/:id`                                 | Revoke token                   |

### Authentication

- **Client tokens**: scoped to one project + one environment. Can only read flags via `/api/v1/flags`.
- **Admin tokens**: scoped to one project. Full CRUD on that project's resources.
- **Dashboard auth**: session-based, single admin password via `BANDEIRA_AUTH_ADMINPASSWORD` env var. Multi-user is v2.

---

## Strategy Evaluation Reference

These are evaluated by the SDK, not the server. Documented here for SDK implementors.

### `default`

No parameters. Always returns true. Use when you just want the `enabled` toggle.

### `gradualRollout`

| Parameter   | Type   | Description                                              |
|-------------|--------|----------------------------------------------------------|
| rollout     | int    | 0–100 percentage                                         |
| stickiness  | string | Context field to hash: `userId`, `sessionId`, `random`  |
| groupId     | string | Optional salt for the hash (avoids flag correlation)     |

**Evaluation:** `normalizedHash(stickiness_value + groupId) % 100 < rollout`

Uses MurmurHash3 for consistent bucketing — same user always gets the same result.

### `userWithId`

| Parameter | Type   | Description                  |
|-----------|--------|------------------------------|
| userIds   | string | Comma-separated user IDs     |

**Evaluation:** `context.userId IN split(userIds, ",")`

### `remoteAddress`

| Parameter | Type   | Description                        |
|-----------|--------|------------------------------------|
| IPs       | string | Comma-separated IPs, supports CIDR |

**Evaluation:** `context.remoteAddress` matches any entry (exact or CIDR range).

---

## Dashboard Pages

Built with InertiaJS + React + shadcn/ui (Pagode patterns).

1. **Login** — single password field, authenticates against `BANDEIRA_AUTH_ADMINPASSWORD`
2. **Projects list** — cards showing project name, flag count, environment count
3. **Project detail (main screen)** — matrix view: rows = flags, columns = environments, cells = toggle switches. This is the primary interaction surface.
4. **Flag detail** — click a flag to expand: edit description, type, and per-environment strategy configuration
5. **Strategy editor** — select strategy type, fill parameters, add/remove constraints
6. **API Tokens** — create, view, revoke tokens. Raw secret shown once on creation.
7. **Environments** — manage environments for the project

### Key UX Decisions

- **Matrix toggle view** is the hero. One glance shows what's on/off across all environments.
- **No navigation away** for simple toggles — click the switch directly in the matrix.
- **Strategy editing** opens in a side panel or expandable row, not a separate page.

---

## Go SDK Design (`bandeira-go`)

Separate repository: `github.com/felipekafuri/bandeira-go`

### Usage

```go
package main

import "github.com/felipekafuri/bandeira-go"

func main() {
    client, err := bandeira.New(bandeira.Config{
        URL:          "http://localhost:8080",
        Token:        "your-client-token",
        PollInterval: 15 * time.Second, // default
    })
    if err != nil {
        log.Fatal(err)
    }
    defer client.Close()

    // Simple boolean check
    if client.IsEnabled("new-dashboard") {
        // show new dashboard
    }

    // With context for strategy evaluation
    ctx := bandeira.Context{
        UserID:     "42",
        Properties: map[string]string{
            "companyId": "7",
            "plan":      "enterprise",
        },
        RemoteAddress: "192.168.1.100",
    }

    if client.IsEnabled("premium-feature", ctx) {
        // show premium feature
    }
}
```

### SDK Internals

- **Poller goroutine**: fetches `GET /api/v1/flags` every N seconds, stores in `sync.RWMutex`-protected map
- **Local evaluation**: `IsEnabled()` reads from cache and evaluates strategies in-process. Zero network latency per check.
- **Graceful degradation**: if server unreachable, SDK uses last known state. If never connected, all flags default to `false`.
- **Thread-safe**: safe for concurrent use from multiple goroutines.
- **~300 lines**: the entire SDK.

---

## What to Strip from Pagode Fork

**Remove:**
- All example entities (User with password/role/CPF fields, PasswordToken, etc.)
- Payment/Stripe integration
- Storage/S3 file uploads
- Background tasks/scheduler
- Example page components, handlers, and route names
- Seed/admin CLI commands
- Any domain-specific code

**Keep:**
- Echo router + middleware stack (CSRF, session, logging, recovery)
- Ent ORM setup + Atlas migration workflow
- Config system (Viper + YAML + env overrides, rename prefix to `BANDEIRA_`)
- InertiaJS + React + Tailwind + shadcn/ui setup
- Vite build pipeline
- Error handling patterns
- Test infrastructure (testcontainers-go + MySQL)
- Docker / nixpacks deployment setup

---

## Configuration

```yaml
# config/config.yaml
app:
  name: "Bandeira"
  environment: "local"

http:
  port: 8080

database:
  connection: "bandeira:bandeira@tcp(localhost:3306)/bandeira?parseTime=true"

auth:
  adminPassword: "change-me-in-production"  # override: BANDEIRA_AUTH_ADMINPASSWORD
```

---

## Deployment

**Docker Compose (dev):**
```yaml
services:
  bandeira:
    build: .
    ports:
      - "8080:8080"
    environment:
      BANDEIRA_DATABASE_CONNECTION: "bandeira:bandeira@tcp(mysql:3306)/bandeira?parseTime=true"
      BANDEIRA_AUTH_ADMINPASSWORD: "admin"
    depends_on:
      - mysql

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: bandeira
      MYSQL_USER: bandeira
      MYSQL_PASSWORD: bandeira
    ports:
      - "3306:3306"
```

Two containers. That's the whole stack.

---

## Implementation Order

1. Fork Pagode, strip domain code, rename to Bandeira
2. Ent schemas: Project, Environment, Flag, FlagEnvironment, Strategy, Constraint, ApiToken
3. Admin API handlers (CRUD for all entities)
4. Client API handler (`GET /api/v1/flags`)
5. Token auth middleware (client vs admin)
6. Dashboard: login + projects list + flag matrix + toggle
7. Dashboard: flag detail + strategy editor
8. Dashboard: API tokens page
9. Go SDK (`bandeira-go` separate repo)
10. Docker + deployment setup
11. README + docs

---

## v2 Roadmap (Not in MVP)

- Multi-user auth with roles (viewer, editor, admin)
- Segments — reusable constraint groups
- Variants — A/B test values within a flag
- Flag dependencies
- Audit log — who changed what, when
- Webhooks — notify external systems on flag changes
- Unleash compatibility endpoint (optional `/api/client/features`)
- More SDKs — Node.js, Python, Ruby
- Metrics — track flag evaluation counts
