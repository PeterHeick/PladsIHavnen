import { createApp } from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";
import { initGoogleLoader } from './services/geoLocationService'

initGoogleLoader()

createApp(App).use(store).use(router).mount("#app");
