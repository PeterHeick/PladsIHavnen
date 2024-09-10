import { ref } from 'vue'
import { markerTypes, Position } from '@/types'
import store from '@/store'
import { MapControlOptions, MARKERSZ, zoom } from '@/config'

type MarkerType = google.maps.marker.AdvancedMarkerElement;

class MapService {
  private mapInstance: google.maps.Map | null = null;
  private currentInfoWindow: google.maps.InfoWindow | null = null;
  private markersMap = new Map<string, MarkerType>();

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

  setMarker(uuid: string, position: Position, name: string, title?: string): MarkerType | null {
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

    const mark = new google.maps.marker.AdvancedMarkerElement({
      position,
      map: this.mapInstance,
      gmpDraggable: true,
      content: markerContent,
      title: title || name,
      zIndex
    });

    this.addMarkerListeners(mark, uuid, name);
    this.markersMap.set(uuid, mark);
    return mark;
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

  private addMarkerListeners(mark: MarkerType, uuid: string, name: string): void {
    if (name !== 'Havn') {
      mark.addListener("click", () => this.showDeleteConfirmation(mark, uuid));
    }

    mark.addListener('dragend', async (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;

      const newPosition = { lat: event.latLng.lat(), lng: event.latLng.lng() };
      if (name === 'Havn') {
        await store.dispatch('harbor/updateHarbor', { uuid, position: newPosition });
        this.centerMapOnLocation(newPosition);
      } else {
        await store.dispatch('marker/updateMarker', { uuid, position: newPosition });
      }
    });
  }

  private showDeleteConfirmation(marker: MarkerType, uuid: string): void {
    this.currentInfoWindow?.close();

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div>
          <button id="delete-yes">Slet</button>
          <button id="delete-no">Anuller</button>
        </div>
      `,
    });

    infoWindow.open(this.mapInstance, marker);
    this.currentInfoWindow = infoWindow;

    setTimeout(() => {
      document.getElementById('delete-yes')?.addEventListener('click', () => {
        this.deleteMarker(uuid);
        store.dispatch('marker/deleteMarker', uuid);
        infoWindow.close();
      });
      document.getElementById('delete-no')?.addEventListener('click', () => infoWindow.close());
    }, 100);
  }

  deleteMarker(uuid: string): void {
    const marker = this.markersMap.get(uuid);
    if (marker) {
      marker.map = null;  // This removes the marker from the map
      this.markersMap.delete(uuid);
    }
  }

  getMarkers(): MarkerType[] {
    return Array.from(this.markersMap.values());
  }
}

export const mapService = new MapService();