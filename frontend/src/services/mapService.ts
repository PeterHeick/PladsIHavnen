import { ref } from 'vue'
import { initGoogleLoader } from './geoLocationService'
import { Position } from '@/types';
import axios from 'axios';
// import { API_URL } from '@/config';
const API_URL = 'https://unisoft.dk:3003/api'

const mapInstance = ref<google.maps.Map | null>(null)

export const mapService = {

  async initMap(element: HTMLElement, options: google.maps.MapOptions) {
    console.log('mapService: Initializing map...');
    try {
      const loader = await initGoogleLoader()
      const google = await loader.load()
      const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary

      mapInstance.value = new Map(element, { ...options, zoom: 16, mapTypeId: 'hybrid' })
      return mapInstance.value
    } catch (error) {
      console.error('mapService: Error initializing map:', error);
      throw error;
    }
  },

  getMap() {
    return mapInstance.value
  },

  setMap(map: google.maps.Map) {
    mapInstance.value = map
  },

  centerMapOnLocation(position: Position) {
    console.log('mapService: centerMapOnLocation:', position);
    if (mapInstance.value) {
      mapInstance.value.setCenter({ lat: position.lat, lng: position.lng });
      mapInstance.value.setZoom(17);
    }
  },

  // mapService.ts eller den relevante fil
  setMarker(position: Position, icon: string, type: string) {
    console.log('mapService: setMarker:', position, icon);
    if (mapInstance.value) {
      const mark = new google.maps.Marker({
        position: position,
        map: mapInstance.value,
        draggable: true,
        icon: {
          url: icon,
          scaledSize: new google.maps.Size(32, 32),
        },
        title: type
      });

      mark.setMap(mapInstance.value);
      return mark;
    }
  },

  // Opdater havnens position i databasen via et API-kald
  async updateHarborPosition(harborName: string, position: Position) {
    const response = await axios.put(`${API_URL}/harbors/${harborName}/position`, {
      position
    });

    return response.data;
  },

}