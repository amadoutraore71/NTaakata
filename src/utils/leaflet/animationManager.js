export function animationManager() {

return `

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

`;

}