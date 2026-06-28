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
      icon: driverIcon
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

  markers[driver.id] = marker;

}

  function animateMarker(marker, latitude, longitude) {

  if (!marker) return;

  const markerId = marker._leaflet_id;

  // Arrête une éventuelle animation déjà en cours
  if (animations[markerId]) {
    clearInterval(animations[markerId]);
    delete animations[markerId];
  }

  const start = marker.getLatLng();

  const startLat = start.lat;
  const startLng = start.lng;

  const endLat = latitude;
  const endLng = longitude;

  const duration = 1000; // 1 seconde

  const fps = 60;

  const totalFrames = Math.round((duration / 1000) * fps);

  let currentFrame = 0;

  animations[markerId] = setInterval(() => {

    currentFrame++;

    const progress = currentFrame / totalFrames;

    const lat =
      startLat +
      (endLat - startLat) * progress;

    const lng =
      startLng +
      (endLng - startLng) * progress;

    marker.setLatLng([lat, lng]);

    if (currentFrame >= totalFrames) {

      marker.setLatLng([
        endLat,
        endLng
      ]);

      clearInterval(animations[markerId]);

      delete animations[markerId];

    }

  }, 1000 / fps);

}
 function removeMarker(id) {

  if (markers[id]) {

    if (animations[markers[id]._leaflet_id]) {

      clearInterval(
        animations[markers[id]._leaflet_id]
      );

      delete animations[
        markers[id]._leaflet_id
      ];

    }

    map.removeLayer(markers[id]);

    delete markers[id];

  }

}function updateDrivers(drivers) {

   if (!Array.isArray(drivers)) return;

  console.log(
    "updateDrivers",
    drivers.length
  );

  const activeIds = [];

  drivers.forEach(driver => {

    activeIds.push(driver.id);

    if (markers[driver.id]) {

      const marker = markers[driver.id];

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
 window.ReactNativeWebView.postMessage("READY");

</script>

</body>

</html>

`;

}