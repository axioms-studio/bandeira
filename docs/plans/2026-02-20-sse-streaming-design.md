# Real-Time Flag Streaming via SSE

**Date:** 2026-02-20
**Status:** Approved

## Goal

Replace polling with real-time flag delivery using Server-Sent Events (SSE). When a flag changes in the admin UI or API, all connected SDK clients receive the update within milliseconds instead of waiting up to 15s for the next poll.

## Why SSE

SSE was chosen over WebSocket and long polling because:

- **Simpler than WebSocket** — no upgrade handshake, no ping/pong, no bidirectional complexity. Flag delivery is inherently one-way (server → client).
- **More real-time than long polling** — persistent connection means instant push, no reconnect overhead.
- **Proxy-friendly** — standard HTTP with `text/event-stream` content type works through most proxies and load balancers.
- **No new dependencies** — Go's `net/http` handles SSE natively on both server and client side.

## Protocol

### Endpoint

```
GET /api/v1/stream
Authorization: Bearer <client-token>
Content-Type: text/event-stream
```

Same authentication as the existing `GET /api/v1/flags` — requires a valid client API token.

### Event Format

```
event: flags
data: {"flags":[{"name":"my-flag","enabled":true,"strategies":[...]}]}

```

The JSON payload uses the exact same shape as `GET /api/v1/flags`. SDKs don't need a new parser.

### Behavior

1. **On connect:** server immediately sends the full flag state for the token's project + environment.
2. **On flag change:** server pushes the full flag state again.
3. **Heartbeat:** server sends `:heartbeat\n\n` comment every 30s to keep the connection alive.
4. **Full state, not deltas:** every event contains the complete flag set. This avoids ordering bugs, missed deletes, and keeps SDK update logic trivial (replace the map).

### Reconnection

SSE supports `Last-Event-ID` but we don't use it. Since every event is a full snapshot, reconnecting clients simply receive the latest state on connect.

## Server Architecture

### Event Hub

A new `Hub` struct in `pkg/services/hub.go` manages connected SSE clients and broadcasts change notifications.

```
┌─────────────┐     Notify()      ┌──────┐     push      ┌─────────┐
│ Admin UI /  │ ──────────────────>│ Hub  │ ─────────────>│ SSE     │
│ Admin API   │  (project+env ID) │      │  (per-client) │ clients │
└─────────────┘                    └──────┘               └─────────┘
```

**Key design:**

- Hub holds a map of channels keyed by `projectID:environmentName`.
- When an SSE client connects, it registers a channel on the hub for its project+env.
- When a flag is mutated, the handler calls `hub.Notify(projectID, envName)`.
- Each SSE goroutine receives the signal, queries the DB for fresh flags, and writes the SSE event.
- On disconnect (context canceled), the channel is removed from the hub.

**Why query-on-notify (not data-through-hub):**

- Avoids serializing flag data through channels.
- Each client gets a consistent DB snapshot.
- Hub stays simple — it's a signal bus, not a data bus.

### SSE Endpoint

New handler method on `ClientAPI` registered at `GET /api/v1/stream` with the same `RequireTokenAuth` middleware.

The handler:
1. Resolves project + environment from the token.
2. Subscribes to the hub.
3. Sends initial flag state.
4. Loops: wait for hub signal or heartbeat tick, write SSE event.
5. Cleans up on client disconnect.

### Notify Call Sites

Add `hub.Notify(projectID, envName)` in:

- `FlagHandler` — flag toggle, strategy/constraint updates
- `AdminAPI` — PATCH flag/environment config

These are the existing mutation paths. Small, targeted changes.

### Service Container

The `Hub` is added to the service container (`pkg/services/container.go`) so handlers can access it via dependency injection.

## Go SDK Changes

### New Config Option

```go
client, err := bandeira.New(bandeira.Config{
    URL:       "http://localhost:8080",
    Token:     "your-client-token",
    Streaming: true,  // uses SSE instead of polling
})
```

### Streaming Mode

When `Streaming: true`:

- SDK opens a long-lived HTTP connection to `GET /api/v1/stream`.
- On each `event: flags`, parses JSON and replaces the in-memory flag map.
- **Auto-reconnect** with exponential backoff: 1s, 2s, 4s... capped at 30s.
- **Fail fast** on initial connect (same as current polling behavior).
- `Close()` closes the SSE connection.

When `Streaming: false` (default):

- Behavior is identical to current polling. No breaking changes.

`IsEnabled()` and `AllFlags()` are unchanged — they read the in-memory map regardless of transport.

### Versioning

- Tag new release as `go/v0.2.0`.
- `go/v0.1.x` remains untouched for existing users.
- No new external dependencies (uses `net/http` + `bufio.Scanner`).

## Documentation

### Docs Page (Docs.tsx)

Add a "Real-Time Streaming" section covering:

- Endpoint and authentication
- Event format with example payload
- Heartbeat behavior
- Go SDK usage example with `Streaming: true`
- Note that other SDKs still use polling (streaming support coming later)

### Go SDK README

Update with streaming usage example and version bump notes.

## What Doesn't Change

- `GET /api/v1/flags` polling endpoint stays as-is.
- SDK default is polling (`Streaming: false`).
- `IsEnabled()` / `AllFlags()` public API unchanged.
- No new external dependencies on either side.
- All other SDKs (JS, Python, PHP, Dart, Elixir) continue polling.
