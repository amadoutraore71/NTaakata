import {
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase/config";

/**
 * Conducteur disponible
 */
export async function setDriverAvailable(driverId) {
  await updateDoc(doc(db, "users", driverId), {
    isOnline: true,
    availability: "available",
    updatedAt: serverTimestamp(),
  });
}

/**
 * Conducteur occupé
 */
export async function setDriverBusy(driverId) {
  await updateDoc(doc(db, "users", driverId), {
    isOnline: true,
    availability: "busy",
    updatedAt: serverTimestamp(),
  });
}

/**
 * Conducteur hors ligne
 */
export async function setDriverOffline(driverId) {
  await updateDoc(doc(db, "users", driverId), {
    isOnline: false,
    availability: "offline",
    updatedAt: serverTimestamp(),
  });
}

/**
 * Mise à jour de la position du conducteur
 */
export async function updateDriverLocation(
  driverId,
  location
) {
  await updateDoc(doc(db, "users", driverId), {
    latitude: location.latitude,
    longitude: location.longitude,
    heading: location.heading ?? 0,
    speed: location.speed ?? 0,
    updatedAt: serverTimestamp(),
  });
}