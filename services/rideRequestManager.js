import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase/config";


// ======================================================
// TIMER GLOBAL DE RECHERCHE
// ======================================================

// 60 secondes
const SEARCH_TIMEOUT = 60 * 1000;


// ======================================================
// TIMERS ACTIFS
// ======================================================
//
// Un seul timer par COURSE.
// La clé est donc rideId et non requestId.
//
// ======================================================

const activeTimers = new Map();


// ======================================================
// DÉMARRER LE TIMER GLOBAL D'UNE COURSE
// ======================================================

export async function startRideSearchTimer(rideId) {

  console.log(
    "🚀 startRideSearchTimer :",
    rideId
  );


  // ====================================================
  // Supprimer un éventuel ancien timer
  // ====================================================

  const existingTimer =
    activeTimers.get(rideId);

  if (existingTimer) {

    clearTimeout(existingTimer);

    activeTimers.delete(rideId);

    console.log(
      "♻️ Ancien timer supprimé :",
      rideId
    );
  }


  // ====================================================
  // RÉCUPÉRER LA COURSE
  // ====================================================

  const rideRef =
    doc(
      db,
      "rides",
      rideId
    );

  const rideSnap =
    await getDoc(rideRef);


  if (!rideSnap.exists()) {

    console.log(
      "❌ Course introuvable :",
      rideId
    );

    return;
  }


  const ride =
    rideSnap.data();


  // ====================================================
  // VÉRIFIER QUE LA COURSE EST EN RECHERCHE
  // ====================================================

  if (
    ride.status !== "searching"
  ) {

    console.log(
      "⛔ Impossible de démarrer le timer."
    );

    console.log(
      "Statut actuel :",
      ride.status
    );

    return;
  }


  console.log(
    "🚕 Course :",
    rideId
  );

  console.log(
    "👥 Mode de recherche :",
    ride.searchMode ?? "broadcast"
  );

  console.log(
    "👥 Conducteurs contactés :",
    ride.contactedDriversCount ??
      ride.contactedDrivers?.length ??
      0
  );

  console.log(
    "⏱️ Timeout global : 60 secondes"
  );


  // ====================================================
  // TIMER GLOBAL DE 60 SECONDES
  // ====================================================

  const timer =
    setTimeout(
      async () => {

        try {

          console.log(
            "======================================"
          );

          console.log(
            "⏰ TIMER GLOBAL EXPIRÉ"
          );

          console.log(
            "🚕 Ride ID :",
            rideId
          );

          console.log(
            "⏱️ 60 secondes écoulées"
          );

          console.log(
            "======================================"
          );


          // ============================================
          // RECHARGER LA COURSE
          // ============================================

          const latestRideSnap =
            await getDoc(rideRef);


          if (!latestRideSnap.exists()) {

            console.log(
              "❌ Course introuvable."
            );

            return;
          }


          const latestRide =
            latestRideSnap.data();


          // ============================================
          // COURSE ANNULÉE
          // ============================================

          if (
            latestRide.status ===
            "cancelled"
          ) {

            console.log(
              "⛔ Course annulée."
            );

            return;
          }


          // ============================================
          // COURSE DÉJÀ ACCEPTÉE
          // ============================================

          if (
            [
              "accepted",
              "driver_arriving",
              "arrived",
              "started",
              "completed",
            ].includes(
              latestRide.status
            )
          ) {

            console.log(
              "✅ Course déjà prise."
            );

            return;
          }


          // ============================================
          // COURSE DÉJÀ TERMINÉE
          // ============================================

          if (
            [
              "search_timeout",
              "search_failed",
            ].includes(
              latestRide.status
            )
          ) {

            console.log(
              "ℹ️ Recherche déjà terminée :",
              latestRide.status
            );

            return;
          }


          // ============================================
          // VÉRIFIER QUE LA COURSE EST TOUJOURS
          // EN RECHERCHE
          // ============================================

          if (
            latestRide.status !==
            "searching"
          ) {

            console.log(
              "⛔ Recherche déjà terminée :",
              latestRide.status
            );

            return;
          }


          // ============================================
          // MARQUER TOUTES LES DEMANDES EN ATTENTE
          // COMME EXPIRÉES
          // ============================================

          console.log(
            "⌛ Recherche globale expirée."
          );


          // =================================================
          // IMPORTANT :
          //
          // La course possède plusieurs ride_requests.
          //
          // Le rideRequestManager ne doit pas ici essayer
          // de contacter un conducteur suivant.
          //
          // Tous les conducteurs ont déjà reçu la demande.
          //
          // =================================================


          // ============================================
          // TERMINER LA COURSE
          // ============================================

          await updateDoc(
            rideRef,
            {

              status:
                "search_timeout",

              failureReason:
                "no_driver_answer",

              searchEndedAt:
                serverTimestamp(),

              // ========================================
              // Nettoyage du conducteur recherché
              // ========================================

              currentSearchingRequestId:
                null,

              currentSearchingDriverId:
                null,

              currentSearchingDriverName:
                null,

              currentSearchingDriverLocation:
                null,

              currentSearchingDriverDistance:
                null,

              currentSearchingDriverVehicleType:
                null,

            }
          );


          console.log(
            "======================================"
          );

          console.log(
            "❌ RECHERCHE TERMINÉE"
          );

          console.log(
            "❌ Aucun conducteur n'a répondu"
          );

          console.log(
            "⏱️ Timeout : 60 secondes"
          );

          console.log(
            "🚕 Ride ID :",
            rideId
          );

          console.log(
            "======================================"
          );


        } catch (error) {

          console.error(
            "❌ Erreur timer global :",
            error
          );

        } finally {

          // ==========================================
          // SUPPRIMER LE TIMER
          // ==========================================

          activeTimers.delete(
            rideId
          );

          console.log(
            "🧹 Timer global supprimé :",
            rideId
          );
        }

      },

      SEARCH_TIMEOUT
    );


  // ====================================================
  // ENREGISTRER LE TIMER
  // ====================================================

  activeTimers.set(
    rideId,
    timer
  );


  console.log(
    "⏱️ Timer global enregistré :",
    rideId
  );

  console.log(
    "⏱️ Expiration prévue dans : 60 secondes"
  );
}


// ======================================================
// ARRÊTER LE TIMER D'UNE COURSE
// ======================================================
//
// À appeler lorsqu'un conducteur accepte.
// ======================================================

export function stopRideSearchTimer(
  rideId
) {

  const timer =
    activeTimers.get(
      rideId
    );


  if (timer) {

    clearTimeout(
      timer
    );

    activeTimers.delete(
      rideId
    );

    console.log(
      "🛑 Timer global arrêté :",
      rideId
    );

  } else {

    console.log(
      "ℹ️ Aucun timer actif pour :",
      rideId
    );
  }
}


// ======================================================
// VÉRIFIER SI UN TIMER EST ACTIF
// ======================================================

export function isRideSearchTimerActive(
  rideId
) {

  return activeTimers.has(
    rideId
  );
}