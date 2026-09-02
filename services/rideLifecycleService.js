import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase/config";

import {
  setDriverAvailable,
  setDriverBusy,
} from "./driverService";

import {
  stopRideRequestTimer,
} from "./rideRequestManager";


// ======================================================
// CONDUCTEUR EN ROUTE VERS LE PASSAGER
// ======================================================

export async function driverArriving(rideId) {

  try {

    if (!rideId) {
      throw new Error("rideId manquant");
    }

    const rideRef = doc(
      db,
      "rides",
      rideId
    );

    const rideSnap = await getDoc(
      rideRef
    );

    if (!rideSnap.exists()) {
      throw new Error(
        "Course introuvable"
      );
    }

    const ride = rideSnap.data();

    // ----------------------------------
    // Vérification du statut
    // ----------------------------------

    if (ride.status !== "accepted") {

      throw new Error(
        `Impossible de passer en route depuis le statut : ${ride.status}`
      );

    }

    // ----------------------------------
    // Mise à jour
    // ----------------------------------

    await updateDoc(
      rideRef,
      {

        status:
          "driver_arriving",

        driverArrivingAt:
          serverTimestamp(),

      }
    );

    console.log(
      "🚕 Conducteur en route vers le passager"
    );

  } catch (error) {

    console.error(
      "❌ driverArriving :",
      error
    );

    throw error;

  }

}


// ======================================================
// CONDUCTEUR ARRIVÉ CHEZ LE PASSAGER
// ======================================================

export async function driverArrived(rideId) {

  try {

    if (!rideId) {
      throw new Error("rideId manquant");
    }

    const rideRef = doc(
      db,
      "rides",
      rideId
    );

    const rideSnap = await getDoc(
      rideRef
    );

    if (!rideSnap.exists()) {
      throw new Error(
        "Course introuvable"
      );
    }

    const ride = rideSnap.data();

    // ----------------------------------
    // Vérification
    // ----------------------------------

    if (
      ride.status !==
      "driver_arriving"
    ) {

      throw new Error(
        `Impossible de déclarer l'arrivée depuis le statut : ${ride.status}`
      );

    }

    // ----------------------------------
    // Mise à jour
    // ----------------------------------

    await updateDoc(
      rideRef,
      {

        status:
          "arrived",

        arrivedAt:
          serverTimestamp(),

      }
    );

    console.log(
      "📍 Conducteur arrivé"
    );

  } catch (error) {

    console.error(
      "❌ driverArrived :",
      error
    );

    throw error;

  }

}


// ======================================================
// DÉMARRER LA COURSE
// ======================================================

export async function startRide(rideId) {

  try {

    if (!rideId) {
      throw new Error("rideId manquant");
    }

    const rideRef = doc(
      db,
      "rides",
      rideId
    );

    const rideSnap = await getDoc(
      rideRef
    );

    if (!rideSnap.exists()) {
      throw new Error(
        "Course introuvable"
      );
    }

    const ride = rideSnap.data();

    // ----------------------------------
    // Vérification
    // ----------------------------------

    if (
      ride.status !==
      "arrived"
    ) {

      throw new Error(
        `Impossible de démarrer la course depuis le statut : ${ride.status}`
      );

    }

    // ----------------------------------
    // Mettre la course en started
    // ----------------------------------

    await updateDoc(
      rideRef,
      {

        status:
          "started",

        startedAt:
          serverTimestamp(),

      }
    );

    // ----------------------------------
    // Conducteur occupé
    // ----------------------------------

    if (ride.driverId) {

      await setDriverBusy(
        ride.driverId
      );

    }

    console.log(
      "▶️ Course démarrée"
    );

  } catch (error) {

    console.error(
      "❌ startRide :",
      error
    );

    throw error;

  }

}


// ======================================================
// TERMINER LA COURSE
// ======================================================

