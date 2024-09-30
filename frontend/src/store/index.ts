import { createStore, Store } from 'vuex';
import { RootState, State, Position } from '@/types';
// import markerModule from './modules/markerModule';
import harborModule from './modules/harborModule';
// import mapModule from './modules/mapModule';

const store = createStore({
  state: {
    globalError: null,
    userPosition: null,
  } as RootState,
  mutations: {
    SET_GLOBAL_ERROR(state, error: string | null) {
      state.globalError = error;
    },
    SET_USER_POSITION(state, position: Position | null) {
      state.userPosition = position;
    },
  },
  actions: {
    // Globale actions...
  },
  getters: {
    // Globale getters...
  },
  modules: {
    // marker: markerModule,
    harbor: harborModule,
    // map: mapModule
  }
}) as Store<State>;

export default store;
