import {
    collection,
    doc,
    getDocs,
    query,
    serverTimestamp,
    where,
    writeBatch,
} from "firebase/firestore";

import { db } from "../../firebase/config";

/**
 * Attribue définitivement une course à un conducteur.
 */
export async function assignDriverToRide({
  rideId,
  driver,
  requestId,
}) {
  try {
    const batch = writeBatch(db);

    // Mise à jour de la course
    batch.update(doc(db, "rides", rideId), {
      status: "accepted",
      driverId: driver.userId,
      driverName: driver.name,
      driverPhone: driver.phone,
      acceptedAt: serverTimestamp(),
    });

    // Marquer la demande acceptée
    batch.update(doc(db, "ride_requests", requestId), {
      status: "accepted",
      acceptedAt: serverTimestamp(),
    });

    // Récupérer toutes les demandes de cette course
    const requestsSnapshot = await getDocs(
      query(
        collection(db, "ride_requests"),
        where("rideId", "==", rideId)
      )
    );

    // Annuler uniquement les autres demandes encore actives
    requestsSnapshot.forEach((requestDoc) => {
      if (requestDoc.id === requestId) {
        return;
      }

      const request = requestDoc.data();

      if (
        ![
          "accepted",
          "rejected",
          "cancelled",
        ].includes(request.status)
      ) {
        batch.update(requestDoc.ref, {
          status: "cancelled",
          cancelledAt: serverTimestamp(),
        });
      }
    });
console.log("🚨 AVANT COMMIT ACCEPTATION");
console.log("Ride ID :", rideId);
console.log("Driver ID :", driver.userId);
console.log("Driver :", driver.name);
    await batch.commit();
    console.log("🚨 APRÈS COMMIT ACCEPTATION");
    console.log("======================================");
    console.log("✅ COURSE ATTRIBUÉE");
    console.log("Course :", rideId);
    console.log("Conducteur :", driver.name);
    console.log("======================================");

  } catch (error) {
    console.error("❌ assignDriverToRide :", error);
    throw error;
  }
}