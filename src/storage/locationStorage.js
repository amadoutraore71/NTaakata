let currentLocation = null;

export function setCurrentLocation(location) {
  const coords = location?.coords ?? location;

  const latitude = Number(coords?.latitude);
  const longitude = Number(coords?.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    console.log("❌ Position GPS invalide :", location);
    return false;
  }

  // Conserver le format Expo Location si celui-ci est fourni.
  currentLocation = location?.coords
    ? location
    : {
        coords: {
          latitude,
          longitude,
        },
      };

  console.log("📍 Position GPS enregistrée :", {
    latitude,
    longitude,
  });

  return true;
}

export function getCurrentLocation() {
  console.log("📍 getCurrentLocation :", currentLocation);
  return currentLocation;
}

export function clearCurrentLocation() {
  currentLocation = null;
  console.log("🧹 Position GPS effacée");
}