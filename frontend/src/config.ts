// export let API_URL: string;

// if (process.env.NODE_ENV === "production") {
//   API_URL = process.env.VUE_APP_PRODUCTION_URL;
// } else {
//   API_URL = process.env.VUE_APP_DEVELOPMENT_URL;
// }

export const API_URL = process.env.VUE_APP_API_URL
export const API_KEY = process.env.VUE_APP_GOOGLE_MAPS_API_KEY;
export const API_MAPID = process.env.VUE_APP_MAPID;

export const zoom = 16;       // Zoomniveau for kortet
export const MARKERSZ = 20;   // Størrelse af markører

export const MapControlOptions = {
  zoom,
  zoomControl: false,
  rotateControl: false,
  fullscreenControl: false,
  mapId: API_MAPID,
  mapTypeId: 'hybrid'
};

console.log('API_URL:', API_URL)
console.log("Test ", process.env.VUE_APP_TEST)
// console.log("API_KEY:", API_KEY)
