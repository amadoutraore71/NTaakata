import { router } from "expo-router";
import { Alert } from "react-native";

import { calculateFare } from "../utils/fareCalculator";
import { calculateRoute } from "../utils/routeCalculator";

import { findAvailableDrivers } from "../../services/matching/driverSelectionService";
import { createRide } from "../../services/rideService";

export default function useRideRequest() {

  async function requestRide({
    user,
    pickup,
    destination,
    currentLocation,
    vehicleType,
    stopLocation,
  }) {

    try {

      if (!destination) {
        Alert.alert(
          "Destination",
          "Veuillez choisir une destination."
        );
        return;
      }

      if (!currentLocation) {
        Alert.alert(
          "Patientez",
          "Position GPS indisponible."
        );
        return;
      }

      const route = await calculateRoute(
        {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        },
        {
          latitude: destination.latitude,
          longitude: destination.longitude,
        }
      );

      if (!route) return;

      const distance = Number(route.distance.toFixed(1));

      const price = calculateFare(
        distance,
        vehicleType
      );

      const duration =
        Math.round((distance / 40) * 60);

      const drivers =
        await findAvailableDrivers(
          {
            latitude:
              currentLocation.coords.latitude,
            longitude:
              currentLocation.coords.longitude,
          },
          vehicleType
        );

      if (drivers.length === 0) {

        Alert.alert(
          "Aucun conducteur",
          "Aucun conducteur disponible."
        );

        return;
      }
      const nearestDriver = drivers[0];

console.log("========== MATCHING ==========");
console.log("Conducteurs disponibles :", drivers.length);
console.log("Conducteur choisi :", nearestDriver.name);
console.log("Distance :", nearestDriver.distance, "m");
console.log("==============================");
      stopLocation();

      const rideId = await createRide({

        passenger: user,

        driver: nearestDriver,

        pickup: {

          latitude:
            currentLocation.coords.latitude,

          longitude:
            currentLocation.coords.longitude,

          address: pickup,

        },

        destination: {

          latitude:
            destination.latitude,

          longitude:
            destination.longitude,

          address:
            destination.address,

        },

        distance,

        duration,

        price,
        vehicleType,

      });

      router.push({

        pathname:
          "/(passenger)/RideStatus",

        params: {

          rideId,

        },

      });

    }

    catch (error) {

      console.log(error);

      Alert.alert(
        "Erreur",
        "Impossible de créer la course."
      );

    }

  }

  return {

    requestRide,

  };

}