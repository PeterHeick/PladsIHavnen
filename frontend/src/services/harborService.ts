import axios from 'axios'
import { FacilityName, Harbor, Position } from '@/types'
import { API_URL } from '@/config';
import { mapService } from './mapService';
import { ref } from 'vue';

const URL = API_URL + '/harbor/'
console.log('harborService URL:', URL);
export const currentHarbor = ref<Harbor | null>(null);

export default {

  async fetchNearestHarbor(lat: number, lng: number, radius: 20000) {
    console.log(`harborService.fetchNearestHarbor: url: ${URL}nearest-harbor, lat: ${lat} lng: ${lng} radius: ${radius}`);
    const response = await axios.get(`${URL}nearest-harbor`, {
      params: { latitude: lat, longitude: lng, radius },
      // withCredentials: true
    });
    currentHarbor.value = response.data;
    const harbor = response.data;
    console.log('harborService.fetchNearestHarbor return:', harbor.name);
    console.dir(harbor);
    return harbor;
  },

  async searchHarbor(harborName: string): Promise<Harbor | undefined> {
    console.log('harborService.searchHarbor:', harborName);
    try {
      console.log('harborService.searchHarbor: URL:', `${URL}?harbor=${harborName}`);
      const response = await axios.get(URL, {
        params: { name: harborName },
        // withCredentials: true
      });
      console.log('harborService.searchHarbor return:', response.data);
      currentHarbor.value = response.data;
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.error('harborService.searchHarbor: No harbor found for:', harborName);
        return;
      } else {
        console.error('harborService.searchHarbor Error searching for harbor:', error);
        return;
      }
    }
  },

  async getVisibleHarbors(bounds: google.maps.LatLngBounds): Promise<Harbor[] | undefined> {
    console.log('harborService.getVisibleHarbors: URL:', `${URL}visible-harbors`);
    try {

      const southWest = bounds.getSouthWest();
      const northEast = bounds.getNorthEast();
      const southWestLat = southWest.lat()
      const southWestLng = southWest.lng();
      const northEastLat = northEast.lat();
      const northEastLng = northEast.lng()

      const params = {
        params: { northEastLat, northEastLng, southWestLat, southWestLng },
        // withCredentials: true
      }
      console.log("params:");
      console.table(params);
      const response = await axios.get(`${URL}visible-harbors`, params);
      console.log('harborService.getVisibleHarbors response.data:');
      console.dir(response.data);
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.error('harborService.getVisibleHarbors: No harbors found');
        return;
      } else {
        console.error('harborService.getVisibleHarbors Error searching for harbors:', error);
        return;
      }
    }
  },

  async createHarbor(harbor: { name: string; position: { lng: number; lat: number } }): Promise<Harbor> {
    const response = await axios.post(URL, harbor, {
      // withCredentials: true
    });
    mapService.setMarker(response.data.uuid, harbor.position, 'Havn', harbor.name);
    return response.data
  },

  async setVisibleHarbors(bounds: google.maps.LatLngBounds) {
    console.log(`harborService.setVisibleHarbors:`);
    console.log('bounds:', bounds);
    const harbors = await this.getVisibleHarbors(bounds);
    if (harbors) {
      harbors.forEach((harbor) => {
        const marker = mapService.setMarker(harbor.uuid, harbor.position, 'Havn', harbor.name);
        console.log('harborService.setVisibleHarbors: marker:');
        console.dir(marker);
      });
    }
  },

  async updateHarborPosition(uuid: string, position: Position) {
    console.log(`harborService.updateHarborPosition: `, uuid, position);
    const response = await axios.put(`${URL}${uuid}/position`, {
      position
    });

    return response.data;
  },

  async updateHarborFacilities(facility: FacilityName) {
    if (!currentHarbor.value) {
      console.error('harborService.updateHarborFacilities: No current harbor');
      return;
    }

    const facilities = { [facility]: true };
    console.log(`harborService.updateHarborFacilities: `, currentHarbor.value.uuid, facilities);
    const response = await axios.put(`${URL}${currentHarbor.value.uuid}/facilities`, {
      facilities
    }, {});
    currentHarbor.value = response.data;
    return response.data;
  },

}