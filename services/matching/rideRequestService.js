import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { sendRideToNextDriver } from "../matchingService";

import { setDriverBusy } from "../driverService";
import { assignDriverToRide } from "./rideAssignmentService";
import {
  startRideRequestTimer,
  stopRideRequestTimer,
} from "../rideRequestManager";
/**
 * Crée une nouvelle demande de course.
 */
export async function createRideRequest({
  rideId,
  passenger,
  driverId,
  attemptedDrivers = [],
}) {
  const requestRef = await addDoc(
    collection(db, "ride_requests"),
    {
      rideId,

      passengerId: passenger.userId,
      passengerName: passenger.name,
      passengerPhone: passenger.phone,

      driverId,

      status: "pending",

      attemptedDrivers,

      createdAt: serverTimestamp(),
    }
  );

  return requestRef.id;
}

/**
 * Accepter une demande.
 */
export async function rejectRideRequest(
  requestId
) {
  const requestRef = doc(
    db,
    "ride_requests",
    requestId
  );

  const requestSnap =
    await getDoc(requestRef);

  if (!requestSnap.exists()) {
    throw new Error(
      "Ride request introuvable"
    );
  }

  const request =
    requestSnap.data();

  const rideRef = doc(
    db,
    "rides",
    request.rideId
  );

  const rideSnap =
    await getDoc(rideRef);

  if (!rideSnap.exists()) {
    throw new Error(
      "Course introuvable"
    );
  }

  const ride =
    rideSnap.data();

  if (ride.status !== "searching") {
    throw new Error(
      "Cette course a déjà été acceptée."
    );
  }

  // ==================================================
  // 1. ARRÊTER LE TIMER DU CONDUCTEUR QUI REFUSE
  // ==================================================

  stopRideRequestTimer(requestId);

  console.log(
    "🛑 Timer arrêté après refus :",
    requestId
  );

  // ==================================================
  // 2. MARQUER LA DEMANDE COMME REFUSÉE
  // ==================================================

  await updateDoc(
    requestRef,
    {
      status: "rejected",
      rejectedAt:
        serverTimestamp(),
    }
  );

  // ==================================================
  // 3. CHERCHER LE CONDUCTEUR SUIVANT
  // ==================================================

  const nextRequestId =
    await sendRideToNextDriver({
      rideId: request.rideId,

      passenger: {
        userId:
          request.passengerId,

        name:
          request.passengerName,

        phone:
          request.passengerPhone,

        location:
          request.passengerLocation,

        pickup:
          request.pickup,

        destination:
          request.destination,

        estimatedDistance:
          request.estimatedDistance,

        estimatedDuration:
          request.estimatedDuration,

        estimatedPrice:
          request.estimatedPrice,

        vehicleType:
          request.vehicleType,
      },

      attemptedDrivers:
        request.attemptedDrivers || [],
    });

  // ==================================================
  // 4. DÉMARRER LE TIMER DU NOUVEAU CONDUCTEUR
  // ==================================================

  if (nextRequestId) {
    console.log(
      "✅ Conducteur suivant contacté :",
      nextRequestId
    );

    console.log(
      "⏱️ Démarrage timer :",
      nextRequestId
    );

    await startRideRequestTimer(
      nextRequestId
    );
  } else {
    console.log(
      "❌ Aucun conducteur suivant."
    );
  }

  console.log(
    "====================================="
  );

  console.log(
    "❌ COURSE REFUSÉE"
  );

  console.log(
    "Course :",
    request.rideId
  );

  console.log(
    "Conducteur :",
    request.driverId
  );

  console.log(
    "====================================="
  );
}

/**
 * Refuser une demande.
 */


/**
 * Demande expirée.
 */
export async function timeoutRideRequest(requestId) {
  await updateDoc(
    doc(db, "ride_requests", requestId),
    {
      status: "timeout",
      timeoutAt: serverTimestamp(),
    }
  );
}