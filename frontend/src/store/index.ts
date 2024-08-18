import { createStore } from "vuex";
import markersModule from "./modules/markerModule";
import { Harbor, Position, LocationMarker, RootState } from "@/types";
import mapModule from "./modules/mapModule";

export default createStore<RootState>({
  state: {
    harborName: '',
    harbor: undefined,
    selectedHarbor: undefined,
    userPosition: null,
    markers: [],
    error: null
  },
    // harbors: [],

  getters: {
    // nearbyHarbors: (state) => {
    //   // Returner harbors sorteret efter afstand til bruger
    //   return state.harbors;
    // },
    allMarkers: (state) => {
      return state.markers;
    }
  },
  mutations: {
    // setHarbor(state, harbor) {
    //   state.harbor = harbor;
    // },
    // // setHarbors(state, harbors) {
    // //   state.harbors = harbors;
    // // },
    // selectHarbor(state, harbor) {
    //   state.selectedHarbor = harbor;
    // },
    // setUserPosition(state, position) {
    //   state.userPosition = position;
    // },
  },
  actions: {
  },
  modules: {
    markers: markersModule,
    map: mapModule
  },
});
