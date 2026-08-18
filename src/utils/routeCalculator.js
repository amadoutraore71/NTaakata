export async function calculateRoute(
  start,
  end
) {
  try {

    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${start.longitude},${start.latitude};` +
      `${end.longitude},${end.latitude}` +
      `?overview=false`;

    const response = await fetch(url);

    const data = await response.json();
    console.log("ROUTE :", JSON.stringify(data, null, 2));

    if (
      !data.routes ||
      data.routes.length === 0
    ) {
      return null;
    }

    return {
      distance:
        data.routes[0].distance / 1000,
      duration:
        data.routes[0].duration / 60,
    };

  } catch (error) {

    console.log(
      "Erreur itinéraire :",
      error
    );

    return null;
  }
}