import { markerTypes, MarkerWithUUID, Position } from '@/types'
import store from '@/store'
import { MapControlOptions, MARKERSZ, zoom } from '@/config'
import markerService from './markerService';

type GoogleMarkerType = google.maps.marker.AdvancedMarkerElement;

class MapService {
  private mapInstance: google.maps.Map | null = null;
  private currentInfoWindow: google.maps.InfoWindow | null = null;
  private markersMap = new Map<string, GoogleMarkerType>();

  async initMap(element: HTMLElement, options: google.maps.MapOptions): Promise<google.maps.Map> {
    try {
      const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
      await google.maps.importLibrary("marker");

      if (!element) {
        throw new Error('No map element found');
      }

      this.mapInstance = new Map(element, { ...options, ...MapControlOptions });
      return this.mapInstance;
    } catch (error) {
      console.error('Error initializing map:', error);
      throw error;
    }
  }

  centerMapOnLocation(position: Position): void {
    if (!this.mapInstance) {
      console.error('No map instance found');
      return;
    }
    this.mapInstance.setCenter(position);
    this.mapInstance.setZoom(zoom);
  }

  setMarker(uuid: string, position: Position, name: string, title?: string): GoogleMarkerType | null {
    if (!this.mapInstance) {
      console.error('No map instance found');
      return null;
    }

    if (this.markersMap.has(uuid)) {
      console.log(`Marker with UUID ${uuid} already exists.`);
      return null;
    }

    const markerContent = this.createMarkerContent(name);
    const zIndex = name === 'Grøn Markør' ? 2 : 1;

    const googleMarker = new google.maps.marker.AdvancedMarkerElement({
      position,
      map: this.mapInstance,
      gmpDraggable: true,
      content: markerContent,
      title: title || name,
      zIndex
    });
    (googleMarker as MarkerWithUUID).uuid = uuid;

    this.addMarkerListeners(googleMarker, uuid, name);
    this.markersMap.set(uuid, googleMarker);
    return googleMarker;
  }

  private createMarkerContent(name: string): HTMLElement {
    const markerContent = document.createElement('div');
    markerContent.className = 'custom-marker';

    if (name === 'Grøn Markør') {
      markerContent.classList.add('green-marker');
      markerContent.innerHTML = `
        <svg width="${MARKERSZ}" height="${MARKERSZ}" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="#00FF00" stroke="#00FF00" stroke-width="2"/>
        </svg>
      `;
    } else {
      const markerIcon = markerTypes.find(markerType => markerType.name === name)?.icon;
      if (!markerIcon) {
        console.error('No icon found for marker type:', name);
        return markerContent;
      }
      markerContent.innerHTML = `<img src="${markerIcon}" alt="${name}" style="width:${MARKERSZ}px;height:${MARKERSZ}px;">`;
    }

    return markerContent;
  }

  private addMarkerListeners(googleMarker: GoogleMarkerType, uuid: string, name: string): void {
    if (name !== 'Havn') {
      googleMarker.addListener("click", () => this.showDeleteConfirmation(googleMarker, uuid));
      googleMarker.addListener('touchstart', () => this.showDeleteConfirmation(googleMarker, uuid));
    }

    googleMarker.addListener('dragend', async (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;

      const newPosition = { lat: event.latLng.lat(), lng: event.latLng.lng() };
      if (name === 'Havn') {
        await store.dispatch('harbor/updateHarbor', { uuid, position: newPosition });
        this.centerMapOnLocation(newPosition);
      } else {
        markerService.updateMarker(uuid, newPosition);
      }
    });
  }

  private showDeleteConfirmation(googleMarker: GoogleMarkerType, uuid: string): void {
    this.currentInfoWindow?.close();

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div>
          <button id="delete-yes">Slet</button>
          <button id="delete-no">Anuller</button>
        </div>
      `,
    });

    infoWindow.open(this.mapInstance, googleMarker);
    this.currentInfoWindow = infoWindow;

    // Brug MutationObserver til at sikre, at elementerne er klar, før vi tilføjer event listenerne
    const observer = new MutationObserver(() => {
      const deleteYesButton = document.getElementById('delete-yes');
      const deleteNoButton = document.getElementById('delete-no');

      if (deleteYesButton && deleteNoButton) {
        deleteYesButton.addEventListener('click', () => {
          this.deleteMarker(uuid);
          markerService.deleteMarker(uuid)
            .then(() => infoWindow.close());
        });

        deleteNoButton.addEventListener('click', () => infoWindow.close());

        // Stop observeren, når elementerne er fundet og event listeners er tilføjet
        observer.disconnect();
      }
    });

    // Start observeren på hele dokumentet eller en specifik container
    observer.observe(document.body, { childList: true, subtree: true });

    // setTimeout(() => {
    //   document.getElementById('delete-yes')?.addEventListener('click', () => {
    //     this.deleteMarker(uuid);
    //     markerService.deleteMarker(uuid)
    //     .then(() => infoWindow.close());
    //   });
    //   document.getElementById('delete-no')?.addEventListener('click', () => infoWindow.close());
    // }, 100);
  }

  deleteMarker(uuid: string): void {
    const googleMarker = this.markersMap.get(uuid);
    if (googleMarker) {
      googleMarker.map = null;  // This removes the marker from the map
      this.markersMap.delete(uuid);
    }
  }

  getMarkers(): GoogleMarkerType[] {
    return Array.from(this.markersMap.values());
  }
}

export const mapService = new MapService();