import axios, { AxiosError } from 'axios'
import { LocationMarker, Position } from '@/types'
import { API_URL } from '@/config'
import { mapService } from './mapService'
import harborService from './harborService'

const URL = `${API_URL}/marker/`

class MarkerService {
  async getVisibleMarkers(bounds: google.maps.LatLngBounds): Promise<LocationMarker[] | undefined> {
    try {
      const { south, west, north, east } = bounds.toJSON();
      const response = await axios.get(`${URL}visible-markers`, {
        params: { 
          northEastLat: north, 
          northEastLng: east, 
          southWestLat: south, 
          southWestLng: west 
        }
      });
      return response.data;
    } catch (error) {
      this.handleError(error, 'getVisibleMarkers');
    }
  }

  async setVisibleMarkers(bounds: google.maps.LatLngBounds): Promise<void> {
    const markers = await this.getVisibleMarkers(bounds);
    markers?.forEach(this.showMark);
  }

  showMark(marker: LocationMarker): google.maps.marker.AdvancedMarkerElement | null {
    return mapService.setMarker(marker.uuid, marker.position, marker.name);
  }

  async addMarker(marker: LocationMarker): Promise<LocationMarker> {
    try {
      const response = await axios.post(URL, marker);
      await harborService.updateHarborFacilities(marker.name);
      return response.data;
    } catch (error) {
      this.handleError(error, 'addMarker');
      throw error;
    }
  }

  async updateMarker(uuid: string, position: Position): Promise<LocationMarker> {
    try {
      const response = await axios.put(`${URL}${uuid}/position`, { position });
      return response.data;
    } catch (error) {
      this.handleError(error, 'updateMarker');
      throw error;
    }
  }

  async deleteMarker(uuid: string): Promise<void> {
    try {
      await axios.delete(`${URL}${uuid}`);
    } catch (error) {
      this.handleError(error, 'deleteMarker');
      throw error;
    }
  }

  private handleError(error: unknown, methodName: string): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        console.error(`markerService.${methodName}: Resource not found`);
      } else {
        console.error(`markerService.${methodName} Error:`, axiosError.message);
      }
    } else {
      console.error(`markerService.${methodName} Unexpected error:`, error);
    }
  }
}

export default new MarkerService();