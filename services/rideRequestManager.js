import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase/config";

import { getMatchingSettings } from "./configService";
import { sendRideToNextDriver } from "./rideMatchingEngine";

// ======================================================
// Timers actifs
// ======================================================

const activeTimers = new Map();

// ======================================================
// Lance le timer d'une demande
// ======================================================

export async function startRideRequestTimer(
  requestId
) {
  console.log(
    "🚀 startRideRequestTimer :",
    requestId
  );

  // ====================================================
  // Si un timer existe déjà pour cette demande
  // ====================================================

  const existingTimer =
    activeTimers.get(requestId);

  if (existingTimer) {
    clearTimeout(existingTimer);

    activeTimers.delete(requestId);

    console.log(
      "♻️ Ancien timer supprimé :",
      requestId
    );
  }

  // ====================================================
  // Récupérer la demande
  // ====================================================

  const requestRef = doc(
    db,
    "ride_requests",
    requestId
  );

  const requestSnap =
    await getDoc(requestRef);

  if (!requestSnap.exists()) {
    console.log(
      "❌ Demande introuvable :",
      requestId
    );

    return;
  }

  const request =
    requestSnap.data();

  // ====================================================
  // Paramètres du matching
  // ====================================================

  const settings =
    await getMatchingSettings();

  const timeoutSeconds =
    request.vehicleType?.toLowerCase() ===
    "moto"
      ? settings?.requestTimeoutMoto ?? 10
      : settings?.requestTimeoutVoiture ?? 15;

  const requestTimeout =
    timeoutSeconds * 1000;

  console.log(
    `⏱ ${request.vehicleType} : ${timeoutSeconds} secondes`
  );

  // ====================================================
  // Créer le timer
  // ====================================================

  const timer = setTimeout(
    async () => {
      try {
        console.log(
          "⏰ TIMER EXPIRÉ :",
          requestId
        );

        // ==============================================
        // Recharger la demande
        // ==============================================

        const latestRequestSnap =
          await getDoc(requestRef);

        if (!latestRequestSnap.exists()) {
          console.log(
            "❌ Demande introuvable."
          );

          return;
        }

        const latestRequest =
          latestRequestSnap.data();

        // ==============================================
        // Récupérer la course
        // ==============================================

        const rideRef = doc(
          db,
          "rides",
          latestRequest.rideId
        );

        const rideSnap =
          await getDoc(rideRef);

        if (!rideSnap.exists()) {
          console.log(
            "❌ Course introuvable."
          );

          return;
        }

        const ride =
          rideSnap.data();

        // ==============================================
        // COURSE ANNULÉE
        // ==============================================

        if (
          ride.status === "cancelled"
        ) {
          console.log(
            "⛔ Course annulée."
          );

          return;
        }

        // ==============================================
        // COURSE DÉJÀ PRISE
        // ==============================================

        if (
          [
            "accepted",
            "driver_arriving",
            "arrived",
            "started",
            "completed",
          ].includes(ride.status)
        ) {
          console.log(
            "✅ Course déjà prise."
          );

          return;
        }

        // ==============================================
        // DEMANDE DÉJÀ TRAITÉE
        // ==============================================

        if (
          latestRequest.status !==
          "pending"
        ) {
          console.log(
            "ℹ️ Demande déjà traitée :",
            latestRequest.status
          );

          return;
        }

        // ==============================================
        // 🔴 PROTECTION IMPORTANTE
        //
        // Vérifier que cette demande est toujours
        // celle actuellement recherchée.
        // ==============================================

        if (
          ride.currentSearchingRequestId &&
          ride.currentSearchingRequestId !==
            requestId
        ) {
          console.log(
            "⛔ ANCIEN TIMER IGNORÉ"
          );

          console.log(
            "🆔 Timer :",
            requestId
          );

          console.log(
            "🆔 Demande actuelle :",
            ride.currentSearchingRequestId
          );

          return;
        }

        // ==============================================
        // Le conducteur actuel a expiré
        // ==============================================

        console.log(
          "⏰ Temps écoulé pour :",
          latestRequest.driverName
        );

        // ==============================================
        // Marquer la demande comme timeout
        // ==============================================

        await updateDoc(
          requestRef,
          {
            status: "timeout",
            timeoutAt:
              serverTimestamp(),
          }
        );

        console.log(
          "🔄 Recherche du conducteur suivant..."
        );

        // ==============================================
        // Chercher le conducteur suivant
        // ==============================================

        const nextRequestId =
          await sendRideToNextDriver({
            rideId:
              latestRequest.rideId,

            passenger: {
              userId:
                latestRequest.passengerId,

              name:
                latestRequest.passengerName,

              phone:
                latestRequest.passengerPhone,

              location:
                latestRequest.passengerLocation,

              pickup:
                latestRequest.pickup,

              destination:
                latestRequest.destination,

              estimatedDistance:
                latestRequest.estimatedDistance,

              estimatedDuration:
                latestRequest.estimatedDuration,

              estimatedPrice:
                latestRequest.estimatedPrice,

              vehicleType:
                latestRequest.vehicleType,
            },

            attemptedDrivers:
              latestRequest.attemptedDrivers ||
              [],
          });

        // ==============================================
        // Un conducteur suivant existe
        // ==============================================

        if (nextRequestId) {
          console.log(
            "✅ Nouvelle demande envoyée :",
            nextRequestId
          );

          console.log(
            "⏱️ DÉMARRAGE TIMER DU CONDUCTEUR SUIVANT :",
            nextRequestId
          );

          await startRideRequestTimer(
            nextRequestId
          );

          return;
        }

        // ==============================================
        // Plus aucun conducteur
        // ==============================================

        console.log(
          "❌ Plus aucun conducteur disponible."
        );
      } catch (error) {
        console.error(
          "❌ Erreur timer :",
          error
        );
      } finally {
        // ==============================================
        // Supprimer ce timer
        // ==============================================

        activeTimers.delete(requestId);

        console.log(
          "🧹 Timer supprimé :",
          requestId
        );
      }
    },
    requestTimeout
  );

  // ====================================================
  // Enregistrer le timer
  // ====================================================

  activeTimers.set(
    requestId,
    timer
  );

  console.log(
    "⏱️ Timer enregistré :",
    requestId
  );
}

// ======================================================
// Arrêter manuellement un timer
// ======================================================

export function stopRideRequestTimer(
  requestId
) {
  const timer =
    activeTimers.get(requestId);

  if (timer) {
    clearTimeout(timer);

    activeTimers.delete(
      requestId
    );

    console.log(
      "🛑 Timer arrêté :",
      requestId
    );
  }
}