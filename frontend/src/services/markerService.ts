import axios from 'axios'
import { Harbor, LocationMarker, Position } from '@/types'
// import { API_URL } from '@/config';
import { mapService } from './mapService';
import harborIcon from '@/assets/icons/anchor.png'
// import { getCoordinatesFromAddress } from './geoLocationService'
// import indexedDBService from './indexedDBService'

// import { mapService } from './mapService'
const API_URL = 'https://unisoft.dk:3003/api'

export default {

// Den her benyytes vist ikke
  async getMarkersByHarborID(harborID: number): Promise<LocationMarker[]> {
    console.log(`harborID: ${harborID}`);
    console.log('markerService.getMarkersByHarborID: URL:', `/api/markers?harbor=${harborID}`);
    try {
      if (!harborID) {
        console.error('No harbor id provided');
        return [];
      }
      // await this.search(harborID);
      const response = await axios.get(`${API_URL}/markers`, {
        params: { harborID: harborID },
        withCredentials: true
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.error('No markers found for harbor:', harborID);
      } else {
        console.error('Error searching for harbor:', error);
      }
      console.error('Error fetching markers for harbor:', error);
      return [];
    }
  },

  async getMarkersByPosition(position: Position): Promise<LocationMarker[]> {
    console.log(`await axios.get(${API_URL}/nearest-markers, { params: { latitude: ${position.lat}, longitude: ${position.lng}, radius: 5000 }, withCredentials: true }`);
    try {
      if (!position) {
        console.error('No position provided');
        return [];
      }
      // await this.search(harborID);
      const response = await axios.get(`${API_URL}/nearest-markers`, {
        params: { latitude: position.lat, longitude: position.lng, radius: 5000 },
        withCredentials: true
      });

      console.log('markerService.getMarkersByPosition: response:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.error('No markers found for position:', position);
      } else {
        console.error('Error searching for position:', error);
      }
      console.error('Error fetching markers for position:', error);
      return [];
    }
  },

  async fetchNearestHarbors(lat: number, lng: number, radius: 20000) {
    console.log(`markerService.fetchNearestHarbors: url: ${API_URL}, lat: ${lat} lng: ${lng} radius: ${radius}`);
    const response = await axios.get(`${API_URL}/nearest-harbors`, {
      params: { latitude: lat, longitude: lng, radius },
      withCredentials: true
    });
    return response.data;
  },

  async addMarker(marker: LocationMarker, harborID: number): Promise<LocationMarker> {
    console.log(`markerService.addMarker: `, marker, ' harborID:', harborID);
    const response = await axios.post(`${API_URL}/markers`, { ...marker, harborID: harborID }, { withCredentials: true });

    return response.data
  },

  async deleteMarker(uuid: string): Promise<void> {
    console.log(`markerService.deleteMarker: `, uuid);
    try {
      const response = await axios.delete(`${API_URL}/markers/${uuid}`, { withCredentials: true });
      console.log('Marker deleted:', response.data);
      return response.data; // Returner den slettede marker eller anden nødvendig information
    } catch (error) {
      console.error('Error deleting marker:', error);
      throw error;
    }
  },

  async searchHarbor(harborName: string): Promise<Harbor | undefined> {
    console.log('markerService.searchHarbor:', harborName);
    try {
      console.log('markerService.searchHarbor: URL:', `${API_URL}/harbors?harbor=${harborName}`);
      const response = await axios.get(`${API_URL}/harbor`, {
        params: { name: harborName },
        withCredentials: true
      });
      console.log('markerService.searchHarbor return:', response.data);
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.error('markerService.searchHarbor: No harbor found for:', harborName);
        return;
      } else {
        console.error('markerService.searchHarbor Error searching for harbor:', error);
        return;
      }
    }
  },

  async createHarbor(harbor: { name: string; position: { lng: number; lat: number } }): Promise<Harbor> {
    const body = harbor;
    const response = await axios.post(`${API_URL}/harbors`, body, { withCredentials: true });
    return response.data
  },


  showHarbor(harbor: Harbor, position: Position) {
    console.log(`markerService.showHarbor: harbor: ${JSON.stringify(harbor)} position: ${JSON.stringify(position)}`);
    mapService.centerMapOnLocation(position);
    const mark = mapService.setMarker(position, harborIcon, 'Harbor')
    if (mark) {
      google.maps.event.addListener(mark, 'dragend', async (event: any) => {
        const newPosition = {
          lat: event.latLng?.lat(),
          lng: event.latLng?.lng()
        };

        console.log(`Harbor marker dragged to new position:`, newPosition);

        try {
          mapService.centerMapOnLocation(newPosition);
          mapService.updateHarborPosition(harbor.name, newPosition);
        } catch (error) {
          console.error('Error updating harbor position:', error);
        }
      });
      console.log(`showHarbor: mark: ${JSON.stringify(position)} harbor: ${JSON.stringify(harbor)}`);

    }
  }
}