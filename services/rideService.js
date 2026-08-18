import {
    addDoc,
    collection,
    doc,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";

import { db } from "../firebase/config";
import { sendRideRequest } from "./matchingService";

/**
 * Création d'une nouvelle course
 */
console.log("📂 FICHIER services/rideService chargé");

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
    console.log("pickup =", JSON.stringify(pickup, null, 2));
    console.log("destination =", JSON.stringify(destination, null, 2));
    console.log("===============================");
    const ride = {
      // ==========================
      // PASSAGER
      // ==========================
      passengerId: passenger.userId,
      passengerName: passenger.name,
      passengerPhone: passenger.phone,

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

      estimatedDistance: distance,
      estimatedDuration: duration,
      estimatedPrice: price,

      vehicleType,

      // ==========================
      // STATUT
      // ==========================
      status: "searching",

      // ==========================
      // DATES
      // ==========================
      createdAt: serverTimestamp(),

      acceptedAt: null,

      driverArrivingAt: null,
      arrivedAt: null,

      startedAt: null,

      completedAt: null,

      cancelledAt: null,

      searchEndedAt: null,

      // ==========================
      // PAIEMENT
      // ==========================
      paymentStatus: "pending",
      paymentMethod: "Espèces",

      // ==========================
      // NOTATION
      // ==========================
      ratingSubmitted: false,

      // ==========================
      // AUTRES
      // ==========================
      rideCode: null,
      failureReason: null,
    };

    const docRef = await addDoc(
      collection(db, "rides"),
      ride
    );
console.log("🔥 Avant sendRideRequest");
    await sendRideRequest({
      rideId: docRef.id,

      passenger: {
        ...passenger,

        vehicleType,

        location: pickup,

        pickup,
        destination,

        estimatedDistance: distance,
        estimatedDuration: duration,
        estimatedPrice: price,
      },

      driver,
    });
console.log("🔥 Après sendRideRequest");
    console.log("======================================");
    console.log("✅ COURSE CRÉÉE");
    console.log("Ride ID :", docRef.id);
    console.log("Passager :", passenger.name);
    console.log("Véhicule :", vehicleType);
    console.log("Prix :", price, "FCFA");
    console.log("======================================");

    return docRef.id;

  } catch (error) {
    console.error("❌ createRide :", error);
    throw error;
  }
}

/**
 * Recherche terminée :
 * - aucun conducteur trouvé
 * - ou aucun conducteur n'a répondu
 */
export async function markRideAsSearchFailed(
  rideId,
  reason = "no_driver_found"
) {
  try {
    const rideRef = doc(db, "rides", rideId);

    await updateDoc(rideRef, {
      // ==========================================
      // STATUT FINAL DE LA RECHERCHE
      // ==========================================

      status:
        reason === "no_driver_answer"
          ? "search_timeout"
          : "search_failed",

      // ==========================================
      // RAISON DE L'ÉCHEC
      // ==========================================

      failureReason: reason,

      // ==========================================
      // DATE DE FIN DE RECHERCHE
      // ==========================================

      searchEndedAt: serverTimestamp(),

      // ==========================================
      // NETTOYER LE CONDUCTEUR ACTUELLEMENT
      // RECHERCHÉ
      // ==========================================

      currentSearchingRequestId: null,

      currentSearchingDriverId: null,

      currentSearchingDriverName: null,

      currentSearchingDriverLocation: null,

      currentSearchingDriverDistance: null,

      currentSearchingDriverVehicleType: null,
    });

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
      "🧹 Conducteur actuellement recherché supprimé"
    );

    console.log(
      "🧹 currentSearchingRequestId supprimé"
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