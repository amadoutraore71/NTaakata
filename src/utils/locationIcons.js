export function getLocationIcon(category) {
  switch (category) {
    case "hospital":
      return "🏥";

    case "clinic":
      return "🏥";

    case "pharmacy":
      return "💊";

    case "bank":
      return "🏦";

    case "atm":
      return "🏧";

    case "school":
      return "🏫";

    case "university":
      return "🎓";

    case "marketplace":
      return "🛒";

    case "supermarket":
      return "🛒";

    case "restaurant":
      return "🍽️";

    case "cafe":
      return "☕";

    case "hotel":
      return "🏨";

    case "fuel":
      return "⛽";

    case "bus_station":
      return "🚌";

    case "airport":
      return "✈️";

    case "parking":
      return "🅿️";

    case "mosque":
      return "🕌";

    case "church":
      return "⛪";

    case "police":
      return "👮";

    case "fire_station":
      return "🚒";

    default:
      return "📍";
  }
}