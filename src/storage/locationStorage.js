let currentLocation = null;

export function setCurrentLocation(location) {
  console.log("📍 setCurrentLocation :", location);
  currentLocation = location;
}

export function getCurrentLocation() {
  console.log("📍 getCurrentLocation :", currentLocation);
  return currentLocation;
}

export function clearCurrentLocation() {
  currentLocation = null;
}