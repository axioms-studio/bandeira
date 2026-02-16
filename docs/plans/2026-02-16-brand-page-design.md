# Brand Page Design

## Overview

A living style guide at `/brand` that reads from actual CSS variables and renders real components. Serves as internal developer reference, public brand page on bandeira.app, and visual identity export for logo creation.

## Route

- `GET /brand` — public, no auth, uses `PublicLayout`
- Not in the main nav — linked from footer and docs

## Page Sections

### 1. Hero

Title: "Bandeira Brand"
Subtitle: "Colors, typography, and components that make up Bandeira's visual identity."

### 2. Anchor Nav

Horizontal pill row below hero that scrolls to sections: Colors, Typography, Components, Logo & Identity.

### 3. Color Palette

Grid of color swatches organized in groups:

**Core**: Background, Foreground, Primary, Primary Foreground, Secondary, Secondary Foreground

**UI**: Card, Card Foreground, Muted, Muted Foreground, Accent, Accent Foreground, Destructive, Destructive Foreground, Border, Input, Ring

Each swatch shows:
- Rendered color rectangle
- Token name (`--primary`)
- Tailwind class (`bg-primary`)
- OKLch value
- Click to copy Tailwind class

Light/dark toggle at section top to preview both palettes.

### 4. Typography

Three font specimens:
- **Inter** (sans): weights 400/500/600/700, body + headings
- **JetBrains Mono** (mono): code blocks
- **Georgia** (serif): fallback

Type scale showing text-xs through text-3xl rendered at actual sizes.

### 5. Component Gallery

Live rendered components in grouped cards:
- **Buttons**: 6 variants (default, destructive, outline, secondary, ghost, link) x 3 sizes (sm, default, lg)
- **Inputs**: normal, placeholder, error state, disabled
- **Cards**: sample card with header/description/content/footer
- **Badges**: enabled/disabled status badges
- **Shadows**: boxes showing shadow-sm through shadow-xl

Visual reference only — no code snippets.

### 6. Logo & Identity

**Current mark**: Flag icon in primary-colored rounded square at 16/32/64/128px on light and dark backgrounds.

**AI logo prompt** (copy-ready):

> Minimal, modern logo for "Bandeira" — an open-source feature flag management tool. The icon should be a stylized flag or banner shape, geometric and clean. Primary brand color is vibrant green (#7AE66B approximate). The logo should work as a small favicon (16px) and as a full wordmark. Style: developer tools, SaaS, minimal. Think Linear, Vercel, Supabase aesthetic. The word "Bandeira" means "flag" in Portuguese.

## Technical Approach

- Colors read from CSS variables via `getComputedStyle()` so they stay in sync
- Components imported directly from `@/components/ui/` (real renders, not screenshots)
- Theme toggle uses existing `useAppearance()` hook
- Single file: `resources/js/Pages/Brand.tsx`
- Backend: add route in `pages.go`, constant in `routenames/names.go`

## Files

| Action | File |
|--------|------|
| Create | `resources/js/Pages/Brand.tsx` |
| Modify | `pkg/handlers/pages.go` — add `/brand` route |
| Modify | `pkg/routenames/names.go` — add `Brand` constant |
| Modify | footer in `Welcome.tsx` — link to `/brand` |
