<template>
  <div class="map-container">
    <SplashScreen v-if="showSplash" />
    <div class="top-bar">
      <span>{{ currentHarbor?.name || "" }}</span>
      <SearchBar @search="handleSearch" />
    </div>

    <div class="second-top-bar">
      <span @click="toggleInfo">
        <img :src="infoIcon" alt="Info" class="info-icon" />
      </span>
      <span v-for="facilityName in facilitiesArray" :key="facilityName" class="facility-icon">
        <img :src="getFacilityIcon(facilityName)" :alt="facilityName" :title="facilityName"
          class="header-marker-icon" />
      </span>
    </div>

    <Transition name="fade">
      <div v-if="showInfo" class="info-text">
        <p>
          Her kan du få information om kortet, hvordan du bruger det, og hvad du kan forvente at finde.
        </p>
        <button @click="toggleInfo">Luk</button>
      </div>
    </Transition>

    <div class="map-content">
      <div ref="mapElement" class="map"></div>
      <div v-if="!showSplash" class="marker-list-container">
        <div class="marker-list">
          <ul>
            <li v-for="markerType in filteredMarkerTypes" :key="markerType.name" @click="selectMarkerType(markerType)">
              <img :src="markerType.icon" :alt="markerType.name" class="marker-icon" />
            </li>
            <li @click="selectMarkerType(greenMarkerType)">
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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useStore } from 'vuex'
import { debounce } from 'lodash-es'
import { LocationMarker, MarkerType, markerTypes, greenMarkerType } from '@/types'
import { getCurrentPosition } from '@/services/geoLocationService'
import { mapService } from '@/services/mapService'
import markerService from '@/services/markerService'
import harborService, { currentHarbor } from '@/services/harborService'
import SearchBar from '@/components/SearchBar.vue'
import SplashScreen from '@/components/SplashScreen.vue'
import infoIcon from '@/assets/icons/info.png'

const store = useStore()
const showSplash = ref(true)
const mapElement = ref<HTMLElement | null>(null)
const selectedMarkerType = ref<MarkerType | null>(null)
const showInfo = ref(false)
let selectedMarker: google.maps.marker.AdvancedMarkerElement | null = null

const toggleInfo = () => {
  showInfo.value = !showInfo.value
}

const facilitiesArray = computed(() => 
  Object.entries(currentHarbor.value?.facilities || {})
    .filter(([key, value]) => value === true && key !== 'Grøn Markør')
    .map(([key]) => key)
)

const filteredMarkerTypes = computed(() => 
  markerTypes.filter(type => !['Havn', 'Båd'].includes(type.name))
)

const getFacilityIcon = (facilityName: string) => {
  const markerType = markerTypes.find(type => type.name.toLowerCase() === facilityName.toLowerCase())
  return markerType?.icon || ''
}

const handleSearch = async (harborName: string) => {
  try {
    const harbor = await store.dispatch('harbor/searchHarbor', harborName)
    if (harbor) {
      mapService.centerMapOnLocation(harbor.position)
    } else {
      console.log('Havn ikke fundet:', harborName)
    }
  } catch (error) {
    console.error('Fejl under søgning efter havn:', error)
  }
}

const placeMarker = async (event: google.maps.MapMouseEvent) => {
  if (!selectedMarkerType.value || !event.latLng) return

  const latLng = { lat: event.latLng.lat(), lng: event.latLng.lng() }
  const newMarker: Omit<LocationMarker, 'uuid'> = {
    position: latLng,
    name: selectedMarkerType.value.name
  }

  try {
    const marker = await store.dispatch('marker/addMarker', { newMarker })
    const mark = mapService.setMarker(marker.uuid, marker.position, marker.name)
    if (mark) {
      mark.addListener("click", () => selectMarker(mark))
      selectedMarkerType.value = null
    }
  } catch (error) {
    console.error('Error placing marker:', error)
  }
}

const selectMarker = (marker: google.maps.marker.AdvancedMarkerElement) => {
  selectedMarker = selectedMarker === marker ? null : marker
}

const removeSelectedMarker = () => {
  if (selectedMarker) {
    store.dispatch('marker/deleteMarker', selectedMarker)
    selectedMarker = null
  }
}

const handleDeleteKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Delete' && selectedMarker) {
    removeSelectedMarker()
  }
}

const initMap = async () => {
  if (!mapElement.value) {
    console.error('MapView.initMap: No map element found')
    return
  }

  try {
    const position = await getCurrentPosition()
    let nearestHarbor = await store.dispatch('harbor/fetchNearestHarbor', {
      lat: position.lat,
      lng: position.lng,
      radius: 50000
    })

    if (!nearestHarbor) {
      nearestHarbor = await store.dispatch('harbor/searchHarbor', 'Københavns Havn')
    }

    showSplash.value = false
    const map = await mapService.initMap(mapElement.value, { center: nearestHarbor.position })

    map.addListener('click', placeMarker)

    const handleMapIdle = debounce(async () => {
      console.log('%c==================== IDLE ====================', 'color: red; font-weight: bold; font-size: 16px');

      const bounds = map.getBounds()
      if (!bounds) return

      const center = bounds.getCenter()
      await store.dispatch('harbor/fetchNearestHarbor', {
        lat: center.lat(),
        lng: center.lng(),
        radius: 50000
      })

      await Promise.all([
        harborService.setVisibleHarbors(bounds),
        markerService.setVisibleMarkers(bounds)
      ])
      console.log('%c IDLE End', 'color: red; font-weight: bold; font-size: 16px')
    }, 500)

    map.addListener('idle', handleMapIdle)
    window.addEventListener('keydown', handleDeleteKeyPress)
  } catch (error) {
    console.error('Error initializing map:', error)
  }
}

const selectMarkerType = (markerType: MarkerType) => {
  selectedMarkerType.value = markerType
}

onMounted(async () => {
  await initMap()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleDeleteKeyPress)
})
</script>

<style scoped>
/* Styles remain the same */
</style>

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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>