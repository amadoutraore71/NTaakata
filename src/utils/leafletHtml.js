import { animationManager } from "./leaflet/animationManager";
import { mapTemplate } from "./leaflet/mapTemplate";
import { markerManager } from "./leaflet/markerManager";
import { messageHandler } from "./leaflet/messageHandler";
import { routeManager } from "./leaflet/routeManager";

export default function generateLeafletHtml(
  currentLocation,
  icons
) {

return `
${mapTemplate(currentLocation, icons)}
${markerManager(currentLocation)}
${animationManager()}
${routeManager()}

  function removeMarker(id) {

  if (!markers[id]) return;

  if (animations[markers[id]._leaflet_id]) {

    cancelAnimationFrame(
      animations[markers[id]._leaflet_id]
    );

    delete animations[
      markers[id]._leaflet_id
    ];

  }

  map.removeLayer(markers[id]);

  delete markers[id];

}
function updateDrivers(drivers) {
  
   if (!Array.isArray(drivers)) return;

  const activeIds = [];

  drivers.forEach(driver => {

    activeIds.push(driver.userId);

    if (markers[driver.userId]) {

      const marker = markers[driver.userId];

      const current = marker.getLatLng();

      const moved =
        Math.abs(current.lat - driver.latitude) > 0.000001 ||
        Math.abs(current.lng - driver.longitude) > 0.000001;

      if (moved) {

        animateMarker(
          marker,
          driver.latitude,
          driver.longitude
        );
if (
  selectedDriver &&
  selectedDriver.userId === driver.userId
) {

  selectedDriver = driver;

  drawRoute(
    ${currentLocation.latitude},
    ${currentLocation.longitude},
    driver.latitude,
    driver.longitude
  );

}
      }

    } else {

      createMarker(driver);

    }

  });

  Object.keys(markers).forEach(id => {

    if (!activeIds.includes(id)) {

      removeMarker(id);

    }

  });

}

${messageHandler()}
</script>

</body>

</html>

`;

}