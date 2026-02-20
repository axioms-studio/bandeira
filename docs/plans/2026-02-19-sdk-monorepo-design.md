# SDK Monorepo Design

## Problem

Bandeira has a Go SDK (`bandeira-go`) and needs JS and Python SDKs. All three must stay in lockstep when the API contract or strategy logic changes. Separate repos make coordinated releases painful.

## Decision

Create a single `bandeira-sdks` monorepo containing all three SDKs. Each SDK is published independently to its ecosystem's registry (Go modules, npm, PyPI).

## Repository Structure

```
github.com/felipekafuri/bandeira-sdks/
├── README.md
├── LICENSE                    (MIT)
├── .github/workflows/
│   ├── go.yml                 (test + tag-triggered publish)
│   ├── js.yml                 (test + npm publish)
│   └── python.yml             (test + PyPI publish)
├── go/
│   ├── go.mod                 (module github.com/felipekafuri/bandeira-sdks/go)
│   ├── bandeira.go
│   └── bandeira_test.go
├── js/
│   ├── package.json           (name: "bandeira")
│   ├── tsconfig.json
│   └── src/
│       └── index.ts
├── python/
│   ├── pyproject.toml         (name: "bandeira")
│   ├── src/bandeira/
│   │   └── __init__.py
│   └── tests/
└── testdata/
    └── flags.json             (shared API response fixtures)
```

## SDK API Surface

All three SDKs implement the same contract:

```
Constructor(url, token, options?) -> Client
Client.isEnabled(flagName, context?) -> bool
Client.allFlags() -> map[string]bool
Client.close() -> void
```

### Context Object

| Field          | Type              | Used By                          |
|----------------|-------------------|----------------------------------|
| userId         | string            | userWithId, gradualRollout       |
| sessionId      | string            | gradualRollout (alt stickiness)  |
| remoteAddress  | string            | remoteAddress                    |
| properties     | map[string]string | constraints, custom stickiness   |

### Strategy Evaluation

All SDKs must implement identical logic for:
- `default` — always true
- `gradualRollout` — FNV-1a hash, mod 100, compared to rollout percentage
- `userWithId` — exact match against comma/newline-separated list
- `remoteAddress` — exact match or prefix match for CIDR-like notation

### Constraint Operators

All SDKs must support: `IN`, `NOT_IN`, `STR_CONTAINS`, `STR_STARTS_WITH`, `STR_ENDS_WITH`, `NUM_EQ`, `NUM_GT`, `NUM_GTE`, `NUM_LT`, `NUM_LTE`, `DATE_AFTER`, `DATE_BEFORE`.

Constraints use AND logic (all must pass). Strategies use OR logic (any can pass).

## Shared Test Fixtures

`testdata/flags.json` contains a standard API response covering all strategies and constraint operators. All three SDKs run their tests against this fixture to guarantee identical evaluation behavior.

## CI/CD

Each SDK has its own GitHub Actions workflow with path filters:
- `go.yml` triggers on `go/**` changes
- `js.yml` triggers on `js/**` changes
- `python.yml` triggers on `python/**` changes

Publishing is tag-based:
- `go/v0.2.0` triggers Go module tagging
- `js/v0.1.0` triggers npm publish
- `python/v0.1.0` triggers PyPI publish

## Migration Plan

### Old `bandeira-go` repo
- Archive the repo
- Update README with deprecation notice pointing to `bandeira-sdks/go`
- Since it's v0.1.0 with minimal adoption, a clean break is acceptable

### Main server updates
Files that reference `bandeira-go` and need updating:
1. `README.md` — badge, install command, SDK link, architecture diagram (add JS + Python)
2. `resources/js/Pages/Docs.tsx` — install command, import path, GitHub link (add JS + Python tabs)
3. `resources/js/Pages/Strategies.tsx` — install command, GitHub link

## Package Names & Install Commands

| Language | Package      | Install Command                                          |
|----------|-------------|----------------------------------------------------------|
| Go       | module path | `go get github.com/felipekafuri/bandeira-sdks/go`        |
| JS/TS    | bandeira    | `npm install bandeira`                                    |
| Python   | bandeira    | `pip install bandeira`                                    |

## Key Design Decisions

| Decision                  | Choice                                      | Rationale                                                    |
|---------------------------|---------------------------------------------|--------------------------------------------------------------|
| Repo structure            | Single monorepo for all SDKs                | Lockstep releases, shared fixtures, single CI pipeline       |
| Go module path            | `bandeira-sdks/go` subdirectory module      | Go supports this natively; small cosmetic cost               |
| Shared test data          | `testdata/flags.json`                       | Guarantees identical behavior across all SDKs                |
| Per-SDK CI with path filters | Separate workflow files                  | Only test/publish what changed; avoids unnecessary CI runs   |
| Tag-based publishing      | `<sdk>/v<semver>` tags                      | Each SDK can version independently while living in same repo |
