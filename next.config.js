// next.config.js
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  productionBrowserSourceMaps: false,
  async rewrites() {
    return [
      { source: '/card', destination: '/api/card' },
      { source: '/cards', destination: '/api/cards' },
      { source: '/prices', destination: '/api/prices' },
    ]
  },
}

module.exports = nextConfig
