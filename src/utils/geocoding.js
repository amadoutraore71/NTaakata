export const getCoordinatesFromAddress = async (
  address,
  currentLocation = null
) => {
  try {
    const apiKey = "pk.200ffe0462e25e18c6f238b73061c075";

    let url =
      `https://us1.locationiq.com/v1/search` +
      `?key=${apiKey}` +
      `&q=${encodeURIComponent(address)}` +
      `&format=json`;

    // Si on connaît la position du passager,
    // on privilégie les résultats proches.
    if (currentLocation) {
      url +=
        `&lat=${currentLocation.latitude}` +
        `&lon=${currentLocation.longitude}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      console.log("Erreur HTTP :", response.status);
      return null;
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    return {
      latitude: Number(data[0].lat),
      longitude: Number(data[0].lon),
      displayName: data[0].display_name,
    };

  } catch (error) {

    console.log("Erreur géocodage :", error);

    return null;
  }
};