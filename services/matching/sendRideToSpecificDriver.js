import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../firebase/config";
import { startRideRequestTimer } from "../rideRequestManager";

export async function sendRideToSpecificDriver({
  ride,
  passenger,
  driver,
}) {
  try {
    // Réinitialiser la course
    await updateDoc(doc(db, "rides", ride.id), {
      status: "searching",

      driverId: null,
      driverName: null,
      driverPhone: null,
      driverVehicleType: null,
      driverDistance: null,

      acceptedAt: null,
      driverArrivingAt: null,
      arrivedAt: null,
      startedAt: null,

      failureReason: null,
      searchEndedAt: null,
    });

    // Création de la demande
    const requestRef = await addDoc(
      collection(db, "ride_requests"),
      {
        rideId: ride.id,

        driverId: driver.userId,

        passengerId: passenger.userId,
        passengerName: passenger.name,
        passengerPhone: passenger.phone,

        passengerLocation: ride.pickup,

        pickup: ride.pickup,
        destination: ride.destination,

        estimatedDistance: ride.estimatedDistance,
        estimatedDuration: ride.estimatedDuration,
        estimatedPrice: ride.estimatedPrice,

        attemptedDrivers: [driver.userId],

        status: "pending",

        createdAt: serverTimestamp(),
      }
    );

    // ✅ Correction
    await startRideRequestTimer({
      requestId: requestRef.id,
      rideId: ride.id,
      passenger,
    });

    console.log(
      "🚕 Nouvelle demande envoyée à",
      driver.name
    );

    return requestRef.id;
  } catch (error) {
    console.error("❌ sendRideToSpecificDriver :", error);
    throw error;
  }
}