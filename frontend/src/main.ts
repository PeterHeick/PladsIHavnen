import { createApp } from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";
import { initGoogleLoader } from './services/geoLocationService'
import packageInfo from '../package.json'

console.log(`App version: ${packageInfo.version}`);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('New service worker activated, reloading the page...');
    window.location.reload();  // Genindlæs siden, når den nye service worker er aktiveret
  });

  navigator.serviceWorker.ready.then(registration => {
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New version available, refreshing...');
            window.location.reload();  // Genindlæs siden automatisk, når den nye version er tilgængelig
          }
        });
      }
    });
  });
}

initGoogleLoader()

const app = createApp(App)
app.use(store).use(router).mount("#app");

app.config.globalProperties.$updateAvailable = false;