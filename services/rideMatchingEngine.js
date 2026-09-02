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
// Empêche deux matching simultanés pour la même course
// ======================================================

const processingRides = new Set();

// ======================================================
// Contacte TOUS les conducteurs disponibles simultanément
// ======================================================

export async function sendRideToAllDrivers({
  rideId,
  passenger,
}) {
  console.log(
    "🚨 sendRideToAllDrivers appelée",
    rideId
  );

  // ====================================================
  // Protection contre les appels simultanés
  // ====================================================

  if (processingRides.has(rideId)) {
    console.log(
      "⛔ Matching déjà en cours :",
      rideId
    );

    return [];
  }

  processingRides.add(rideId);

  try {
    // ==================================================
    // 1. Récupérer la course
    // ==================================================

    const rideRef = doc(
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

      return [];
    }

    const ride =
      rideSnap.data();

    // ==================================================
    // 2. Vérifier que la recherche est active
    // ==================================================

    if (
      ride.status !== "searching"
    ) {
      console.log(
        "⛔ Recherche non active :",
        ride.status
      );

      return [];
    }

    // ==================================================
    // 3. Chercher les conducteurs disponibles
    // ==================================================

    const drivers =
      await findAvailableDrivers(
        passenger.location,
        passenger.vehicleType
      );

    console.log(
      "🚗 Conducteurs disponibles :",
      drivers.length
    );

    if (!drivers.length) {
      console.log(
        "❌ Aucun conducteur disponible."
      );

      await markRideAsSearchFailed(
        rideId,
        "no_driver_available"
      );

      return [];
    }

    // ==================================================
    // 4. Éviter les conducteurs déjà contactés
    // ==================================================

    const alreadyContacted =
      Array.isArray(ride.contactedDrivers)
        ? ride.contactedDrivers
        : [];

    const alreadyContactedIds =
      alreadyContacted
        .map((driver) => driver?.id)
        .filter(Boolean);

    const availableDrivers =
      drivers.filter(
        (driver) =>
          !alreadyContactedIds.includes(
            driver.id
          )
      );

    console.log(
      "🎯 Nouveaux conducteurs à contacter :",
      availableDrivers.length
    );

    if (!availableDrivers.length) {
      console.log(
        "❌ Tous les conducteurs ont déjà été contactés."
      );

      await markRideAsSearchFailed(
        rideId,
        "no_driver_answer"
      );

      return [];
    }

    // ==================================================
    // 5. Créer les demandes SIMULTANÉMENT
    // ==================================================

    const requestResults =
      await Promise.all(
        availableDrivers.map(
          async (driver) => {

            console.log(
              "📤 Envoi demande à :",
              driver.name,
              driver.id
            );

            const requestRef =
              await addDoc(
                collection(
                  db,
                  "ride_requests"
                ),
                {
                  rideId,

                  driverId:
                    driver.id,

                  driverName:
                    driver.name,

                  driverVehicleType:
                    driver.vehicleType,

                  driverDistance:
                    driver.distance,

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

                  // Ce conducteur a reçu la demande
                  attemptedDrivers: [
                    driver.id,
                  ],

                  createdAt:
                    serverTimestamp(),
                }
              );

            return {
              requestId:
                requestRef.id,

              driver,
            };
          }
        )
      );

    // ==================================================
    // 6. Construire l'historique
    // ==================================================

    const newContactedDrivers =
      requestResults.map(
        ({ driver }) => ({
          id:
            driver.id,

          name:
            driver.name,

          latitude:
            driver.latitude ?? null,

          longitude:
            driver.longitude ?? null,

          vehicleType:
            driver.vehicleType ?? null,

          distance:
            driver.distance ?? null,
        })
      );

    const allContactedDrivers = [
      ...alreadyContacted,
      ...newContactedDrivers,
    ];

    const allAttemptedDrivers = [
      ...new Set(
        allContactedDrivers
          .map(
            (driver) =>
              driver?.id
          )
          .filter(Boolean)
      ),
    ];

    // ==================================================
    // 7. Mettre à jour la course
    // ==================================================

    await updateDoc(
      rideRef,
      {
        attemptedDrivers:
          allAttemptedDrivers,

        contactedDrivers:
          allContactedDrivers,

        // Plusieurs demandes sont actives.
        // On n'utilise donc plus
        // currentSearchingRequestId
        // pour identifier une seule demande.

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

        searchStartedAt:
          serverTimestamp(),
      }
    );

    // ==================================================
    // 8. Logs
    // ==================================================

    console.log(
      "======================================"
    );

    console.log(
      "✅ DEMANDES ENVOYÉES SIMULTANÉMENT"
    );

    console.log(
      "🚗 Nombre de conducteurs :",
      requestResults.length
    );

    requestResults.forEach(
      ({ requestId, driver }, index) => {

        console.log(
          `${index + 1}. ${driver.name} - ${driver.distance} m`
        );

        console.log(
          "   Driver ID :",
          driver.id
        );

        console.log(
          "   Request ID :",
          requestId
        );
      }
    );

    console.log(
      "📞 Conducteurs contactés :",
      allAttemptedDrivers
    );

    console.log(
      "⏱️ Timeout global : 30 secondes"
    );

    console.log(
      "======================================"
    );

    return requestResults.map(
      (item) => item.requestId
    );

  } catch (error) {

    console.error(
      "❌ sendRideToAllDrivers :",
      error
    );

    throw error;

  } finally {

    processingRides.delete(
      rideId
    );

    console.log(
      "🔓 Matching libéré :",
      rideId
    );
  }
}