module.exports = {
  siteUrl: 'https://crypto-price-on.vercel.app',
  generateRobotsTxt: true,
  outDir: './public',
  sitemapSize: 7000,
  changefreq: 'weekly',
  priority: 0.7,
  generateIndexSitemap: false,
  exclude: [
    '/', // homepage
    '/CategoryDropdown',
    '/ModelDropdown',
    '/ThemeDropdown',
    '/custom',
    '/preview',
    // other pages
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        disallow: '/',
        allow: '/unlock',
      },
    ],
    additionalSitemaps: [
      'https://crypto-price-on.vercel.app/sitemap-0.xml',
    ],
  },
};
