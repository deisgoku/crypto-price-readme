# Changelog

All notable changes to this project will be documented here.

---
## v1.6.0 — Premium Integration & GIF Mode

Introduces experimental support for animated crypto charts and prepares the codebase for premium features.

### What's New
- Added `mod.js` as an experimental endpoint for flexible SVG/GIF rendering.
- Introduced GIF preview support with `gif=1` and `interval` query.
- Unified SVG and GIF handling with dynamic model, theme, and category parsing.
- Early integration for Express.js and Stripe-ready API structure.

### Improvements
- Modularized chart/theme/font logic for easier maintenance.
- Full in-memory cache support for both SVG and GIF modes.
- Verified user layer for preview personalization.

---

## v1.5.9 — Aurora Layout & Font Presets

### What's New
- Added **Aurora** layout: glassmorphism-inspired with layered ovals.
- All models now use consistent font presets (`fontRow`, `fontHeader`, `fontTitle`, etc.).

### Improvements
- Refactored theme system to support per-column text color and gradients.
- Font rendering now scales properly across all resolutions and models.

---

## v1.5.8 — Classic Layout & Row Highlighting

### What's New
- Introduced `classic` layout with hover-row style and bold headers.
- Built-in font consistency using shared `fontStyles()` method.

### Fixes
- Adjusted padding and spacing inconsistencies on modern and futuristic layouts.

---

## v1.5.1 — Futuristic Layout

### What's New
- New `futuristic` layout: combines modern chart shapes with smoother curves.
- Chart line uses Catmull-Rom interpolation for organic feel.

### Improvements
- Improved alignment between columns and consistent spacing.

---

## v1.4.8 — Popup Preview Finalization

### What's New
- Custom card preview is now draggable, resizable, and dockable.
- Supports minimize, maximize, close.
- Preview decoupled into `preview.jsx` for better performance.

---

## v1.4.7 — Global Preview Support

### What's New
- Card preview now renders outside layout containers for true global positioning.
- Applied highest z-index with support for global CSS and fullscreen interaction.

---

## v1.4.6 — Custom Card Builder

### What's New
- `/custom.jsx` page allows user to generate live URLs with model, theme, and category.
- Integrated preview popup with live crypto data rendering.
- Built-in dropdowns for theme/model/category.

---

## v1.4.5 — Unlock Page UX Polishing

### Improvements
- Toggle password visibility with eye icon.
- Password strength meter with 4 color levels.
- CAPTCHA resets on mode switch (login/register).

---

## v1.4.4 — Unlock Auth Page

### What's New
- Login/Register page (`/unlock.jsx`) with animated transitions.
- Integrated CAPTCHA, password validation, and smooth UI.

---

## v1.4.3 — Improved Sparkline Charts

### Improvements
- Unified chart rendering with padding and line smoothing.
- Cleaned up spacing across all chart-enabled layouts.

---

## v1.4.2 — Layout Spacing Improvements

### Improvements
- Adjusted spacing for `modern` layout:
  - Name: left-padded.
  - Price: spaced from Name.
  - Volume/%: right-aligned.
  - Chart: padded right.

---

## Reliable Multi-Provider API — v1.4.1

This release introduces robust **failover logic** and improved **data reliability** across all badge endpoints by integrating three major crypto data providers. It marks a significant step toward making the GitHub README badges resilient and production-ready.

### What's New
- **Failover API system** implemented across all endpoints:
  - **Primary:** CoinGecko
  - **Secondary:** CoinMarketCap
  - **Fallback:** Binance Public API
- All endpoints (`/api/price.js`, `/api/volume.js`, `/api/trend.js`, `/api/chart.js`) now adapt to provider downtimes automatically.
- Live rendering of sparkline charts via `/api/chart.js`.

### Improvements
- Unified decimal formatting (e.g., `1.2K`, `3.5M`, `8.4B`) across all badges.
- Enhanced error handling and auto-recovery on request failure.
- More stable and responsive performance under heavy usage.

### Fixes
- Fixed chart rendering bugs on specific resolutions.
- Prevented null data from causing blank badges.
- Improved compatibility for GitHub dark/light themes.

---

## [Superseded] v1.4.0

> This version was skipped due to GitHub rejecting the release tag as invalid. All intended changes were immediately carried into `v1.4.1`.  
> See `v1.4.1` for details.

---

## Stable API & Chart Support — v1.3.0

A stable and modular milestone for the project with improved rendering and maintenance.

### What's New
- `/api/chart.js` for sparkline chart rendering.
- New trend indicator badges in `/api/trend.js`.

### Improvements
- Decimal formatting (1.2K, 3.5M, etc.).
- Better fallback for unavailable data.
- Refactored for easier maintenance.

### Fixes
- Chart render bugs on certain sizes.
- API timeout failover protection.

---

## Chart Rendering — v1.2.0

Adds visual support with sparkline charts.

### What's New
- `/api/chart.js`: renders price trend line charts.

### Fixes
- Layout and badge rendering bugs.
- Minor improvements to performance and response times.

---

## Extended Badge Support — v1.1.0

Introduces new endpoints for trend and volume.

### What's New
- `/api/volume.js`: 24h trading volume.
- `/api/trend.js`: simple trend indicator (up/down).
- Refactored API response structure.

---

## Initial Idea — v1.0.0

First release of `crypto-price-readme`.

### What's Included
- `/api/price.js`: fetches live prices from CoinGecko.
- Simple badge display using Shields.io format.
- Deployed to Vercel.
