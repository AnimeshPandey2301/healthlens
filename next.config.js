const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^\/emergency/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'emergency-pages',
        expiration: { maxEntries: 20, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^\/api\//,
      handler: 'NetworkOnly',
    },
    {
      urlPattern: /\/_next\/static\//,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: { maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /.*/,
      handler: 'NetworkFirst',
      options: { cacheName: 'pages', networkTimeoutSeconds: 10 },
    },
  ],
});

module.exports = withPWA({ reactStrictMode: true, turbopack: {} });
