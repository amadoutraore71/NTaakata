export async function getRoute(startLocation, endLocation) {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/` +
      `${startLocation.longitude},${startLocation.latitude};` +
      `${endLocation.longitude},${endLocation.latitude}` +
      `?overview=full&geometries=geojson`
    );

    const data = await response.json();

    if (!data.routes?.length) {
      console.log("❌ Aucun itinéraire trouvé.");
      return [];
    }

    return data.routes[0].geometry.coordinates.map((point) => ({
      latitude: point[1],
      longitude: point[0],
    }));

  } catch (error) {
    console.log("❌ Erreur OSRM :", error);
    return [];
  }
}