// next.config.js
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  productionBrowserSourceMaps: false,

  images: {
    unoptimized: true, // Karena lu project static API-based
  },

  experimental: {
    scrollRestoration: true, // Scroll tetap di posisi pas back/forward
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      { source: '/card', destination: '/api/card' },
      { source: '/cards', destination: '/api/cards' },
      { source: '/prices', destination: '/api/prices' },
    ];
  },
};

module.exports = nextConfig;
