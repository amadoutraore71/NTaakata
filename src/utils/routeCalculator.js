
export async function calculateRoute(start, end) {
  try {
    if (
      !start ||
      !end ||
      typeof start.latitude !== "number" ||
      typeof start.longitude !== "number" ||
      typeof end.latitude !== "number" ||
      typeof end.longitude !== "number"
    ) {
      console.log("Coordonnées invalides :", { start, end });
      return null;
    }

    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${start.longitude},${start.latitude};` +
      `${end.longitude},${end.latitude}` +
      `?overview=false`;

    const response = await fetch(url);

    if (!response.ok) {
      console.log("Erreur serveur OSRM :", response.status);
      return null;
    }

    const data = await response.json();

    if (
      data.code !== "Ok" ||
      !Array.isArray(data.routes) ||
      data.routes.length === 0
    ) {
      console.log("Aucun itinéraire trouvé :", data.code);
      return null;
    }

    return {
      distance: data.routes[0].distance / 1000,
      duration: data.routes[0].duration / 60,
    };
  } catch (error) {
    console.log("Erreur calcul itinéraire :", error);
    return null;
  }
}
