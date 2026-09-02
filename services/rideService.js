import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase/config";

import {
  sendRideRequestToAllDrivers,
} from "./matchingService";

import {
  findAvailableDrivers,
} from "./matching/driverSelectionService";

console.log("📂 FICHIER services/rideService chargé");

// ======================================================
// CRÉATION D'UNE NOUVELLE COURSE
// ======================================================

export async function createRide({
  passenger,
  pickup,
  driver,
  destination,
  distance,
  duration,
  price,
  vehicleType,
}) {
  try {

    console.log("========== CREATE RIDE ==========");

    console.log(
      "pickup =",
      JSON.stringify(pickup, null, 2)
    );

    console.log(
      "destination =",
      JSON.stringify(destination, null, 2)
    );

    console.log(
      "vehicleType =",
      vehicleType
    );

    console.log("===============================");

    // ==================================================
    // 1. CRÉER LA COURSE
    // ==================================================

    const ride = {

      // ==========================
      // PASSAGER
      // ==========================

      passengerId:
        passenger.userId,

      passengerName:
        passenger.name,

      passengerPhone:
        passenger.phone,


      // ==========================
      // CONDUCTEUR
      // ==========================

      driverId: null,

      driverName: null,

      driverPhone: null,

      driverVehicleType: null,

      driverDistance: null,


      // ==========================
      // COURSE
      // ==========================

      pickup,

      destination,

      estimatedDistance:
        distance,

      estimatedDuration:
        duration,

      estimatedPrice:
        price,

      vehicleType,


      // ==========================
      // STATUT
      // ==========================

      status:
        "searching",


      // ==========================
      // DATES
      // ==========================

      createdAt:
        serverTimestamp(),

      acceptedAt:
        null,

      driverArrivingAt:
        null,

      arrivedAt:
        null,

      startedAt:
        null,

      completedAt:
        null,

      cancelledAt:
        null,

      searchEndedAt:
        null,


      // ==========================
      // PAIEMENT
      // ==========================

      paymentStatus:
        "pending",

      paymentMethod:
        "Espèces",


      // ==========================
      // NOTATION
      // ==========================

      ratingSubmitted:
        false,


      // ==========================
      // AUTRES
      // ==========================

      rideCode:
        null,

      failureReason:
        null,


      // ==========================
      // MATCHING
      // ==========================

      attemptedDrivers:
        [],

      contactedDrivers:
        [],

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
    };


    // ==================================================
    // 2. ENREGISTRER LA COURSE
    // ==================================================

    const docRef =
      await addDoc(
        collection(db, "rides"),
        ride
      );


    console.log(
      "🔥 COURSE CRÉÉE :",
      docRef.id
    );


    // ==================================================
    // 3. CHERCHER TOUS LES CONDUCTEURS DISPONIBLES
    // ==================================================

    console.log(
      "🔎 Recherche de TOUS les conducteurs disponibles..."
    );


    const drivers =
      await findAvailableDrivers(
        pickup,
        vehicleType
      );


    console.log(
      "🚗 Conducteurs disponibles :",
      drivers.length
    );


    // ==================================================
    // 4. AUCUN CONDUCTEUR
    // ==================================================

    if (!drivers.length) {

      console.log(
        "❌ Aucun conducteur disponible."
      );


      await markRideAsSearchFailed(
        docRef.id,
        "no_driver_found"
      );


      return docRef.id;
    }


    // ==================================================
    // 5. AFFICHER LES CONDUCTEURS
    // ==================================================

    console.log(
      "======================================"
    );

    console.log(
      "📢 CONDUCTEURS QUI VONT RECEVOIR LA DEMANDE"
    );

    drivers.forEach(
      (driver, index) => {

        console.log(
          `${index + 1}. ${driver.name} - ${driver.distance} m`
        );

      }
    );

    console.log(
      "======================================"
    );


    // ==================================================
    // 6. ENVOYER À TOUS LES CONDUCTEURS
    // ==================================================

    const requestIds =
      await sendRideRequestToAllDrivers({

        rideId:
          docRef.id,

        passenger: {

          ...passenger,

          vehicleType,

          location:
            pickup,

          pickup,

          destination,

          estimatedDistance:
            distance,

          estimatedDuration:
            duration,

          estimatedPrice:
            price,
        },

        drivers,
      });


    console.log(
      "📢 DEMANDES ENVOYÉES :",
      requestIds.length
    );

// ==================================================
// 7. LOG FINAL
// ==================================================
    console.log(
      "======================================"
    );

    console.log(
      "✅ COURSE CRÉÉE"
    );

    console.log(
      "Ride ID :",
      docRef.id
    );

    console.log(
      "Passager :",
      passenger.name
    );

    console.log(
      "Véhicule :",
      vehicleType
    );

    console.log(
      "Conducteurs contactés :",
      drivers.length
    );

    console.log(
      "Demandes créées :",
      requestIds.length
    );

   console.log(
  "⏱️ Timeout : 60 secondes"
);

    console.log(
      "======================================"
    );


    return docRef.id;


  } catch (error) {

    console.error(
      "❌ createRide :",
      error
    );

    throw error;
  }
}


// ======================================================
// RECHERCHE TERMINÉE
// ======================================================

export async function markRideAsSearchFailed(
  rideId,
  reason = "no_driver_found"
) {

  try {

    const rideRef =
      doc(
        db,
        "rides",
        rideId
      );


    await updateDoc(
      rideRef,
      {

        status:
          reason === "no_driver_answer"
            ? "search_timeout"
            : "search_failed",

        failureReason:
          reason,

        searchEndedAt:
          serverTimestamp(),

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
      "Ride ID :",
      rideId
    );

    console.log(
      "Raison :",
      reason
    );

    console.log(
      "======================================"
    );


  } catch (error) {

    console.error(
      "❌ markRideAsSearchFailed :",
      error
    );

    throw error;
  }
}