const state = {
  map: null,

  markers: {},

  animations: {},

  movingMarkers: {},

  routeAnimations: {},

  selectedDriver: null,

  selectedMarker: null,

  routeLayer: null,

  currentRoute: null,

  lastRoutePosition: null,

  firstRoute: true,

  followDriver: true,

  lastCameraUpdate: 0,

  CAMERA_OFFSET: 0.0012,
};

export default state;