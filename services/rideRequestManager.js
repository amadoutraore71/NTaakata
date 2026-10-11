import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/config";

// ======================================================
// CONFIGURATION
// ======================================================

const SEARCH_TIMEOUT = 60 * 1000;

// Un seul timer actif par course.
const activeTimers = new Map();

// Empêche deux appels simultanés de démarrer un timer pour la même course.
const startingTimers = new Set();

// ======================================================
// DÉMARRER LE TIMER DE RECHERCHE
// ======================================================

export async function startRideSearchTimer(rideId) {
  if (!rideId) {
    console.warn("[RideTimer] rideId absent.");
    return;
  }

  // Ne pas remplacer un timer existant ni lancer un deuxième démarrage.
  if (activeTimers.has(rideId) || startingTimers.has(rideId)) {
    return;
  }

  // Verrou posé avant le premier await pour éviter la course entre appels.
  startingTimers.add(rideId);
  const rideRef = doc(db, "rides", rideId);

  try {
    const rideSnap = await getDoc(rideRef);

    if (!rideSnap.exists()) {
      console.warn("[RideTimer] Course introuvable :", rideId);
      return;
    }

    // Ne minuter que les courses encore en recherche.
    if (rideSnap.data().status !== "searching") {
      return;
    }

    // Une autre opération a pu créer un timer pendant la lecture Firestore.
    if (activeTimers.has(rideId)) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const result = await runTransaction(db, async (transaction) => {
          const latestSnap = await transaction.get(rideRef);

          if (!latestSnap.exists()) {
            return { updated: false, reason: "not_found" };
          }

          const ride = latestSnap.data();

          // Une acceptation ou un autre changement de statut annule l'expiration.
          if (ride.status !== "searching") {
            return {
              updated: false,
              reason: "status_changed",
              status: ride.status,
            };
          }

          transaction.update(rideRef, {
            status: "search_timeout",
            failureReason: "no_driver_answer",
            searchEndedAt: serverTimestamp(),
            currentSearchingRequestId: null,
            currentSearchingDriverId: null,
            currentSearchingDriverName: null,
            currentSearchingDriverLocation: null,
            currentSearchingDriverDistance: null,
            currentSearchingDriverVehicleType: null,
          });

          return { updated: true };
        });

        if (result.updated) {
          console.log("[RideTimer] Recherche expirée :", rideId);
        }
      } catch (error) {
        console.error("[RideTimer] Erreur d'expiration :", error);
      } finally {
        // Ne supprimer que le timer qui est toujours enregistré pour cette course.
        if (activeTimers.get(rideId) === timer) {
          activeTimers.delete(rideId);
        }
      }
    }, SEARCH_TIMEOUT);

    activeTimers.set(rideId, timer);
  } catch (error) {
    console.error("[RideTimer] Démarrage impossible :", error);
  } finally {
    // Toujours libérer le verrou, même si Firestore échoue ou si la course est terminée.
    startingTimers.delete(rideId);
  }
}

// ======================================================
// ARRÊTER LE TIMER
// ======================================================

export function stopRideSearchTimer(rideId, log = true) {
  if (!rideId) return;

  // Si le démarrage est encore en cours, le statut Firestore sera vérifié
  // avant la création du timer. La transaction du timeout protège également
  // contre une expiration après acceptation.
  const timer = activeTimers.get(rideId);

  if (timer) {
    clearTimeout(timer);
    activeTimers.delete(rideId);

    if (log) {
      console.log("[RideTimer] Timer arrêté :", rideId);
    }
  }
}

// ======================================================
// VÉRIFIER SI UN TIMER EST ACTIF
// ======================================================

export function isRideSearchTimerActive(rideId) {
  return activeTimers.has(rideId);
}
