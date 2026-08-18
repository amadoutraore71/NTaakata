import {
    doc,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";

import { db } from "../firebase/config";

/**
 * Le conducteur est arrivé chez le passager.
 */
export async function markDriverArrived(rideId) {
  try {
    await updateDoc(
      doc(db, "rides", rideId),
      {
        status: "arrived",
        arrivedAt: serverTimestamp(),
      }
    );

    console.log("Conducteur arrivé.");
  } catch (error) {
    console.log(error);
    throw error;
  }
}

/**
 * Début de la course.
 */
export async function startRide(rideId) {
  try {
    await updateDoc(
      doc(db, "rides", rideId),
      {
        status: "started",
        startedAt: serverTimestamp(),
      }
    );

    console.log("Course démarrée.");
  } catch (error) {
    console.log(error);
    throw error;
  }
}

/**
 * Fin de la course.
 */
export async function finishRide({
  rideId,
  driverId,
}) {
  try {

    // Terminer la course
    await updateDoc(
      doc(db, "rides", rideId),
      {
        status: "completed",
        completedAt: serverTimestamp(),
      }
    );

    // Remettre le conducteur disponible
    await updateDoc(
      doc(db, "users", driverId),
      {
        availability: "available",
        isOnline: true,
      }
    );

    console.log("Course terminée.");
  } catch (error) {
    console.log(error);
    throw error;
  }
}