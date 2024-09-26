import axios, { AxiosError } from 'axios'
import { FacilityName, GoogleMarkerType, Harbor, MarkerWithUUID, Position } from '@/types'
import { API_URL } from '@/config'
import { mapService } from './mapService'
import { ref } from 'vue'

const URL = `${API_URL}/harbor/`
export const currentHarbor = ref<Harbor | null>(null)

class HarborService {
  activeHarbor: GoogleMarkerType | null = null;
  async fetchNearestHarbor(lat: number, lng: number, radius = 20000): Promise<Harbor> {
    try {
      const response = await axios.get(`${URL}nearest-harbor`, {
        params: { latitude: lat, longitude: lng, radius }
      })
      currentHarbor.value = response.data
      return response.data
    } catch (error) {
      this.handleError(error, 'fetchNearestHarbor')
      throw error
    }
  }

  async searchHarbor(harborName: string): Promise<Harbor | undefined> {
    try {
      const response = await axios.get(URL, { params: { name: harborName } })
      currentHarbor.value = response.data
      return response.data
    } catch (error) {
      return this.handleError(error, 'searchHarbor')
    }
  }

  async getVisibleHarbors(bounds: google.maps.LatLngBounds): Promise<Harbor[] | undefined> {
    try {
      const { south: southWestLat, west: southWestLng, north: northEastLat, east: northEastLng } = bounds.toJSON()
      const response = await axios.get(`${URL}visible-harbors`, {
        params: { northEastLat, northEastLng, southWestLat, southWestLng }
      })
      return response.data
    } catch (error) {
      return this.handleError(error, 'getVisibleHarbors')
    }
  }

  async createHarbor(harbor: { name: string; position: Position }): Promise<Harbor> {
    try {
      const response = await axios.post(URL, harbor)
      mapService.setMarker(response.data.uuid, harbor.position, 'Havn', harbor.name)
      return response.data
    } catch (error) {
      this.handleError(error, 'createHarbor')
      throw error
    }
  }

  async deleteHarbor(): Promise<void> {
    if (!this.activeHarbor) {
      return
    }
    const uuid = (this.activeHarbor as MarkerWithUUID).uuid;
    if (uuid) {
      try {
        await axios.delete(`${URL}/${uuid}`);
        mapService.deleteMarker(uuid);
      } catch (error) {
        this.handleError(error, 'deleteHarbor');
        throw error;
      }
    }
  }

  async setVisibleHarbors(bounds: google.maps.LatLngBounds): Promise<void> {
    const harbors = await this.getVisibleHarbors(bounds)
    harbors?.forEach(harbor => {
      const googleMarker = mapService.setMarker(harbor.uuid, harbor.position, 'Havn', harbor.name)
      googleMarker?.addListener('click', () => {
        this.toggleActiveHarbor(harbor.name, googleMarker)
      })
    })
  }

  toggleActiveHarbor = (harborName: string, googleMarker: GoogleMarkerType) => {
    console.log('toggleActiveHarbor', harborName)
    if (this.activeHarbor === googleMarker) {
      this.activeHarbor = null;  // Fjern aktiv status, hvis det allerede er aktivt
    } else {
      this.activeHarbor = googleMarker;  // Gør det klikbare ikon aktivt
    }
  }

  async updateHarborPosition(uuid: string, position: Position): Promise<Harbor> {
    try {
      const response = await axios.put(`${URL}${uuid}/position`, { position })
      return response.data
    } catch (error) {
      this.handleError(error, 'updateHarborPosition')
      throw error
    }
  }

  async updateHarborFacilities(facility: FacilityName, add: boolean): Promise<Harbor | undefined> {
    if (!currentHarbor.value) {
      console.error('No current harbor')
      return
    }

    try {
      const facilities = { [facility]: add }
      const response = await axios.put(`${URL}${currentHarbor.value.uuid}/facilities`, { facilities })
      currentHarbor.value = response.data
      return response.data
    } catch (error) {
      this.handleError(error, 'updateHarborFacilities')
      throw error
    }
  }

  private handleError(error: unknown, methodName: string): undefined {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError
      if (axiosError.response?.status === 404) {
        console.error(`harborService.${methodName}: Resource not found`)
      } else {
        console.error(`harborService.${methodName} Error:`, axiosError.message)
      }
    } else {
      console.error(`harborService.${methodName} Unexpected error:`, error)
    }
    return undefined
  }
}

export default new HarborService()