export function routeManager() {

return `

async function drawRoute(startLat, startLng, endLat, endLng) {

  try {

    const url =
      "https://router.project-osrm.org/route/v1/driving/" +
      startLng +
      "," +
      startLat +
      ";" +
      endLng +
      "," +
      endLat +
      "?overview=full&geometries=geojson";

    const response = await fetch(url);

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return;
    }

    const route = data.routes[0];

    const distance = route.distance;

    const duration = route.duration;

    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: "route_info",
        distance,
        duration
      })
    );

    const coordinates = route.geometry.coordinates;

    const latLngs = coordinates.map(point => [
      point[1],
      point[0]
    ]);

    if (routeLayer) {

      map.removeLayer(routeLayer);

    }

    routeLayer = L.polyline(
      latLngs,
      {
        color: "#0B6E4F",
        weight: 6,
        opacity: 0.9
      }
    ).addTo(map);

  } catch (error) {

    console.log(error);

  }

}

`;

}