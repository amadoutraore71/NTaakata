import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase/config";

import { findAvailableDrivers } from "./matching/driverSelectionService";

import {
  startRideSearchTimer,
} from "./rideRequestManager";

import {
  isSubscriptionValid,
} from "./subscriptionService";

// ======================================================
// ENVOYER LA COURSE À TOUS LES CONDUCTEURS DISPONIBLES
// ======================================================

export async function sendRideRequestToAllDrivers({
  rideId,
  passenger,
  drivers,
}) {

  console.log("======================================");
  console.log("📢 BROADCAST MATCHING");
  console.log("🚕 Ride ID :", rideId);
  console.log(
    "👥 Conducteurs trouvés :",
    drivers?.length ?? 0
  );
  console.log("======================================");

  try {

    // ==================================================
    // VÉRIFICATION
    // ==================================================

    if (!drivers || !drivers.length) {

      console.log(
        "❌ Aucun conducteur trouvé"
      );

      return [];

    }

    // ==================================================
    // FILTRER LES CONDUCTEURS ABONNÉS
    // ==================================================

    const eligibleDrivers =
      drivers.filter((driver) => {

        const subscriptionActive =
          driver.subscriptionActive === true;

        const subscriptionValid =
          isSubscriptionValid(
            driver.subscriptionExpiresAt
          );

        console.log(
          "🔎 Vérification abonnement :",
          driver.name,
          "| active :",
          subscriptionActive,
          "| expiration :",
          driver.subscriptionExpiresAt,
          "| valide :",
          subscriptionValid
        );

        // Le conducteur doit avoir :
        // 1. subscriptionActive = true
        // 2. une date d'expiration valide

        return (
          subscriptionActive &&
          subscriptionValid
        );

      });

    // ==================================================
    // INFORMATIONS
    // ==================================================

    console.log(
      "👥 Conducteurs trouvés :",
      drivers.length
    );

    console.log(
      "✅ Conducteurs abonnés :",
      eligibleDrivers.length
    );

    console.log(
      "🚫 Conducteurs exclus :",
      drivers.length -
        eligibleDrivers.length
    );

    // ==================================================
    // SI AUCUN CONDUCTEUR ABONNÉ
    // ==================================================

    if (!eligibleDrivers.length) {

      console.log(
        "❌ Aucun conducteur avec abonnement valide"
      );

      return [];

    }

    // ==================================================
    // TABLEAUX
    // ==================================================

    const requestIds = [];

    const contactedDrivers = [];

    const driverIds =
      eligibleDrivers.map(
        (driver) => driver.id
      );

    // ==================================================
    // CRÉER UNE DEMANDE POUR CHAQUE CONDUCTEUR
    // ==================================================

    for (const driver of eligibleDrivers) {

      console.log(
        "📤 Création demande pour :",
        driver.name,
        "| ID :",
        driver.id,
        "| Distance :",
        driver.distance,
        "m"
      );

      const requestRef =
        await addDoc(
          collection(
            db,
            "ride_requests"
          ),
          {

            // ==============================
            // COURSE
            // ==============================

            rideId,

            // ==============================
            // CONDUCTEUR
            // ==============================

            driverId:
              driver.id,

            driverName:
              driver.name,

            driverPhone:
              driver.phone ?? null,

            driverVehicleType:
              driver.vehicleType ?? null,

            driverDistance:
              driver.distance ?? null,

            driverLatitude:
              driver.latitude ?? null,

            driverLongitude:
              driver.longitude ?? null,

            // ==============================
            // PASSAGER
            // ==============================

            passengerId:
              passenger.userId,

            passengerName:
              passenger.name,

            passengerPhone:
              passenger.phone,

            // ==============================
            // POSITION PASSAGER
            // ==============================

            passengerLocation:
              passenger.location,

            pickup:
              passenger.pickup,

            destination:
              passenger.destination,

            // ==============================
            // ESTIMATION
            // ==============================

            estimatedDistance:
              passenger.estimatedDistance,

            estimatedDuration:
              passenger.estimatedDuration,

            estimatedPrice:
              passenger.estimatedPrice,

            // ==============================
            // TYPE VÉHICULE
            // ==============================

            vehicleType:
              passenger.vehicleType,

            // ==============================
            // STATUT
            // ==============================

            status:
              "pending",

            // ==============================
            // MODE BROADCAST
            // ==============================

            searchMode:
              "broadcast",

            // ==============================
            // CONDUCTEURS CONTACTÉS
            // ==============================

            attemptedDrivers:
              driverIds,

            // ==============================
            // DATE
            // ==============================

            createdAt:
              serverTimestamp(),

          }
        );

      // =================================================
      // MÉMORISER L'ID
      // =================================================

      requestIds.push(
        requestRef.id
      );

      // =================================================
      // HISTORIQUE CONDUCTEUR
      // =================================================

      contactedDrivers.push({

        id:
          driver.id,

        name:
          driver.name,

        phone:
          driver.phone ?? null,

        latitude:
          driver.latitude ?? null,

        longitude:
          driver.longitude ?? null,

        vehicleType:
          driver.vehicleType ?? null,

        distance:
          driver.distance ?? null,

      });

      console.log(
        "✅ Demande créée :",
        requestRef.id
      );

    }

    // ==================================================
    // METTRE À JOUR LA COURSE
    // ==================================================

    const rideRef =
      doc(
        db,
        "rides",
        rideId
      );

    await updateDoc(
      rideRef,
      {

        // ==============================
        // CONDUCTEURS CONTACTÉS
        // ==============================

        attemptedDrivers:
          driverIds,

        contactedDrivers,

        // ==============================
        // MODE DE MATCHING
        // ==============================

        searchMode:
          "broadcast",

        // ==============================
        // NOMBRE
        // ==============================

        contactedDriversCount:
          contactedDrivers.length,

        // ==============================
        // DEMANDES ACTIVES
        // ==============================

        activeRequestIds:
          requestIds,

        // ==============================
        // PAS DE CONDUCTEUR UNIQUE
        // ==============================

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

    // ==================================================
    // LOGS
    // ==================================================

    console.log(
      "======================================"
    );

    console.log(
      "✅ BROADCAST TERMINÉ"
    );

    console.log(
      "👥 Conducteurs abonnés contactés :",
      contactedDrivers.length
    );

    console.log(
      "📨 Demandes créées :",
      requestIds.length
    );

    console.log(
      "⏱️ Timeout global : 60 secondes"
    );

    console.log(
      "======================================"
    );

    // ==================================================
    // DÉMARRER LE TIMER GLOBAL
    // ==================================================

    if (requestIds.length > 0) {

      console.log(
        "🚀 Démarrage du timer global pour la course :",
        rideId
      );

      await startRideSearchTimer(
        rideId
      );

    }

    return requestIds;

  } catch (error) {

    console.error(
      "❌ sendRideRequestToAllDrivers :",
      error
    );

    throw error;

  }

}

// ======================================================
// ANCIENNE FONCTION
// ======================================================
//
// On la conserve pour éviter de casser les autres fichiers.
// Elle utilise maintenant le broadcast.
// ======================================================

export async function sendRideRequest({
  rideId,
  passenger,
}) {

  console.log(
    "⚠️ sendRideRequest() → redirection vers broadcast"
  );

  const drivers =
    await findAvailableDrivers(
      passenger.location,
      passenger.vehicleType
    );

  return await sendRideRequestToAllDrivers({

    rideId,

    passenger,

    drivers,

  });

}