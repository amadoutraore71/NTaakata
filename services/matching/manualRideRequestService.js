import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../firebase/config";
import { startRideRequestTimer } from "../rideRequestManager";

export async function sendRideRequestToDriver({
  ride,
  driver,
}) {
  try {

    // Remettre la course en recherche
    await updateDoc(doc(db, "rides", ride.id), {
      status: "searching",

      driverId: null,
      driverName: null,
      driverPhone: null,

      failureReason: null,
      searchEndedAt: null,
    });

    // Créer une nouvelle demande
    const requestRef = await addDoc(
      collection(db, "ride_requests"),
      {
        rideId: ride.id,

        driverId: driver.id,

        passengerId: ride.passengerId,
        passengerName: ride.passengerName,
        passengerPhone: ride.passengerPhone,

        passengerLocation: ride.pickup,

        pickup: ride.pickup,
        destination: ride.destination,

        estimatedDistance: ride.estimatedDistance,
        estimatedDuration: ride.estimatedDuration,
        estimatedPrice: ride.estimatedPrice,

        status: "pending",

        attemptedDrivers: [driver.id],

        createdAt: serverTimestamp(),
      }
    );

   await startRideRequestTimer({
    requestId: requestRef.id,
    rideId,
    passenger,
});

    console.log("✅ Nouvelle demande envoyée :", driver.name);

  } catch (error) {
    console.log(error);
  }
}