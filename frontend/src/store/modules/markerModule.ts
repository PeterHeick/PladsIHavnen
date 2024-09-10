import { ActionContext, Module } from 'vuex'
import markerService from '@/services/markerService'
import { LocationMarker, MarkerState, Position, RootState } from '@/types';
import indexedDBService from '@/services/indexedDBService';

const markersModule: Module<MarkerState, RootState> = {
  namespaced: true,
  state: {
    markers: {} as { [key: string]: LocationMarker },
    visibleMarkerIds: [],
    error: null
  },

  mutations: {
    ADD_MARKER(state, marker: LocationMarker) {
      if (marker?.uuid) {
        state.markers[marker.uuid] = marker;
        if (!state.visibleMarkerIds.includes(marker.uuid)) {
          state.visibleMarkerIds.push(marker.uuid);
        }
      }
    },
    UPDATE_MARKERS(state, markers: LocationMarker[]) {
      markers.forEach(marker => {
        if (marker.uuid) {
          state.markers[marker.uuid] = marker;
        }
      });
    },
    SET_VISIBLE_MARKERS(state, markerIds: string[]) {
      state.visibleMarkerIds = markerIds;
    },
    REMOVE_MARKER(state, uuid: string) {
      if (uuid in state.markers) {
        delete state.markers[uuid];
        state.visibleMarkerIds = state.visibleMarkerIds.filter(id => id !== uuid);
      }
    },
    SET_ERROR(state, error: string | null) {
      state.error = error
    }

  },

  actions: {

    async addMarker({ commit }, { newMarker }: { newMarker: LocationMarker }) {
      console.log(`addMarker: newMarker:`);
      console.dir(newMarker);
      try {
        if (navigator.onLine) {
          const marker = await markerService.addMarker(newMarker)
          commit('ADD_MARKER', marker)
          console.log('addMarker:', marker);
          // await indexedDBService.addMarker(marker)
          return marker
        } else {
          // const offlineMarker = await indexedDBService.addMarker(newMarker)
          // commit('ADD_MARKER', offlineMarker)
          // return offlineMarker
        }
      } catch (error) {
        console.error('Error adding marker:', error)
        commit('SET_ERROR', `Error adding marker ${newMarker.name}`)
      }
    },

    async updateMarker({ commit, dispatch }: ActionContext<any, any>, { uuid, position }) {
      console.log(`updateMarker:`, uuid);
      try {
        console.log('updateMarker:', uuid, position);
        const marker = await markerService.updateMarker(uuid, position);
        commit('ADD_MARKER', marker)
        console.log('updateMarker:', marker);
        // await indexedDBService.addMarker(marker)
        return marker
      } catch (error) {
        console.error('Error updating marker:', error)
        commit('SET_ERROR', `Error updating marker ${uuid}`)
      }
    },

    async syncOfflineMarkers({ dispatch, state }) {
      if (navigator.onLine) {
        const offlineMarkers = await indexedDBService.getMarkers()
        for (const marker of offlineMarkers) {
          if (!marker.uuid) {
            await dispatch('addMarker', marker)
          }
        }
      }
    },

    async deleteMarker({ commit, getters }, uuid: string) {
      try {
        console.log('markerModule.deleteMarker:', uuid);

        if (navigator.onLine) {
          await markerService.deleteMarker(uuid)
          commit('REMOVE_MARKER', uuid)
          // await indexedDBService.deleteMarker(uuid)
        } else {
          // Hvis offline, marker til sletning i IndexedDB og fjern fra state
          // await indexedDBService.markForDeletion(uuid)
          commit('REMOVE_MARKER', uuid)
        }
      } catch (error) {
        console.error('Error deleting marker:', error)
        commit('SET_ERROR', 'Error deleting marker.')
      }
    }
  },

  getters: {
    allMarkers: (state) => state.markers,

    getUuidByLatLng: (state) => (lat: number, lng: number) => {
      const marker = Object.values(state.markers).find(
        m => m.position.lat === lat && m.position.lng === lng
      );
      return marker ? marker.uuid : null;
    },

    markerCount: (state) => state.markers.length,
    error: (state) => state.error
  }
}

export default markersModule