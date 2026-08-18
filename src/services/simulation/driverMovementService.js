import {
    doc,
    updateDoc,
} from "firebase/firestore";

import { db } from "../../../firebase/config";
import { DEV_CONFIG } from "../../config/devConfig";
import { getRoute } from "./routeService";
let movementStopped = false;

/**
 * Lance le déplacement du conducteur.
 */
export async function startDriverMovement({
  driverId,
  startLocation,
  endLocation,
  onStep,
  onFinished,
}) {

  

  if (!driverId) {
    throw new Error("driverId manquant.");
  }

// ===========================
// MODE DÉVELOPPEUR
// ===========================

const realStartLocation = DEV_CONFIG.enabled
  ? createFakeStartLocation(
      endLocation,
      DEV_CONFIG.driverStartDistance
    )
  : startLocation;

console.log(
  "🚖 Départ simulation :",
  realStartLocation
);
await updateDoc(
  doc(db, "users", driverId),
  {
    latitude: realStartLocation.latitude,
    longitude: realStartLocation.longitude,
  }
);
console.log(
  "🚀 Position initiale enregistrée :",
  realStartLocation
);
console.log("👤 Passager :", endLocation);
console.log("🚖 Conducteur départ :", realStartLocation);
const route = await getRoute(
  realStartLocation,
  endLocation
);
console.log("🛣 Route reçue :", route.length);
console.log("📍 Premier point :", route[0]);
console.log("📍 Dernier point :", route[route.length - 1]);
  if (!route.length) {
    return;
  }

 const totalDuration = DEV_CONFIG.movementDuration;

  const delay = Math.max(
    60,
    totalDuration / route.length
  );

  for (let i = 0; i < route.length; i++) {

    if (movementStopped) {
      console.log("🛑 Déplacement interrompu");
      return;
    }

    const point = route[i];
        console.log(
        "📍 Déplacement",
        i,
        "/",
        route.length,
        point.latitude,
        point.longitude
        );  
    await updateDoc(
      doc(db, "users", driverId),
      {
        latitude: point.latitude,
        longitude: point.longitude,
      }
    );
console.log("✅ Firestore mis à jour");
    if (onStep) {
      await onStep({
        index: i,
        total: route.length,
        location: point,
      });
    }

    await new Promise(resolve =>
      setTimeout(resolve, delay)
    );
  }

  if (onFinished) {
    await onFinished();
  }

  console.log("🏁 Déplacement terminé");
}
function createFakeStartLocation(passengerLocation, distance = 1000) {
  const angle = Math.random() * 2 * Math.PI;

  const dLat =
    (distance * Math.cos(angle)) / 111320;

  const dLng =
    (distance * Math.sin(angle)) /
    (111320 *
      Math.cos(
        passengerLocation.latitude *
          Math.PI /
          180
      ));

  return {
    latitude:
      passengerLocation.latitude + dLat,
    longitude:
      passengerLocation.longitude + dLng,
  };
}

/**
 * Arrête immédiatement le déplacement.
 */
export function stopDriverMovement() {
  movementStopped = true;
}