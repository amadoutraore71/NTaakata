const API_KEY = "pk.200ffe0462e25e18c6f238b73061c075";

export async function searchLocationIQ(query) {
  try {
    const url =
      `https://api.locationiq.com/v1/autocomplete` +
      `?key=${API_KEY}` +
      `&q=${encodeURIComponent(query)}` +
      `&countrycodes=ml` +
      `&limit=10` +
      `&format=json`;

    const response = await fetch(url);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    return data.map((item) => {
      const address = item.address || {};

      const parts = (item.display_name || "")
        .split(",")
        .map((p) => p.trim());

      const placeName =
        address.name ||
        address.attraction ||
        address.amenity ||
        address.shop ||
        address.building ||
        parts[0] ||
        "";

      const street =
        address.road || "";

      const suburb =
        address.suburb ||
        address.neighbourhood ||
        address.hamlet ||
        "";

      const city =
        address.city ||
        address.town ||
        address.village ||
        "";

      const region =
        address.state || "";

      return {
        id: item.place_id.toString(),

        // Nom court
        name: placeName,

        // Rue
        street,

        // Quartier
        suburb,

        city,

        region,

        latitude: Number(item.lat),
        longitude: Number(item.lon),

        address: [
          placeName,
          street,
          suburb,
          city,
        ]
          .filter(Boolean)
          .join(", "),

        category: "other",
        type: "other",
        aliases: [],
        popularity: 0,
      };
    });
  } catch (error) {
    console.log(error);
    return [];
  }
}