# Multi-User + RBAC Design

**Date**: 2026-02-17
**Status**: Approved

## Goal

Replace the single admin password with a proper user system. Email/password accounts with three global roles (admin, editor, viewer). Admin-only invites — no self-registration.

## Roles

| Role | Projects | Flags/Envs | Strategies | API Tokens | Users |
|------|----------|------------|------------|------------|-------|
| **Admin** | CRUD | CRUD + toggle | CRUD | CRUD | CRUD |
| **Editor** | Read | CRUD + toggle | CRUD | Create own | Read own |
| **Viewer** | Read | Read | Read | None | None |

Per-project roles deferred to a future release.

## Data Model

### User Entity (new)

| Field | Type | Notes |
|-------|------|-------|
| id | int | auto-increment |
| email | string | unique, required |
| password | string | bcrypt hash |
| name | string | display name |
| role | enum | `admin`, `editor`, `viewer` |
| created_at | time | |
| updated_at | time | |

### API Token Changes

Add `created_by` edge from ApiToken to User (optional, nullable for backward compat with tokens created before migration).

## Bootstrap

On startup, if no users exist in the database, create an admin user from environment variables:

- `BANDEIRA_AUTH_ADMIN_EMAIL` (required on first run)
- `BANDEIRA_AUTH_ADMIN_PASSWORD` (required on first run)

The old `BANDEIRA_AUTH_ADMINPASSWORD` env var is removed.

If users already exist, these env vars are ignored (prevents accidental overwrite).

## Authentication

### Session-based (dashboard)

- Login: email + password form
- Session cookie (HttpOnly, Secure, SameSite=Strict) stores user ID
- Middleware loads user from session, attaches to request context
- Logout destroys session

### API tokens (unchanged)

Bearer token auth stays the same. Tokens are project-scoped, not user-scoped.

## Authorization Middleware

New middleware checks the user's role before allowing mutations:

- `RequireRole(admin)` — user management routes
- `RequireRole(admin, editor)` — flag/env/strategy mutation routes
- `RequireRole(admin, editor, viewer)` — read-only routes (dashboard, project list, flag list)

## Dashboard UI Changes

### New pages

- **Users list** (`/users`) — admin-only. Table with email, name, role, created date.
- **Create user** (`/users/create`) — admin-only. Form: email, name, password, role.
- **Edit user** (`/users/:id/edit`) — admin-only. Change name, role, reset password.

### Existing page changes

- **Nav bar**: show current user name/email, add "Users" link for admins.
- **Login page**: email + password fields instead of single password.
- **Mutation buttons** (create, edit, delete, toggle): hidden for viewers via shared props.
- **API tokens page**: show "Created by" column.

## Migration Path

This is a breaking change:

1. Set `BANDEIRA_AUTH_ADMIN_EMAIL` and `BANDEIRA_AUTH_ADMIN_PASSWORD` env vars.
2. Remove old `BANDEIRA_AUTH_ADMINPASSWORD` env var.
3. Restart Bandeira — admin user auto-created, old sessions invalidated.
4. Invite other users from the dashboard.

## Coolify Template Update

Update `bandeira.yaml` in the Coolify service store to use the new env vars:

```yaml
- BANDEIRA_AUTH_ADMIN_EMAIL=${SERVICE_USER_EMAIL:-admin@bandeira.local}
- BANDEIRA_AUTH_ADMIN_PASSWORD=${SERVICE_PASSWORD_BANDEIRA}
```

## Out of Scope

- Per-project roles
- OAuth / SSO
- Password reset via email
- Email verification
- Two-factor authentication
