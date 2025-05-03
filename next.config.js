const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  productionBrowserSourceMaps: false,

  images: {
    unoptimized: true, 
  },

  experimental: {
    scrollRestoration: true, 
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
      { source: '/traffic-badge', destination: '/api/traffic-badge' }, // Tambahkan ini
    ];
  },
};

module.exports = nextConfig;
