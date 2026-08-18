import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase/config";

import { findAvailableDrivers } from "./matching/driverSelectionService";
import { markRideAsSearchFailed } from "./rideService";

// ======================================================
// Empêche deux appels simultanés pour la même course
// ======================================================

const processingRides = new Set();

// ======================================================
// Envoie la course au prochain conducteur réellement
// disponible et qui n'a PAS encore été contacté.
// ======================================================

export async function sendRideToNextDriver({
  rideId,
  passenger,
  attemptedDrivers = [],
}) {
  console.log(
    "🚨 sendRideToNextDriver appelée",
    rideId,
    attemptedDrivers
  );

  // ====================================================
  // PROTECTION CONTRE DEUX APPELS SIMULTANÉS
  // ====================================================

  if (processingRides.has(rideId)) {
    console.log(
      "⛔ Matching déjà en cours pour cette course :",
      rideId
    );

    return null;
  }

  processingRides.add(rideId);

  try {
    // ==================================================
    // 1. RÉCUPÉRER LA COURSE
    // ==================================================

    const rideRef = doc(db, "rides", rideId);

    const rideSnap = await getDoc(rideRef);

    if (!rideSnap.exists()) {
      console.log("❌ Course introuvable.");
      return null;
    }

    const ride = rideSnap.data();

    // ==================================================
    // 2. VÉRIFIER QUE LA RECHERCHE EST TOUJOURS ACTIVE
    // ==================================================

    if (ride.status !== "searching") {
      console.log(
        "⛔ Recherche arrêtée :",
        ride.status
      );

      return null;
    }

    // ==================================================
    // 3. CONDUCTEURS RÉELLEMENT CONTACTÉS
    //
    // IMPORTANT :
    // On utilise contactedDrivers comme source de vérité.
    // ==================================================

    const contactedDrivers =
      Array.isArray(ride.contactedDrivers)
        ? ride.contactedDrivers
        : [];

    const contactedDriverIds =
      contactedDrivers
        .map((driver) => driver?.id)
        .filter(Boolean);

    console.log(
      "📞 Conducteurs réellement contactés :",
      contactedDriverIds
    );

    console.log(
      "📋 attemptedDrivers reçu :",
      attemptedDrivers
    );

    // ==================================================
    // 4. CHERCHER TOUS LES CONDUCTEURS DISPONIBLES
    // ==================================================

    const drivers = await findAvailableDrivers(
      passenger.location,
      passenger.vehicleType
    );

    console.log(
      "🚗 Conducteurs trouvés :",
      drivers.length
    );

    if (!drivers.length) {
      console.log(
        "❌ Aucun conducteur disponible."
      );

      await markRideAsSearchFailed(
        rideId,
        "no_driver_answer"
      );

      return null;
    }

    // ==================================================
    // 5. TROUVER LE PROCHAIN CONDUCTEUR
    //
    // On ignore les conducteurs déjà réellement contactés.
    //
    // Exemple :
    //
    // Van Moto       → déjà contacté
    // Oumar wolo     → PAS contacté
    // Homo Moto      → PAS contacté
    // Vieux Moto     → PAS contacté
    //
    // Le résultat sera donc Oumar wolo.
    // ==================================================

    const nextDriver = drivers.find(
      (driver) =>
        !contactedDriverIds.includes(driver.id)
    );

    if (!nextDriver) {
      console.log(
        "❌ Aucun conducteur suivant disponible."
      );

      console.log(
        "📞 Conducteurs déjà contactés :",
        contactedDriverIds
      );

      await markRideAsSearchFailed(
        rideId,
        "no_driver_answer"
      );

      return null;
    }

    console.log(
      "🎯 PROCHAIN CONDUCTEUR SÉLECTIONNÉ :",
      nextDriver.name
    );

    console.log(
      "🆔 ID :",
      nextDriver.id
    );

    console.log(
      "📏 Distance :",
      nextDriver.distance,
      "m"
    );

    // ==================================================
    // 6. CONSTRUIRE LE NOUVEL HISTORIQUE
    //
    // On ajoute UNIQUEMENT le conducteur qui vient
    // réellement d'être contacté.
    // ==================================================

    const updatedContactedDrivers = [
      ...contactedDrivers,
      {
        id: nextDriver.id,
        name: nextDriver.name,

        latitude:
          nextDriver.latitude ?? null,

        longitude:
          nextDriver.longitude ?? null,

        vehicleType:
          nextDriver.vehicleType ?? null,

        distance:
          nextDriver.distance ?? null,
      },
    ];

    // ==================================================
    // 7. attemptedDrivers
    //
    // On le conserve pour compatibilité avec le reste
    // du projet, mais on ne l'utilise PLUS pour choisir
    // le prochain conducteur.
    // ==================================================

    const newAttemptedDrivers = [
      ...new Set([
        ...attemptedDrivers,
        ...contactedDriverIds,
        nextDriver.id,
      ]),
    ];

    console.log(
      "📋 Nouvel attemptedDrivers :",
      newAttemptedDrivers
    );

    console.log(
      "📞 Nouvel contactedDrivers :",
      updatedContactedDrivers
    );

    // ==================================================
    // 8. CRÉER UNE NOUVELLE DEMANDE
    // ==================================================

    const requestRef = await addDoc(
      collection(db, "ride_requests"),
      {
        rideId,

        driverId:
          nextDriver.id,

        driverName:
          nextDriver.name,

        driverVehicleType:
          nextDriver.vehicleType,

        driverDistance:
          nextDriver.distance,

        passengerId:
          passenger.userId,

        passengerName:
          passenger.name,

        passengerPhone:
          passenger.phone,

        passengerLocation:
          passenger.location,

        pickup:
          passenger.pickup,

        destination:
          passenger.destination,

        estimatedDistance:
          passenger.estimatedDistance,

        estimatedDuration:
          passenger.estimatedDuration,

        estimatedPrice:
          passenger.estimatedPrice,

        vehicleType:
          passenger.vehicleType,

        status:
          "pending",

        // Historique complet
        attemptedDrivers:
          newAttemptedDrivers,

        createdAt:
          serverTimestamp(),
      }
    );

    // ==================================================
    // 9. METTRE À JOUR LA COURSE
    // ==================================================

    await updateDoc(
      rideRef,
      {
        // Historique technique
        attemptedDrivers:
          newAttemptedDrivers,

        // Conducteurs réellement contactés
        contactedDrivers:
          updatedContactedDrivers,

        // Demande actuellement active
        currentSearchingRequestId:
          requestRef.id,

        // Conducteur actuellement recherché
        currentSearchingDriverId:
          nextDriver.id,

        currentSearchingDriverName:
          nextDriver.name,

        currentSearchingDriverLocation: {
          latitude:
            nextDriver.latitude ?? null,

          longitude:
            nextDriver.longitude ?? null,
        },

        currentSearchingDriverDistance:
          nextDriver.distance ?? null,

        currentSearchingDriverVehicleType:
          nextDriver.vehicleType ?? null,
      }
    );

    // ==================================================
    // 10. LOGS
    // ==================================================

    console.log(
      "======================================"
    );

    console.log(
      "✅ NOUVEAU CONDUCTEUR SÉLECTIONNÉ"
    );

    console.log(
      "👤 Conducteur :",
      nextDriver.name
    );

    console.log(
      "🆔 Driver ID :",
      nextDriver.id
    );

    console.log(
      "🆔 Request ID :",
      requestRef.id
    );

    console.log(
      "📋 attemptedDrivers :",
      newAttemptedDrivers
    );

    console.log(
      "📞 contactedDrivers :",
      updatedContactedDrivers
    );

    console.log(
      "📌 currentSearchingRequestId :",
      requestRef.id
    );

    console.log(
      "======================================"
    );

    // ==================================================
    // 11. RETOURNER L'ID DE LA DEMANDE
    // ==================================================

    return requestRef.id;

  } catch (error) {
    console.error(
      "❌ sendRideToNextDriver :",
      error
    );

    throw error;

  } finally {
    // ==================================================
    // LIBÉRER LE VERROU
    // ==================================================

    processingRides.delete(rideId);

    console.log(
      "🔓 Matching libéré :",
      rideId
    );
  }
}