export async function completeRide(
  rideId
) {

  try {

    if (!rideId) {
      throw new Error("rideId manquant");
    }

    const rideRef = doc(
      db,
      "rides",
      rideId
    );

    const rideSnap = await getDoc(
      rideRef
    );

    if (!rideSnap.exists()) {
      throw new Error(
        "Course introuvable"
      );
    }

    const ride = rideSnap.data();

    // ----------------------------------
    // Vérification
    // ----------------------------------

    if (
      ride.status !==
      "started"
    ) {

      throw new Error(
        `Impossible de terminer la course depuis le statut : ${ride.status}`
      );

    }

    // ----------------------------------
    // Terminer la course
    // ----------------------------------

    await updateDoc(
      rideRef,
      {

        status:
          "completed",

        completedAt:
          serverTimestamp(),

      }
    );

    // ----------------------------------
    // Libérer le conducteur
    // ----------------------------------

    if (ride.driverId) {

      await setDriverAvailable(
        ride.driverId
      );

    }

    console.log(
      "🏁 Course terminée"
    );

  } catch (error) {

    console.error(
      "❌ completeRide :",
      error
    );

    throw error;

  }

}


// ======================================================
// ANNULER UNE COURSE
// ======================================================

export async function cancelRide(
  rideId
) {

  try {

    if (!rideId) {
      throw new Error(
        "rideId manquant"
      );
    }

    const rideRef = doc(
      db,
      "rides",
      rideId
    );

    const rideSnap = await getDoc(
      rideRef
    );

    if (!rideSnap.exists()) {

      throw new Error(
        "Course introuvable"
      );

    }

    const ride =
      rideSnap.data();


    // ==================================================
    // STATUTS AUTORISÉS POUR L'ANNULATION
    // ==================================================

    const allowedStatuses = [

      "searching",

      "accepted",

      "driver_arriving",

      "arrived",

    ];


    if (
      !allowedStatuses.includes(
        ride.status
      )
    ) {

      throw new Error(
        `Impossible d'annuler une course au statut : ${ride.status}`
      );

    }


    // ==================================================
    // RÉCUPÉRER LES DEMANDES EN ATTENTE
    // ==================================================

    const requestQuery =
      query(

        collection(
          db,
          "ride_requests"
        ),

        where(
          "rideId",
          "==",
          rideId
        ),

        where(
          "status",
          "==",
          "pending"
        )

      );


    const requestSnapshot =
      await getDocs(
        requestQuery
      );


    // ==================================================
    // ANNULER TOUTES LES DEMANDES
    // ==================================================

    if (
      !requestSnapshot.empty
    ) {

      for (
        const requestDoc
        of requestSnapshot.docs
      ) {

        // --------------------------------
        // Arrêter le timer
        // --------------------------------

        stopRideRequestTimer(
          requestDoc.id
        );


        // --------------------------------
        // Annuler la demande
        // --------------------------------

        await updateDoc(
          requestDoc.ref,
          {

            status:
              "cancelled",

            cancelledAt:
              serverTimestamp(),

          }
        );


        console.log(
          "🛑 Demande annulée :",
          requestDoc.id
        );

      }

    }


    // ==================================================
    // DÉTERMINER L'ÉTAPE D'ANNULATION
    // ==================================================

    const cancelStage =
      ride.status ===
      "searching"

        ? "search"

        : "before_trip";


    // ==================================================
    // ANNULER LA COURSE
    // ==================================================

    await updateDoc(
      rideRef,
      {

        status:
          "cancelled",

        cancelledBy:
          "passenger",

        cancelStage,

        cancelledAt:
          serverTimestamp(),

      }
    );


    // ==================================================
    // LIBÉRER LE CONDUCTEUR
    // ==================================================

    if (
      ride.driverId
    ) {

      await setDriverAvailable(
        ride.driverId
      );

    }


    console.log(
      "❌ Course annulée par le passager"
    );

  } catch (error) {

    console.error(
      "❌ cancelRide :",
      error
    );

    throw error;

  }

}