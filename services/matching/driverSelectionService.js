import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { getDistance } from "geolib";

import { db } from "../../firebase/config";
import { getMatchingSettings } from "../configService";
export async function findAvailableDrivers(
  passengerLocation,
  vehicleType
) {
  console.log("================================");
  console.log("VehicleType demandé :", vehicleType);
  console.log("Position passager :", passengerLocation);
  console.log("================================");
const settings = await getMatchingSettings();

const maxDriverDistance =
  settings?.maxDriverDistance ?? 10000; // 10 km par défaut

console.log(
  "📏 Distance maximale :",
  maxDriverDistance,
  "m"
);

  try {
    const q = query(
      collection(db, "users"),
      where("role", "==", "driver"),
      where("isOnline", "==", true),
      where("subscriptionActive", "==", true)
    );

    const snapshot = await getDocs(q);

    console.log(
      "Nombre de conducteurs trouvés :",
      snapshot.size
    );

    if (snapshot.empty) {
      console.log("❌ Aucun conducteur en ligne.");
      return [];
    }

    const drivers = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .map((driver) => {
        const distance = getDistance(
          {
            latitude: passengerLocation.latitude,
            longitude: passengerLocation.longitude,
          },
          {
            latitude: driver.latitude,
            longitude: driver.longitude,
          }
        );

        console.log("-------------");
        console.log("Conducteur :", driver.name);
        console.log("ID :", driver.id);
        console.log("En ligne :", driver.isOnline);
        console.log(
          "Disponibilité :",
          driver.availability
        );
        console.log(
          "Abonnement :",
          driver.subscriptionActive
        );
        console.log(
          "Type véhicule :",
          driver.vehicleType
        );
        console.log(
          "Position :",
          driver.latitude,
          driver.longitude
        );
        console.log("Distance :", distance, "m");

        return {
          ...driver,
          distance,
        };
      })
     .filter((driver) => {

  // Position obligatoire
  if (
    driver.latitude == null ||
    driver.longitude == null
  ) {
    return false;
  }

  // Disponible
  if (driver.availability !== "available") {
    return false;
  }

 // Même type de véhicule demandé
if (
  driver.vehicleType?.toLowerCase() !==
  vehicleType?.toLowerCase()
) {
  return false;
}

  // Dans le rayon autorisé
  if (driver.distance > maxDriverDistance) {
    return false;
  }

  console.log(
    `✅ ${driver.name} retenu (${driver.distance} m)`
  );

  return true;

})
      .sort((a, b) => a.distance - b.distance);

    console.log("================================");
    console.log(
      "Conducteurs retenus :",
      drivers.length
    );

    drivers.forEach((driver, index) => {
      console.log(
        `${index + 1}. ${driver.name} - ${driver.distance} m`
      );
    });

    console.log("================================");

    return drivers;
  } catch (error) {
    console.log(
      "Erreur findAvailableDrivers :",
      error
    );
    return [];
  }
}