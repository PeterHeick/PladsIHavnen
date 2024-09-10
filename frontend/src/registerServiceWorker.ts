/* eslint-disable no-console */

import { register } from "register-service-worker";
import { ref } from 'vue';

export const updateAvailable = ref(false);

if (process.env.NODE_ENV === "production") {
  register(`${process.env.BASE_URL}service-worker.js`, {
    ready() {
      console.log(
        "App is being served from cache by a service worker.\n" +
        "For more details, visit https://goo.gl/AFskqB"
      );
    },
    registered() {
      console.log("Service worker has been registered.");
    },
    cached() {
      console.log("Content has been cached for offline use.");
    },
    updatefound() {
      console.log("New content is downloading.");
    },
    updated(registration) {
      console.log("New content is available; please refresh.");
      updateAvailable.value = true;
      // Tilføj event listener for at håndtere SKIP_WAITING beskeder
      registration.waiting?.addEventListener('statechange', (event) => {
        if ((event.target as ServiceWorker).state === 'activated') {
          window.location.reload();
        }
      });
    },
    offline() {
      console.log(
        "No internet connection found. App is running in offline mode."
      );
    },
    error(error) {
      console.error("Error during service worker registration:", error);
    },
  });
}

export function applyUpdate() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(reg => {
      reg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
    });
  }
}
