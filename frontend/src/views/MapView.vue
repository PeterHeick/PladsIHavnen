<template>
  <div class="map-container">
    <SplashScreen v-if="showSplash" />
    <div class="top-bar">
      <span>{{ currentHarbor ? currentHarbor.name : "" }}</span>
      <SearchBar @search="handleSearch" />
    </div>

    <div class="map-content">
      <div ref="mapElement" class="map"></div>
      <!-- <div v-if="!showSplash" class="marker-list-container"> -->
      <div v-if="!showSplash" ref="markerList" class="marker-list-container draggable" @mousedown="startDrag">
        <div class="marker-list">
          <ul>
            <li v-for="markerType in markerTypes.filter(type => type.name !== 'Havn')" :key="markerType.name"
              @click="selectedMarkerType = markerType">
              <img :src="markerType.icon" :alt="markerType.name" class="marker-icon" />
            </li>

            <!--
          <li v-for="markerType in markerTypes" :key="markerType.name" @click="selectedMarkerType = markerType">
            <img :src="markerType.icon" :alt="markerType.name" class="marker-icon" /> 
          </li>
          -->
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/// <reference types="@types/google.maps" />
import { ref, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { initGoogleLoader } from '@/services/geoLocationService'
import SearchBar from '@/components/SearchBar.vue'

import boatIcon from '@/assets/icons/boat.png'
import anchorIcon from '@/assets/icons/anchor.png'
import toiletIcon from '@/assets/icons/toilet.png'
import waterIcon from '@/assets/icons/water.png'
import electricityIcon from '@/assets/icons/electricity.png'
import dieselIcon from '@/assets/icons/diesel.png'
import pumpIcon from '@/assets/icons/pump.png'
import { Harbor, LocationMarker } from '@/types'
import { getCurrentPosition } from '@/services/geoLocationService';
import { mapService } from '@/services/mapService';
import markerService from '@/services/markerService'
import SplashScreen from '@/components/SplashScreen.vue'

console.log('Boat icon:', boatIcon)
console.log('Anchor icon:', anchorIcon)
const store = useStore()

interface MarkerType {
  name: string,
  icon: string
}

const markerTypes: MarkerType[] = [
  { name: 'Båd', icon: boatIcon },
  { name: 'Havn', icon: anchorIcon },
  { name: 'Toilet', icon: toiletIcon },
  { name: 'Vand', icon: waterIcon },
  { name: 'El', icon: electricityIcon },
  { name: 'Diesel', icon: dieselIcon },
  { name: 'Pumpe', icon: pumpIcon },
]

const showSplash = ref(true);
const mapElement = ref<HTMLElement | null>(null)
const selectedMarkerType = ref<MarkerType | null>(null)
let map: google.maps.Map
let selectedMarker: google.maps.Marker | null = null
let currentHarbor = ref<Harbor | null>(null);

console.log('Marker types:', markerTypes)

// Tilstand for søgefeltet
const showSearch = ref(false);
const searchQuery = ref('');

const markerList = ref<HTMLElement | null>(null);


const startDrag = (event: MouseEvent) => {
  if (!markerList.value) return;

  const shiftX = event.clientX - markerList.value.getBoundingClientRect().left;
  const shiftY = event.clientY - markerList.value.getBoundingClientRect().top;

  const moveAt = (pageX: number, pageY: number) => {
    if (markerList.value) {
      markerList.value.style.left = `${pageX - shiftX}px`;
      markerList.value.style.top = `${pageY - shiftY}px`;
    }
  };

  const onMouseMove = (event: MouseEvent) => {
    moveAt(event.pageX, event.pageY);
  };

  document.addEventListener('mousemove', onMouseMove);

  document.addEventListener('mouseup', () => {
    document.removeEventListener('mousemove', onMouseMove);
  }, { once: true });
};

// Funktion til at toggler visningen af søgefeltet
const toggleSearch = () => {
  showSearch.value = !showSearch.value;
}

// Dummy søgefunktion til senere brug
const onSearch = () => {
  console.log('Searching for:', searchQuery.value);
}

// -----------------------------------------------------
// Håndtering af søgning
// -----------------------------------------------------
const handleSearch = async (harborName: string) => {
  console.log('Søger efter havn:', harborName);
  try {
    const harbor = await store.dispatch('markers/getOrCreateHarbor', harborName);
    currentHarbor.value = harbor;

    if (harbor) {
      console.log('Havn fundet:', harbor);
      // mapService.centerMapOnLocation(harbor.position);
      displayHarborMarkers(harbor);
    } else {
      console.log('Havn ikke fundet:', harborName);
    }
  } catch (error) {
    console.error('Fejl under søgning efter havn:', error);
  }
};

const displayHarborMarkers = async (harbor: any) => {
  // const markers = await store.dispatch('markers/fetchMarkersByHarbor', currentHarbor.value);
  const markers = await store.dispatch('markers/fetchMarkersByPosition', currentHarbor.value?.position);
  if (map && currentHarbor.value?.position) {
    console.log('MapView.displayHarborMarkers', markers);
    markers.forEach((marker: LocationMarker) => {
      console.log('Adding marker:', marker)
      const markerType = markerTypes.find(m => m.name === marker.type);
      if (markerType) {
        const mark = mapService.setMarker(marker.position, markerType.icon, markerType.name);

        if (mark)
          mark.addListener("click", () => {
            selectMarker(mark)
          })
      }
    })
    map.addListener("click", placeMarker)
    showSplash.value = false;
  } else {
    console.log('MapView.initMap: Map not initialized:', map);
  }
};

// -----------------------------------------------------
// Marker handling
// -----------------------------------------------------
const placeMarker = (event: google.maps.MapMouseEvent) => {
  console.log('Placing marker:', event.latLng?.toString());
  console.log('Selected marker type:', selectedMarkerType.value);

  if (event.latLng && map && selectedMarkerType.value && currentHarbor.value) {

    console.log(`event.latLng: ${event.latLng} type: ${typeof event.latLng}`)
    const latLng = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    }

    const newMarker: Omit<LocationMarker, 'uuid'> = {
      position: latLng,
      type: selectedMarkerType.value.name,
      name: `${selectedMarkerType.value.name} Marker`
    }
    console.log(`MapView.placeMarker: newMarker: ${JSON.stringify(newMarker)} harbor; ${JSON.stringify(currentHarbor.value)}`);
    store.dispatch('markers/addMarker', { newMarker: newMarker, harbor: currentHarbor.value });

    const mark = mapService.setMarker(latLng, selectedMarkerType.value.icon, selectedMarkerType.value.name);

    if (mark)
      mark.addListener("click", () => {
        selectMarker(mark)
      })

    console.log('Marker created:', mark);
    console.log('Marker icon URL:', selectedMarkerType.value.icon);
    console.log('Marker name:', selectedMarkerType.value.name);
    selectedMarkerType.value = null;
  }
};

