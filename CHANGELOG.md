# Changelog

All notable changes to this project will be documented in this file.

## [v1.3.0] - 2025-04-18
### Added
- Chart API endpoint: `/api/chart.js` for sparkline visualization
- Trend direction indicator in `/api/trend.js`

### Improved
- Decimal formatting for prices and volumes
- Error handling and fallback (`N/A` if data is unavailable)
- Modular structure for easier maintenance

### Fixed
- Timeout errors during data fetching
- Chart rendering inconsistencies

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
