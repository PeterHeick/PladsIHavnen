import { ActionContext, Module } from 'vuex';
import { HarborState, RootState, Harbor, Position } from '@/types';
import { getCoordinatesFromAddress } from '@/services/geoLocationService';
import harborService from '@/services/harborService';
// import indexedDBService from '@/services/indexedDBService';

const harborModule: Module<HarborState, RootState> = {
  namespaced: true,
  state: {
    harborName: '',
    harbor: undefined,
    selectedHarbor: undefined
  },
  mutations: {
    SET_HARBOR_NAME(state, name: string) {
      state.harborName = name;
    },
    SET_HARBOR(state, harbor: Harbor) {
      state.harbor = harbor;
    },
    SET_SELECTED_HARBOR(state, harbor: Harbor) {
      state.selectedHarbor = harbor;
    }
  },
  actions: {
    async createHarbor({ commit, dispatch }: ActionContext<any, any>, harbor: Harbor) {
      try {
        const h = await harborService.createHarbor({ name: harbor.name, position: harbor.position });

        commit('SET_HARBOR', h);

        return h;
      } catch (error) {
        console.error('Error creating harbor:', error);
        throw error;
      }
    },

    async updateHarbor({ commit, dispatch }: ActionContext<any, any>, {uuid, position}) {
      try {
        console.log('updateHarbor:', uuid, position);
        const harbor = await harborService.updateHarborPosition(uuid, position);

        commit('SET_HARBOR', harbor);

        return harbor;
      } catch (error) {
        console.error('Error updating harbor:', error);
        throw error;
      }
    },

    async searchHarbor({ commit, dispatch }, harborName: string) {
      try {
        // Forsøg at hente havnen først
        console.info('searchHarbor:', harborName);
        let harbor = await harborService.searchHarbor(harborName)
        let coordinates: Position | null = null;

        if (!harbor) {
          coordinates = await getCoordinatesFromAddress(harborName)
          if (coordinates) {
            console.log('harborService.coordinates:', coordinates);

            harbor = await harborService.createHarbor({
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

          return harbor
        }
      } catch (error) {
        console.error('Error creating harbor and adding marker:', error)
        throw error
      }
    },

    async fetchNearestHarbor({ commit }, { lat, lng, radius }) {
      try {
        const harbor = await harborService.fetchNearestHarbor(lat, lng, radius);
        return harbor;
      } catch (error) {
        console.error('Error fetching nearest harbor:', error);
        commit('SET_ERROR', `Error fetching nearest harbor`)
        return;
      }
    },
  },
  getters: {
    // ... dine harbor-relaterede getters
  }
};

export default harborModule;
