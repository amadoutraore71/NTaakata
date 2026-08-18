import {
    MAP_ANIMATION_DURATION,
    MAP_PADDING,
    MAX_ZOOM,
    ROUTE_COLOR,
    ROUTE_WEIGHT,
} from "./mapConstants";

export async function drawRoute({
  map,
  passenger,
  driver,
  routeLayer,
  onRouteInfo,
}) {
  try {
    const url =
      "https://router.project-osrm.org/route/v1/driving/" +
      passenger.longitude +
      "," +
      passenger.latitude +
      ";" +
      driver.longitude +
      "," +
      driver.latitude +
      "?overview=full&geometries=geojson";

    const response = await fetch(url);

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return routeLayer;
    }

    const route = data.routes[0];

    const latLngs = route.geometry.coordinates.map(
      ([lng, lat]) => [lat, lng]
    );

    if (routeLayer) {
      map.removeLayer(routeLayer);
    }

    routeLayer = L.polyline(latLngs, {
      color: ROUTE_COLOR,
      weight: ROUTE_WEIGHT,
    }).addTo(map);

    const bounds = L.latLngBounds([
      [passenger.latitude, passenger.longitude],
      [driver.latitude, driver.longitude],
    ]);

    map.flyToBounds(bounds, {
      padding: MAP_PADDING,
      maxZoom: MAX_ZOOM,
      duration: MAP_ANIMATION_DURATION,
    });

    onRouteInfo?.({
      distance: route.distance,
      duration: route.duration,
      eta: Date.now() + route.duration * 1000,
    });

    return routeLayer;
  } catch (error) {
    console.log("OSRM :", error);
    return routeLayer;
  }
}