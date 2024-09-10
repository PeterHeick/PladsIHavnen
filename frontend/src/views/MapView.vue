<template>
  <div class="map-container">
    <SplashScreen v-if="showSplash" />
    <div class="top-bar">
      <span>{{ currentHarbor ? currentHarbor.name : "" }}</span>
      <SearchBar @search="handleSearch" />

    </div>

    <div class="second-top-bar">
      <span><img :src="getInfoIcon()" alt="Info" class="info-icon" @click="toggleInfo" /></span>
      <span v-for="facilityName in facilitiesArray" :key="facilityName" class="facility-icon">
        <img :src="getFacilityIcon(facilityName)" :alt="facilityName" :title="facilityName"
          class="header-marker-icon" />
      </span>
    </div>

    <div v-if="showInfo" class="info-text">
      <p>
        Her kan du få information om kortet, hvordan du bruger det, og hvad du kan forvente at finde.
      </p>
      <button @click="toggleInfo">Luk</button>
    </div>

    <div class="map-content">
      <div ref="mapElement" class="map"> </div>
      <div v-if="!showSplash" class="marker-list-container">
        <!-- <div v-if="!showSplash" ref="markerList" class="marker-list-container draggable" @mousedown="startDrag"> -->
        <div class="marker-list">
          <ul>
            <li v-for="markerType in markerTypes.filter(type => type.name !== 'Havn' && type.name !== 'Båd')"
              :key="markerType.name" @click="selectedMarkerType = markerType">
              <img :src="markerType.icon" :alt="markerType.name" class="marker-icon" />
            </li>

            <li @click="selectedMarkerType = greenMarkerType">
              <svg width="18" height="18" viewBox="0 0 100 100" class="marker-icon">
                <circle cx="50" cy="50" r="50" fill="green" />
              </svg>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/// <reference types="@types/google.maps" />
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useStore } from 'vuex'
import SearchBar from '@/components/SearchBar.vue'

import { LocationMarker, MarkerType, markerTypes, greenMarkerType } from '@/types'
import { getCurrentPosition } from '@/services/geoLocationService';
import { mapService } from '@/services/mapService';
import markerService from '@/services/markerService'
import SplashScreen from '@/components/SplashScreen.vue'
import harborService, { currentHarbor } from '@/services/harborService'
import { debounce } from 'lodash-es';
import infoIcon from '@/assets/icons/info.png'

const store = useStore()
const showSplash = ref(true);
// const mapElement = ref<HTMLElement | null>(null)
const mapElement = ref<HTMLElement | null>(document.getElementById('map'))
const selectedMarkerType = ref<MarkerType | null>(null)
let selectedMarker: google.maps.marker.AdvancedMarkerElement | null = null

const showInfo = ref(false);

const toggleInfo = () => {
  showInfo.value = !showInfo.value;
}

// Tilstand for søgefeltet
// const showSearch = ref(false);
// const markerList = ref<HTMLElement | null>(null);

const facilitiesArray = computed(() => {
  if (!currentHarbor.value) return [];
  if (!currentHarbor.value.facilities) return [];

  return Object.entries(currentHarbor.value.facilities)
    .filter(([key, value]) => value === true && key !== 'Grøn Markør')
    .map(([key]) => key);
});

const getFacilityIcon = (facilityName: string) => {
  const markerType = markerTypes.find(type => type.name.toLowerCase() === facilityName.toLowerCase())
  return markerType ? markerType.icon : ''
}

const getInfoIcon = () => {
  console.log('MapView: Info icon:', infoIcon);
  return infoIcon;
};

const handleSearch = async (harborName: string) => {
  console.log(`%c Search ${harborName}`, 'color: red; font-weight: bold; font-size: 16px');
  console.log('Søger efter havn:', harborName);
  try {
    const harbor = await store.dispatch('harbor/searchHarbor', harborName);
    // currentHarbor.value = harbor;

    if (harbor) {
      console.log('Havn fundet:', harbor);
      mapService.centerMapOnLocation(harbor.position);
    } else {
      console.log('Havn ikke fundet:', harborName);
    }
  } catch (error) {
    console.error('Fejl under søgning efter havn:', error);
  }
};

// -----------------------------------------------------
// Marker handling
// -----------------------------------------------------

// Opretter en ny markør i databasen og på kortet
// Ikke en havn

const placeMarker = (event: google.maps.MapMouseEvent) => {
  console.log('Placing marker:', event.latLng?.toString());
  console.log('Selected marker type:', selectedMarkerType.value);

  const markerType = selectedMarkerType.value;
  if (!markerType) {
    console.log('Click event without marker type');
    return;
  }

  console.log('Selected marker type, selectedMarkerType');
  console.dir(markerType);
  console.dir(event.latLng);
  if (event.latLng && markerType) {

    console.log(`event.latLng: ${event.latLng} type: ${typeof event.latLng}`)
    const latLng = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    }

    const newMarker: Omit<LocationMarker, 'uuid'> = {
      position: latLng,
      name: markerType.name
    }
    console.log(`MapView.placeMarker: newMarker: ${newMarker}`);
    store.dispatch('marker/addMarker', { newMarker: newMarker })
      .then((marker) => {
        console.log(`MapView.placeMarker: marker: ${JSON.stringify(marker)}`);
        const mark = mapService.setMarker(marker.uuid, marker.position, marker.name);
        if (mark) {
          mark.addListener("click", () => {
            selectMarker(mark)
          })
          console.log('Marker created:');
          console.dir(marker);
          selectedMarkerType.value = null;
        }
      }
      )
  }
};

