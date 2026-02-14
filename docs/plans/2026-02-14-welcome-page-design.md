# Welcome Page Redesign

## Context

The current Welcome page (`/`) is a generic Pagode starter-kit hero with floating geometric shapes and placeholder text. It has no CTA, no feature highlights, and no explanation of what Bandeira does. The page serves as both a sign-in gateway for the team and a showcase for developers discovering the open-source project.

## Approach

Single-page scroll. Keep the existing dark `HeroGeometric` component and add four content sections below it, all on the same `#030303` dark background for visual cohesion.

## Design

### Hero (existing, with tweaks)

Modify `HeroGeometric` to accept:
- `subtitle` prop — replaces the hardcoded Pagode text with: "Self-hosted feature flag management with per-environment toggles, gradual rollouts, and a Go SDK — deploy with Docker in 60 seconds."
- `cta` prop (`{ label, href }`) — renders a link button below the subtitle. White text on `white/10` bg with hover glow. Points to `/user/login` (or `/dashboard` if authenticated).

Props passed from `Welcome.tsx`:
- badge: "Open Source"
- title1: "Feature Flags"
- title2: "Made Simple"
- subtitle: (see above)
- cta: { label: "Get Started", href: "/user/login" } (auth-aware)

### Section 1: Features Grid

2x2 grid (1 column on mobile). Dark cards (`bg-white/[0.03] border border-white/[0.08]`).

| Icon           | Title                    | Description                                                                 |
|----------------|--------------------------|-----------------------------------------------------------------------------|
| ToggleRight    | Per-Environment Toggles  | Enable flags independently across development, staging, and production      |
| Users          | Targeting Strategies     | Roll out to specific users, percentages, or IP ranges with built-in strategies |
| Shield         | Constraint Engine        | AND/OR logic with operators like IN, STR_CONTAINS, NUM_GT, and date comparisons |
| Zap            | Zero-Latency SDK         | Go SDK polls and caches locally — flag checks are pure in-memory lookups    |

### Section 2: How It Works

3-step horizontal flow (vertical on mobile). Numbered circles connected by dashed lines.

1. **Create a Project** — Set up environments like staging and production
2. **Define Flags** — Add feature flags with strategies and constraints
3. **Evaluate Anywhere** — Use the Go SDK or Client API to check flags at runtime

### Section 3: Code Snippet

Two code blocks side by side (stacked on mobile). Tab-style headers labeling "Go SDK" and "curl".

Go SDK example shows `bandeira.New` + `IsEnabled` with context. curl example shows `GET /api/v1/flags` with Bearer auth.

### Section 4: Open Source CTA

Centered block:
- Heading: "Self-host in 60 seconds"
- Code block: `docker compose up -d`
- Two buttons: "GitHub" (outline, external link) and "Get Started" (solid, `/user/login`)

## Files

| Action | File                                                    |
|--------|---------------------------------------------------------|
| Modify | `resources/js/components/ui/shape-landing-hero.tsx`     |
| Modify | `resources/js/Pages/Welcome.tsx`                        |

No new files or components.
