export function calculateFare(distance) {

  const distanceKm = distance / 1000;

  const baseFare = 500;

  const pricePerKm = 300;

  return Math.round(
    baseFare +
    distanceKm * pricePerKm
  );

}