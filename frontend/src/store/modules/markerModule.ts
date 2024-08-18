import { ActionContext, Module } from 'vuex'
import markerService from '@/services/markerService'
import { LocationMarker, Position, RootState } from '@/types';
import indexedDBService from '@/services/indexedDBService';
import { Harbor } from '@/types';
import { getCoordinatesFromAddress } from '@/services/geoLocationService';
import { mapService } from '@/services/mapService';
import harborIcon from '@/assets/icons/harbor.png'
import { Marker } from 'google.maps';

const markersModule: Module<RootState, RootState> = {
  namespaced: true,
  state: {
    harborName: '',
    harbor: undefined,
    selectedHarbor: undefined,
    userPosition: null,
    markers: [],
    error: null
  },

  mutations: {
    ADD_MARKER(state, marker: LocationMarker) {
      state.markers.push(marker)
    },
    SET_MARKERS(state, markers: LocationMarker[]) {
      state.markers = markers
    },
    REMOVE_MARKER(state, uuid: string) {
      state.markers = state.markers.filter(marker => marker.uuid !== uuid)
    },
    // SET_NEAREST_HARBORS(state, harbors) {
    //   state.nearestHarbors = harbors;
    // },
    SET_HARBOR(state, harbor) {
      state.harbor = harbor;
    },
    SET_ERROR(state, error: string | null) {
      state.error = error
    }

  },

  actions: {

    async createHarbor({ commit, dispatch }: ActionContext<any, any>, harbor: Harbor) {
      try {
        const h = await markerService.createHarbor({ name: harbor.name, position: harbor.position });

        commit('SET_HARBOR', h);

        return harbor;
      } catch (error) {
        console.error('Error creating harbor:', error);
        throw error;
      }
    },

    async getOrCreateHarbor({ commit, dispatch }, harborName: string) {
      try {
        // Forsøg at hente havnen først
        let harbor = await markerService.searchHarbor(harborName)
        let coordinates: Position | null = null;

        if (!harbor) {
          coordinates = await getCoordinatesFromAddress(harborName)
          if (coordinates) {
            console.log('markerService.coordinates:', coordinates);

            harbor = await markerService.createHarbor({
              name: harborName,
              position: coordinates
            })
          }
        } else {
          coordinates = harbor.position;
          commit('SET_HARBOR', harbor)
        }

        if (harbor && coordinates) {
          console.log('getOrCreateHarbor harbor && coordinates', harbor, coordinates);
          commit('SET_HARBOR', harbor)

          markerService.showHarbor(harbor, coordinates)
          return harbor
        }
      } catch (error) {
        console.error('Error creating harbor and adding marker:', error)
        throw error
      }
    },


    async searchHarbor({ commit }, harborName: string) {
      console.log('markerModule.searchHarbor:', harborName);
      try {
        if (navigator.onLine) {
          console.log('markerModule.searchHarbor online:', harborName);
          const harbor = await markerService.searchHarbor(harborName);
          commit('SET_HARBOR', harbor)
          return harbor;
        } else {
          console.log('markerModule.searchHarbor offline:', harborName);
          const offlineMarker = await indexedDBService.getHarbor(harborName)
          commit('SET_HARBOR', offlineMarker)
          return offlineMarker;
        }
      } catch (error) {
        console.error('Fejl under søgning efter havn:', error);
        commit('SET_ERROR', `Fejl under søgning efter havn ${harborName}`);
        throw error;
      }
    },

    async addMarker({ commit }, { newMarker, harbor }: { newMarker: LocationMarker, harbor: Harbor }) {
      console.log(`addMarker: newMarker: ${JSON.stringify(newMarker)} harbor; ${JSON.stringify(harbor)}`);
      try {
        if (navigator.onLine) {
          const { uuid } = await markerService.addMarker(newMarker, harbor.id)
          const savedMarker = { ...newMarker, uuid }
          commit('ADD_MARKER', savedMarker)
          console.log('addMarker:', savedMarker);
          return savedMarker
          await indexedDBService.addMarker(savedMarker)
        } else {
          const offlineMarker = await indexedDBService.addMarker(newMarker)
          commit('ADD_MARKER', offlineMarker)
          return offlineMarker
        }
      } catch (error) {
        console.error('Error adding marker:', error)
        commit('SET_ERROR', `Error adding marker ${newMarker.name}`)
      }
    },

    // Den her benyttes vist ikke mere
    async fetchMarkersByHarbor({ commit }, harbor: Harbor) {
      console.log('fetchMarkersByHarbor:', harbor);
      try {
        const markers = await markerService.getMarkersByHarborID(harbor.id);
        commit('SET_MARKERS', markers);
        return markers;
      } catch (error) {
        console.error('Error fetching markers for harbor:', error);
        commit('SET_ERROR', `Error fetching markers for harbor ${harbor.id}`)
        return [];
      }
    },

    async fetchMarkersByPosition({ commit }, position: Position) {
      console.log('fetchMarkersBypostion:', position);
      try {
        const markers = await markerService.getMarkersByPosition(position);
        commit('SET_MARKERS', markers);
        return markers;
      } catch (error) {
        console.error('Error fetching markers for postion:', error);
        commit('SET_ERROR', `Error fetching markers for postion ${position}`)
        return [];
      }
    },

    // async fetchMarkers({ commit }) {
    //   console.log('fetchMarkers')
    //   try {
    //     if (navigator.onLine) {
    //       const markers = await markerService.getMarkers()
    //       console.log('fetchMarkers:', markers)
    //       commit('SET_MARKERS', markers)
    //       await indexedDBService.syncMarkers(markers)
    //     } else {
    //       const markers = await indexedDBService.getMarkers()
    //       commit('SET_MARKERS', markers)
    //     }
    //   } catch (error) {
    //     console.error('Error fetching markers:', error);
    //     commit('SET_ERROR', `Error fetching markers`)
    //     throw error
    //   }
    // },

    async fetchNearestHarbors({ commit }, { lat, lng, radius }) {
      try {
        const harbors = await markerService.fetchNearestHarbors(lat, lng, radius);
        return harbors;
      } catch (error) {
        console.error('Error fetching nearest harbors:', error);
        commit('SET_ERROR', `Error fetching nearest harbors`)
        return [];
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

    async deleteMarker({ commit, getters }, mapMarker: google.maps.Marker) {
      try {
        console.log('markerModule.deleteMarker:', mapMarker);
        const lat = mapMarker.getPosition()?.lat();
        const lng = mapMarker.getPosition()?.lng();

        if (lat !== undefined && lng !== undefined) {
          const uuid = getters.getUuidByLatLng(lat, lng);

          if (uuid) {
            if (navigator.onLine) {
              await markerService.deleteMarker(uuid)
              commit('REMOVE_MARKER', uuid)
              await indexedDBService.deleteMarker(uuid)
            } else {
              // Hvis offline, marker til sletning i IndexedDB og fjern fra state
              await indexedDBService.markForDeletion(uuid)
              commit('REMOVE_MARKER', uuid)
            }
          } else {
            console.error('No marker found with the specified coordinates.');
            commit('SET_ERROR', 'No marker found with the specified coordinates.')
          }
        } else {
          console.error('Marker position is undefined.');
          commit('SET_ERROR', 'Marker position is undefined.')
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
      const marker = state.markers.find(m => m.position.lat === lat && m.position.lng === lng);
      return marker ? marker.uuid : null;
    },
    currentHarbor: (state) => state.harbor,
    markerCount: (state) => state.markers.length,
    error: (state) => state.error
  }
}

export default markersModule