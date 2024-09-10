const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  pwa: {
    name: 'Er der plads i havnen',
    themeColor: '#4DBA87',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    workboxPluginMode: 'GenerateSW', // Brug GenerateSW til at automatisk generere en service worker
    workboxOptions: {
      skipWaiting: true, // Tving den nye service worker til at tage over med det samme
      clientsClaim: true, // Tving klienterne til at bruge den nye service worker
      runtimeCaching: [
        {
          urlPattern: ({ url }) => url.pathname.startsWith('/api/harbors'),
          handler: 'NetworkFirst',  // Brug NetworkFirst strategi for API-opkald
          options: {
            cacheName: 'harbors-api',
            expiration: {
              maxAgeSeconds: 60 * 60,  // Cache data i 1 time
            },
            networkTimeoutSeconds: 10,  // Timeout hvis netværket er langsomt
          },
        },
      ],
    },
  },
  devServer: {
    port: 8080,
    hot: true,
  },
})

