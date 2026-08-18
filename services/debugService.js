import {
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase/config";

/**
 * Le conducteur accepte la course
 */
export async function debugAcceptRide(
  rideId,
  driver
) {
  if (!driver) {
    throw new Error("Aucun conducteur fourni.");
  }

  await updateDoc(doc(db, "rides", rideId), {
    status: "accepted",

    acceptedAt: serverTimestamp(),
    
    driverId: driver.id,
    driverName: driver.name,
    driverPhone: driver.phone,
    driverVehicleType: driver.vehicleType,
    failureReason: null,
    searchEndedAt: null,
  });
}

/**
 * Le conducteur est en route
 */
export async function debugDriverArriving(rideId) {
  await updateDoc(doc(db, "rides", rideId), {
    status: "arriving",
    driverArrivingAt: serverTimestamp(),
  });
}

/**
 * Début de la course
 */
export async function debugStartRide(rideId) {
  await updateDoc(doc(db, "rides", rideId), {
    status: "in_progress",
    startedAt: serverTimestamp(),
  });
}

/**
 * Fin de la course
 */
export async function debugFinishRide(rideId) {
  await updateDoc(doc(db, "rides", rideId), {
    status: "completed",
    completedAt: serverTimestamp(),
  });
}

/**
 * Course annulée
 */
export async function debugCancelRide(rideId) {
  await updateDoc(doc(db, "rides", rideId), {
    status: "cancelled",
    cancelledAt: serverTimestamp(),
  });
}

/**
 * Remise à zéro complète
 */
export async function debugResetRide(rideId) {
  await updateDoc(doc(db, "rides", rideId), {

    status: "pending",

    acceptedAt: null,
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    driverArrivingAt: null,

    driverId: null,
    driverName: null,
    driverPhone: null,
    driverDistance: null,
    driverVehicleType: null,

    failureReason: null,
    searchEndedAt: null,
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simulation complète d'une course
 */
export async function debugSimulateRide(
  rideId,
  driver
) {
  try {

    if (!driver) {
      throw new Error("Aucun conducteur disponible.");
    }

    console.log("🚕 Début de la simulation");

    // 1. Acceptation
    await debugAcceptRide(
      rideId,
      driver
    );

    await wait(3000);

    // 2. En route
    await debugDriverArriving(rideId);

    await wait(5000);

    // 3. Début de la course
    await debugStartRide(rideId);

    await wait(8000);

    // 4. Fin
    await debugFinishRide(rideId);

    console.log("🏁 Simulation terminée");

  } catch (error) {
    console.log(error);
  }
}