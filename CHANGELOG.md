# Changelog

All notable changes to this project will be documented in this file.


## [v1.3.0] - 2025-04-18
### Added
- `/api/chart.js`: dynamic chart (sparkline) rendering for each coin.
- Trend indicator badges in `/api/trend.js`.

### Improved
- **Failover support**: if any API fails, system will display `Inaccesible` instead of crashing.
- **Decimal formatting**: prices and volumes are now human-readable (e.g. 1.2K, 4.5M, 22.3B).
- **Code modularity**: each endpoint now self-contained and easier to scale.

### Fixed
- Timeout issues on slow external APIs.
- Inconsistent chart width/height on various screen sizes.

---

## [v1.2.0] - 2025-04-16
- Added sparkline chart API
- Added trend up/down indicator using emoji badges

## [v1.1.0] - 2025-04-14
- Introduced decimal formatting (1.2K, 3.4M, etc.)
- Implemented fallback mechanism for missing API data

## [v1.0.0] - 2025-04-12
- Initial release
- Endpoints: `/api/price.js`, `/api/volume.js`, `/api/trend.js`
- Stable deployment to production (`crypto-price-on.vercel.app`)
- Supports dynamic badge generation via shields.io
