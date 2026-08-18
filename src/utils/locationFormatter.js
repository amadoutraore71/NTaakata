export function formatLocation(location) {
  return {
    title: location.name || "",

    subtitle: [
      location.street,
      location.suburb,
      location.city,
    ]
      .filter(Boolean)
      .join(" • "),
  };
}