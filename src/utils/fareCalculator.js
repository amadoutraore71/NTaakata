/**
 * Calcule le prix d'une course
 * @param {number} distanceKm Distance en kilomètres
 * @param {string} vehicleType moto | voiture | climatisee
 * @returns {number} Prix en FCFA
 */

export const calculateFare = (
  distanceKm,
  vehicleType
) => {

  const distance = Number(distanceKm);

  let baseFare = 0;
  let pricePerKm = 0;

  switch (vehicleType) {

    case "moto":
      baseFare = 200;
      pricePerKm = 100;
      break;

    case "voiture":
      baseFare = 400;
      pricePerKm = 150;
      break;

    case "climatisee":
      baseFare = 600;
      pricePerKm = 200;
      break;

    default:
      return 0;

  }

  return Math.round(
    baseFare + (distance * pricePerKm)
  );

};