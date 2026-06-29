export default function generateLeafletHtml(
  currentLocation,
  icons
) {

  return `
<!DOCTYPE html>

<html>

<head>

<meta charset="utf-8"/>

<meta
name="viewport"
content="width=device-width, initial-scale=1.0"/>

<link
rel="stylesheet"
href="https://unpkg.com/leaflet/dist/leaflet.css"/>

<style>

html,
body,
#map{

width:100%;
height:100%;
margin:0;
padding:0;

}

</style>

</head>

<body>

<div id="map"></div>

<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet-rotatedmarker@0.2.0/leaflet.rotatedMarker.js"></script>
<script>

const map = L.map("map").setView(
[
${currentLocation.latitude},
${currentLocation.longitude}
],
15
);

L.tileLayer(
"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
{
maxZoom:19
}
).addTo(map);

const markers = {};
const animations = {};

let selectedDriver = null;
let routeLayer = null;


const passengerIcon = L.icon({

  iconUrl: "${icons.passenger}",

  iconSize: [42, 42],

  iconAnchor: [21, 42],

  popupAnchor: [0, -35]

});

L.marker(
[
${currentLocation.latitude},
${currentLocation.longitude}
],
{
  icon: passengerIcon
}
  
)

.addTo(map)
.bindPopup("📍 Vous êtes ici")
.openPopup();
function createMarker(driver) {

  const iconUrl =
    driver.vehicleType === "moto"
      ? driver.iconMoto
      : driver.iconCar;

  const driverIcon = L.icon({

    iconUrl: iconUrl,

    iconSize: [40, 40],

    iconAnchor: [20, 40],

    popupAnchor: [0, -35]

  });
const marker = L.marker(
  [
    driver.latitude,
    driver.longitude
  ],
  {
    icon: driverIcon,
    rotationAngle: 0,
    rotationOrigin: "center center"
  }
);

  marker
    .addTo(map)
    .bindPopup(
      "<b>" + driver.name + "</b><br>" +
      (driver.vehicleType === "moto"
        ? "🏍️ Moto"
        : "🚗 Voiture") +
      "<br>⭐ " +
      (driver.averageRating || 0) +
      "/5"
    );
marker.on("click", function () {

  selectedDriver = driver;
  console.log("Clic sur :", driver.name);
console.log("Clic sur :", driver.name);

console.log("drawRoute appelée");

drawRoute(
  ${currentLocation.latitude},
  ${currentLocation.longitude},
  driver.latitude,
  driver.longitude
);
  window.ReactNativeWebView.postMessage(
    JSON.stringify({
      type: "driver_selected",
      driver: driver
    })
  );

});
  markers[driver.userId] = marker;

}

  function animateMarker(marker, latitude, longitude) {

  if (!marker) return;

  const markerId = marker._leaflet_id;

  // Annule une animation en cours
  if (animations[markerId]) {
    cancelAnimationFrame(animations[markerId]);
    delete animations[markerId];
  }

  const start = marker.getLatLng();

  const startLat = start.lat;
  const startLng = start.lng;

  const endLat = latitude;
  const endLng = longitude;
const bearing = getBearing(
  startLat,
  startLng,
  endLat,
  endLng
);
  const duration = 1000; // 1 seconde

  const startTime = performance.now();

  function animate(currentTime) {

    const elapsed = currentTime - startTime;

    const progress = Math.min(elapsed / duration, 1);

    const lat =
      startLat +
      (endLat - startLat) * progress;

    const lng =
      startLng +
      (endLng - startLng) * progress;

    marker.setLatLng([lat, lng]);
    marker.setRotationAngle(bearing);


    if (progress < 1) {

      animations[markerId] =
        requestAnimationFrame(animate);

    } else {

      marker.setLatLng([
        endLat,
        endLng
      ]);
      marker.setRotationAngle(bearing);
      delete animations[markerId];
      

    }

  }

  animations[markerId] =
    requestAnimationFrame(animate);

}
 
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
    if (!data.routes.length) return;

    const coordinates =
      data.routes[0].geometry.coordinates;

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
    
  function getBearing(lat1, lng1, lat2, lng2) {

  const dLon = (lng2 - lng1) * Math.PI / 180;

  const y =
    Math.sin(dLon) *
    Math.cos(lat2 * Math.PI / 180);

  const x =
    Math.cos(lat1 * Math.PI / 180) *
    Math.sin(lat2 * Math.PI / 180) -
    Math.sin(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.cos(dLon);

  let bearing =
    Math.atan2(y, x) * 180 / Math.PI;

  bearing = (bearing + 360) % 360;

  return bearing;

}
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

  window.addEventListener("message", function(event) {
console.log("Message reçu (window)");
  try {

    const drivers = JSON.parse(event.data);

    updateDrivers(drivers);

  } catch (error) {

    console.log(error);

  }

});

document.addEventListener("message", function(event) {

  try {

    const drivers = JSON.parse(event.data);

    updateDrivers(drivers);

  } catch (error) {

    console.log(error);

  }

});
window.onerror = function(message, source, line, column, error) {
  window.ReactNativeWebView.postMessage(
    JSON.stringify({
      type: "error",
      message,
      line
    })
  );
};
 window.ReactNativeWebView.postMessage("Leaflet prêt");

</script>

</body>

</html>

`;

}