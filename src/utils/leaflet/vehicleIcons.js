/**
 * Retourne l'icône du véhicule à afficher.
 * Plus tard, on pourra utiliser de vraies images
 * (Toyota, Hyundai, Jakarta, Bajaj, Taxi...)
 */
export function getVehicleIcon(driver) {

  switch (driver.vehicleType) {

    case "moto":
      return driver.iconMoto;

    case "voiture":
      return driver.iconCar;

    default:
      return driver.iconCar;

  }

}

/**
 * Icône du passager.
 */
export function getPassengerIcon(icons) {
  return icons.passenger;
}

/**
 * Icône de la destination.
 */
export function getDestinationIcon(icons) {
  return icons.destination;
}