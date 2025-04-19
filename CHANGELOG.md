# Changelog

All notable changes to this project will be documented here.

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
