import {
    addDoc,
    collection,
    doc,
    serverTimestamp,
    updateDoc
} from "firebase/firestore";
import { db } from "../firebase/config";
import { startRideRequestTimer } from "./rideRequestManager";
export async function sendRideRequest({
  rideId,
  passenger,
  driver,
}) {
  console.log("🔥🔥🔥 sendRideRequest appelée");

  if (!driver) {
    throw new Error("Aucun conducteur fourni.");
  }

  // ==============================
  // 1. Créer la demande conducteur
  // ==============================

  const requestRef = await addDoc(
    collection(db, "ride_requests"),
    {
      rideId,

      driverId: driver.id,
      driverName: driver.name,
      driverVehicleType: driver.vehicleType,
      driverDistance: driver.distance,

      passengerId: passenger.userId,
      passengerName: passenger.name,
      passengerPhone: passenger.phone,

      passengerLocation: passenger.location,

      pickup: passenger.pickup,
      destination: passenger.destination,

      estimatedDistance: passenger.estimatedDistance,
      estimatedDuration: passenger.estimatedDuration,
      estimatedPrice: passenger.estimatedPrice,

      vehicleType: passenger.vehicleType,

      status: "pending",

      attemptedDrivers: [driver.id],

      createdAt: serverTimestamp(),
    }
  );

  // ==========================================
  // 2. Enregistrer le premier conducteur
  //    dans l'historique des conducteurs contactés
  // ==========================================

 await updateDoc(
  doc(db, "rides", rideId),
  {
    // ==================================
    // Historique des conducteurs contactés
    // ==================================

    attemptedDrivers: [driver.id],

    contactedDrivers: [
      {
        id: driver.id,
        name: driver.name,
        latitude: driver.latitude ?? null,
        longitude: driver.longitude ?? null,
        vehicleType: driver.vehicleType ?? null,
        distance: driver.distance ?? null,
      },
    ],

    // ==================================
    // 🔴 DEMANDE ACTUELLEMENT ACTIVE
    // ==================================

    currentSearchingRequestId: requestRef.id,

    // ==================================
    // Conducteur actuellement recherché
    // ==================================

    currentSearchingDriverId: driver.id,

    currentSearchingDriverName:
      driver.name,

    currentSearchingDriverLocation: {
      latitude: driver.latitude ?? null,
      longitude: driver.longitude ?? null,
    },

    currentSearchingDriverDistance:
      driver.distance ?? null,

    currentSearchingDriverVehicleType:
      driver.vehicleType ?? null,
  }
);

  console.log(
    "📌 Premier conducteur enregistré :",
    driver.name
  );

  console.log(
    "📌 ID :",
    driver.id
  );

  console.log(
    "📌 Position :",
    driver.latitude,
    driver.longitude
  );

  console.log(
    "📌 contactedDrivers :",
    [
      {
        id: driver.id,
        name: driver.name,
        latitude: driver.latitude ?? null,
        longitude: driver.longitude ?? null,
        vehicleType: driver.vehicleType ?? null,
        distance: driver.distance ?? null,
      },
    ]
  );

  // ==============================
  // 3. Lancer le timer
  // ==============================

  console.log(
    "🚀 Lancement du timer :",
    requestRef.id
  );

  await startRideRequestTimer(requestRef.id);

  console.log("✅ Timer lancé");

  return requestRef.id;
}
