import { ref } from 'vue'
import { markerTypes, Position } from '@/types';
import store from '@/store';
import { MapControlOptions, MARKERSZ, zoom } from '@/config';

let mapInstance: google.maps.Map | null = null;

// const mapInstance = ref<google.maps.Map | null>(null);
const currentInfoWindow = ref<google.maps.InfoWindow | null>(null);
// Map henviser til type Map og ikke ikke google Map
const markersMap = new Map<string, any>();

// function addMarker(uuid: string, marker: google.maps.Marker) {
function addMarker(uuid: string, marker: google.maps.marker.AdvancedMarkerElement) {

  if (!markersMap.has(uuid)) {
    markersMap.set(uuid, marker);
    console.log(`mapService: Markør med UUID ${uuid} tilføjet.`);
  } else {
    console.log(`mapService: Markør med UUID ${uuid} findes allerede.`);
  }
}

function removeMarker(uuid: string) {

  const marker = markersMap.get(uuid);
  if (marker) {
    marker.setMap(null);
    markersMap.delete(uuid);
    console.log(`mapService: Markør med UUID ${uuid} fjernet.`);
  } else {
    console.log(`mapService: Ingen markør fundet med UUID ${uuid}.`);
  }
}

function showDeleteConfirmation(marker: google.maps.marker.AdvancedMarkerElement, uuid: string) {
  if (currentInfoWindow.value) {
    currentInfoWindow.value.close();
  }

  const infoWindow = new google.maps.InfoWindow({
    content: `
      <div>
        <button id="delete-yes">Slet</button>
        <button id="delete-no">Anuller</button>
      </div>
    `,
  });

  infoWindow.open(mapInstance, marker);
  currentInfoWindow.value = infoWindow;

  // Vi bruger setTimeout for at sikre, at DOM'en er opdateret
  setTimeout(() => {
    const yesButton = document.getElementById('delete-yes');
    const noButton = document.getElementById('delete-no');

    if (yesButton && noButton) {
      yesButton.addEventListener('click', () => {
        removeMarker(uuid);
        store.dispatch('marker/deleteMarker', uuid);
        infoWindow.close();
      });
      noButton.addEventListener('click', () => infoWindow.close());
    }
  }, 0);
}

export const mapService = {
  ignoreNextIdle: ref(false),
  async initMap(element: HTMLElement, options: google.maps.MapOptions) {
    console.log('mapService: Initializing map...');
    try {
      const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

      if (!element) {
        throw new Error('mapService: No map element found');
      }

      mapInstance = new Map(element, { ...options, ...MapControlOptions })
      console.log('mapService: Map initialized:', mapInstance);

      return mapInstance
    } catch (error) {
      console.error('mapService: Error initializing map:', error);
      throw error;
    }
  },

  getIgnoreNextIdle(): boolean {
    console.log('mapService: getIgnoreNextIdle:', this.ignoreNextIdle.value);
    return this.ignoreNextIdle.value;
  },

  setIgnoreNextIdle(value: boolean): void {
    console.log('mapService: setIgnoreNextIdle:', value);
    this.ignoreNextIdle.value = value;
  },

  centerMapOnLocation(position: Position) {
    console.log('mapService: centerMapOnLocation:', position);
    if (mapInstance) {
      this.ignoreNextIdle.value = true;
      console.log('mapService: centerMapOnLocation: mapInstance:', mapInstance);
      mapInstance.setCenter({ lat: position.lat, lng: position.lng });
      mapInstance.setZoom(zoom);
    } else {
      console.error('mapService: centerMapOnLocation: No map instance found');
    }
  },

  // Sætter markør på kortet, opretter ikke i databasen
  setMarker(uuid: string, position: Position, name: string, title?: string) {
    console.log('mapService: setMarker:', name);
    console.dir(position);
    if (mapInstance) {
      let zIndex = 1;
      let markerContent: HTMLElement;
  
      if (name === 'Grøn Markør') {
        // Opret en container for SVG
        markerContent = document.createElement('div');
        markerContent.className = 'custom-marker green-marker';
  
        // Opret en grøn cirkel som SVG
        const svgMarker = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgMarker.setAttribute("width", `${MARKERSZ}`);
        svgMarker.setAttribute("height", `${MARKERSZ}`);
        svgMarker.setAttribute("viewBox", "0 0 100 100");
  
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", "50");
        circle.setAttribute("cy", "50");
        circle.setAttribute("r", "40");
        circle.setAttribute("fill", "#00FF00");
        circle.setAttribute("stroke", "#00FF00");
        circle.setAttribute("stroke-width", "2");
  
        svgMarker.appendChild(circle);
        markerContent.appendChild(svgMarker);
        
        zIndex = 2;
      } else {
        // Eksisterende logik for andre markører
        const markerIcon = markerTypes.find((markerType) => markerType.name === name)?.icon;
        if (!markerIcon) {
          console.error('mapService: setMarker: No icon found for marker type:', name);
          return;
        }
  
        markerContent = document.createElement('div');
        markerContent.className = 'custom-marker';
  
        const iconImg = document.createElement('img');
        iconImg.src = markerIcon;
        iconImg.alt = name;
        iconImg.style.width = `${MARKERSZ}px`;
        iconImg.style.height = `${MARKERSZ}px`;
        markerContent.appendChild(iconImg);
      }
  
      if (!title) {
        title = name;
      }
      markerContent.title = title;
  
      if (!markersMap.has(uuid)) {
        const mark = new google.maps.marker.AdvancedMarkerElement({
          position: position,
          map: mapInstance,
          gmpDraggable: true,
          content: markerContent,
          title,
          zIndex
        });
  
        // Resten af din eksisterende logik for event listeners osv.
        // ...
  
        addMarker(uuid, mark);
        console.log('mapService: markersMap after adding:');
        console.table(Array.from(markersMap.entries()));
        return mark;
      }
      console.log('mapService: markersMap (marker already exists):');
      console.table(Array.from(markersMap.entries()));
      return null;
    }
  },

  deleteMarker(uuid: string) {
    removeMarker(uuid);
  },

  getMarkers() {

    return Array.from(markersMap.values());
  }
}