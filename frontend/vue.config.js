const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  pwa: {
    name: 'Er der plads i havnen',
    themeColor: '#4DBA87',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    workboxPluginMode: 'GenerateSW',
    workboxOptions: {
      skipWaiting: true,
      clientsClaim: true,
      runtimeCaching: [
        {
          urlPattern: ({ url }) => url.pathname.startsWith('/api/harbors'),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'harbors-api',
            expiration: {
              maxAgeSeconds: 60 * 60, // Cache i 1 time
            },
          },
        },
      ],
    }
  }
})

