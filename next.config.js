// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/card',
        destination: '/api/card',
      },
      {
        source: '/cards',
        destination: '/api/cards',
      },
      {
        source: '/prices',
        destination: '/api/prices',
      },
    ]
  },
}
