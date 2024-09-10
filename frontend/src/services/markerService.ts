import axios from 'axios'
import { LocationMarker, Position } from '@/types'
import { API_URL } from '@/config';
import { mapService } from './mapService';
import harborService from './harborService';

const URL = API_URL + '/marker/'

export default {

  async getVisibleMarkers(bounds: google.maps.LatLngBounds): Promise<LocationMarker[] | undefined> {
    console.log('markerService.getVisibleMarkers:');
    try {
      console.log('markerService.getVisibleMarkers: URL:', `${URL}visible-markers`);

      const southWest = bounds.getSouthWest();
      const northEast = bounds.getNorthEast();
      const southWestLat = southWest.lat()
      const southWestLng = southWest.lng();
      const northEastLat = northEast.lat();
      const northEastLng = northEast.lng()

      const response = await axios.get(`${URL}visible-markers`, {
        params: { northEastLat, northEastLng, southWestLat, southWestLng },
        // withCredentials: true
      });
      console.table(response.data);
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.error('markerService.getVisibleMarkers: No markers found');
        return;
      } else {
        console.error('markerService.getVisibleMarkers Error searching for markers:', error);
        return;
      }
    }
  },

  async setVisibleMarkers(bounds: google.maps.LatLngBounds) {
    console.log(`harborService.setVisibleHarbors:`);
    console.log('bounds:', bounds);
    const markers = await this.getVisibleMarkers(bounds);
    if (markers) {
      markers.forEach((marker) => {
        this.showMark(marker);
      });
    }
  },

  showMark(marker: LocationMarker) {
    console.log(`markerService.showMark: marker: `, marker.name);
    const mark = mapService.setMarker(marker.uuid, marker.position, marker.name)
    return mark
  },

  async addMarker(marker: LocationMarker): Promise<LocationMarker> {
    console.log(`markerService.addMarker: `, marker);
    const response = await axios.post(URL, marker, {
      // withCredentials: true
    });
    harborService.updateHarborFacilities(marker.name);
    return response.data
  },

  async updateMarker(uuid: string, position: Position): Promise<LocationMarker> {
    console.log(`markerService.updateMarker: `, uuid, position);
    const response = await axios.put(`${URL}${uuid}/position`, {
      position
    });

    return response.data
  },

  // Sletter markøren i databasen
  async deleteMarker(uuid: string): Promise<void> {
    console.log(`markerService.deleteMarker: `, uuid);
    try {
      const response = await axios.delete(`${URL}${uuid}`, {
        // withCredentials: true
      });
      console.log('Marker deleted:', response.data);
      return response.data; // Returner den slettede marker eller anden nødvendig information
    } catch (error) {
      console.error('Error deleting marker:', error);
      throw error;
    }
  },
}