const removeSelectedMarker = () => {
  if (selectedMarker) {
    console.log('Fjerner markør:', selectedMarker);
    store.dispatch('marker/deleteMarker', selectedMarker);
    selectedMarker = null
  }
}

// -----------------------------------------------------
// Utilities
// -----------------------------------------------------

const selectMarker = (marker: google.maps.marker.AdvancedMarkerElement) => {
  if (selectedMarker === marker) {
    selectedMarker = null;
  } else {
    selectedMarker = marker;
  }
}

const handleDeleteKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Delete') {
    console.log('Deleting selected marker:', selectedMarker)
  }
  if (event.key === 'Delete' && selectedMarker) {
    removeSelectedMarker()
  }
}

const initMap = async () => {
  console.log('MapView.initMap');
  let isFirstLoad = true;

  if (mapElement.value) {
    const position = await getCurrentPosition();
    console.log('MapView.initMap: Current position:', position);
    if (position) {
      let nearestHarbor = await store.dispatch('harbor/fetchNearestHarbor', {
        lat: position.lat,
        lng: position.lng,
        radius: 50000 // 50 km radius
      });
      if (!nearestHarbor) {
        console.log('MapView.initMap: No nearby harbor found, searching for Københavns Havn');
        nearestHarbor = await store.dispatch('harbor/searchHarbor', 'Københavns Havn');
      }

      const center = nearestHarbor.position;

      console.log('MapView.initMap: Initializing map ...');
      showSplash.value = false;

      // Initialiser kortet med brugerens position
      const map = await mapService.initMap(mapElement.value, { center });


      map.addListener('click', placeMarker);

      const handleMapIdle = async () => {
        console.log('%c==================== IDLE ====================', 'color: red; font-weight: bold; font-size: 16px');

        console.log('MapView.initMap: Map idle event');
        if (mapService.getIgnoreNextIdle()) {
          console.log('MapView.initMap: idle event ignored');
          mapService.setIgnoreNextIdle(false);
          return;
        }
        const bounds = map.getBounds();
        if (!bounds) {
          console.error('MapView.initMap: No bounds found');
          return;
        }
        const center = bounds.getCenter();
        console.log(`%c Center: ${center}`, 'color: red; font-weight: bold; font-size: 16px');

        if (!isFirstLoad) {
          let nearestHarbor = await store.dispatch('harbor/fetchNearestHarbor', {
            lat: center.lat(),
            lng: center.lng(),
            radius: 50000 // 50 km radius
          });

        } else {
          window.addEventListener('keydown', handleDeleteKeyPress);
          isFirstLoad = false;
        }

        await Promise.all([
          harborService.setVisibleHarbors(bounds),
          markerService.setVisibleMarkers(bounds)
        ]);
        console.log('%c IDLE End', 'color: red; font-weight: bold; font-size: 16px');
      };

      const debouncedHandleMapIdle = debounce(handleMapIdle, 500);
      map.addListener('idle', debouncedHandleMapIdle);
    }
  } else {
    console.error('MapView.initMap: No map element found');
  }
};

onMounted(async () => {
  console.log('Mounted')
  await initMap()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleDeleteKeyPress)
})
</script>

<style scoped>
.map-container {
  flex-direction: column;
  position: relative;
  display: flex;
  height: 100vh;
  width: 100%;
}

.map-content {
  /* position: relative; */
  width: 100%;
  height: 100%;
  display: flex;
  flex: 1;
}

.map {
  /* flex: 1; */
  height: 100%;
  width: 100%;
}

.marker-list-container {
  position: absolute;
  top: 120px;
  right: 10px;
  z-index: 1000;
  /* Sørg for, at listen er oven på kortet */
  background-color: rgba(255, 255, 255, 0.9);
  /* Hvid baggrund med lidt gennemsigtighed */
  border-radius: 8px;
  padding: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  cursor: move;
}

.info-icon-container {
  position: absolute;
  top: 150px;
  left: 10px;
  z-index: 1000;
  cursor: move;
  margin-right: 5px;
}

/* 
.marker-list {
  width: 60;
  padding: 20px;
  background-color: #f0f0f0;
  overflow-y: auto;
} */

.marker-list ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.marker-list li {
  /* display: flex; */
  align-items: center;
  margin-bottom: 10px;
  cursor: pointer;
}

.header-marker-icon {
  width: 18px;
  height: 18px;
  margin-right: 5px;
}

.marker-icon {
  width: 18px;
  height: 18px;
  margin-right: 5px;
}

.top-bar {
  width: 100%;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  box-sizing: border-box;
}

.top-bar span {
  flex: 1;
  /* Lad span fylde så meget plads som muligt */
}

.top-bar SearchBar {
  flex-shrink: 0;
  /* Forhindre SearchBar i at blive for lille */
}

.second-top-bar {
  width: 100%;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 10px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  box-sizing: border-box;
  /* background-color: lightgray;  */
}

.second-top-bar .facility-icon {
  margin-right: 10px;
  /* Tilføjer mellemrum mellem ikonerne */
}


.info-icon {
  cursor: pointer;
  width: 18px;
  height: 18px;
  margin-left: 5px;
  margin-right: 5px;
}

.info-text {
  position: absolute;
  top: 50px;
  right: 10px;
  background-color: white;
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}
</style>