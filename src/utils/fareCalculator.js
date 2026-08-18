import { FARES } from "../../constants/fares";

export function calculateFare(distanceKm, vehicleType = "voiture") {
  const fare = FARES[vehicleType] || FARES.voiture;

  const total =
    fare.baseFare +
    distanceKm * fare.pricePerKm;

  // Arrondi à la centaine la plus proche
  const roundedFare = Math.round(total / 100) * 100;

  // Prix minimum selon le véhicule
  switch (vehicleType) {
    case "moto":
      return Math.max(roundedFare, 500);

    case "voiture":
      return Math.max(roundedFare, 800);

    case "premium":
      return Math.max(roundedFare, 1200);

    default:
      return Math.max(roundedFare, 800);
  }
}