const removeSelectedMarker = () => {
  if (selectedMarker) {
    console.log('Fjerner markør:', selectedMarker);
    selectedMarker.setAnimation(null);

    selectedMarker.setMap(null)
    console.log('Markørens kort efter fjernelse:');

    store.dispatch('markers/deleteMarker', selectedMarker);
    selectedMarker = null
  }
}

// -----------------------------------------------------
// Utilities
// -----------------------------------------------------

const selectMarker = (marker: google.maps.Marker) => {
  if (selectedMarker === marker) {
    marker.setAnimation(null);
    selectedMarker = null;
  } else {
    if (selectedMarker) {
      selectedMarker.setAnimation(null);
    }

    // Sæt den nye marker som valgt og start hoppe-animationen
    selectedMarker = marker;
    marker.setAnimation(google.maps.Animation.BOUNCE);
  }
}

// const selectMarker = (marker: google.maps.Marker) => {
//   if (selectedMarker) {
//     selectedMarker.setAnimation(null)
//   }

//   selectedMarker = marker;
//   console.log(selectedMarker)
//   marker.setAnimation(google.maps.Animation.BOUNCE)
// }

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
  const loader = await initGoogleLoader()
  const google = await loader.load()
  const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary
  let nearestHarbors: any[] = []
  let markers: LocationMarker[] = []

  console.log('MapView.initMap efter initGoogleLoader:', mapElement.value);
  if (mapElement.value) {
    const position = await getCurrentPosition();
    console.log('MapView.initMap: Current position:', position);
    if (position) {
      nearestHarbors = await store.dispatch('markers/fetchNearestHarbors', {
        lat: position.lat,
        lng: position.lng,
        radius: 50000 // 50 km radius
      });
      console.log('Nearest harbors:', nearestHarbors);
    }

    console.log('MapView.initMap: Nearest harbors:', nearestHarbors);
    if (nearestHarbors && nearestHarbors.length > 0) {
      let { distance, ...harborWithoutDistance } = nearestHarbors[0];
      currentHarbor.value = harborWithoutDistance;
    }

    if (!currentHarbor.value) {
      currentHarbor.value = {
        id: 0,
        name: 'Københavns Havn',
        position: { lat: 55.680618846532155, lng: 12.585962041851106 },
        facilities: [],
        capacity: 0,
        available_spots: 0
      }
      currentHarbor.value = await store.dispatch('markers/createHarbor', currentHarbor.value);
    }
    console.log('MapView.initMap: Current harbor:', currentHarbor.value);

    if (currentHarbor.value) {
      map = await store.dispatch('map/initializeMap', {
        element: mapElement.value,
        options: {
          center: { lat: currentHarbor.value.position.lat, lng: currentHarbor.value.position.lng },
        }
      });
      markerService.showHarbor(currentHarbor.value, { lat: currentHarbor.value.position.lat, lng: currentHarbor.value.position.lng })

      displayHarborMarkers(currentHarbor.value)
        .then(() => {
          console.log('MapView.initMap: Map initialized:', map);
          showSplash.value = false;
        })
    }
  }
  window.addEventListener('keydown', handleDeleteKeyPress)
}

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

.marker-icon {
  width: 24px;
  height: 24px;
  margin-right: 5px;
}

.top-bar {
  width: 100%;
  height: 50px;
  /* Angiv en specifik højde for topbjælken */
  background-color: rgba(255, 255, 255, 0.9);
  padding: 10px;
  display: flex;
  /* justify-content: flex-end; */
  justify-content: space-between;
  align-items: center;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  box-sizing: border-box;
  /* Inkluder padding i elementets samlede størrelse */
}


.top-bar span {
  flex: 1;
  /* Lad span fylde så meget plads som muligt */
}


.top-bar SearchBar {
  flex-shrink: 0;
  /* Forhindre SearchBar i at blive for lille */
}
</style>