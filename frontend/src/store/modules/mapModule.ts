import { Module } from 'vuex'
import { mapService } from '@/services/mapService'
import { Position, RootState } from '@/types'

interface MapState {
  isInitialized: boolean
}

const mapModule: Module<MapState, RootState> = {
  namespaced: true,
  state: {
    isInitialized: false
  },
  mutations: {
    SET_INITIALIZED(state, value: boolean) {
      state.isInitialized = value
    }
  },
  actions: {
    async initializeMap({ commit }, { element, options }) {
      console.log('mapModule: Initializing map...');
      try {
        const map = await mapService.initMap(element, options)
        console.log('mapModule: Map initialized', map);
        commit('SET_INITIALIZED', true)
        return map
      } catch (error) {
        console.error('mapModule: Error initializing map:', error);
        throw error;
      }
    }
  },
  getters: {
    isMapInitialized: (state) => {
      console.log('mapModule: Checking if map is initialized', state.isInitialized);
      return state.isInitialized
    },
    getMap: () => {
      const map = mapService.getMap();
      console.log('mapModule: Getting map instance', map);
      return map;
    }
  }
}

export default mapModule