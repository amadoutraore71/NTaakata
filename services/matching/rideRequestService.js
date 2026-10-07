import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "../../firebase/config";
import { stopRideSearchTimer } from "../rideRequestManager";

// ======================================================
// CRÉER UNE DEMANDE POUR UN CONDUCTEUR
// ======================================================

export async function createRideRequest({
  rideId,
  passenger,
  driver,
}) {
  console.log(
    "📩 Création demande conducteur :",
    driver.name
  );

  try {
    const requestRef = await addDoc(
      collection(db, "ride_requests"),
      {
        // ==========================
        // COURSE
        // ==========================

        rideId,

        // ==========================
        // CONDUCTEUR
        // ==========================

        driverId: driver.id,

        driverName:
          driver.name ?? null,

        driverVehicleType:
          driver.vehicleType ?? null,

        driverDistance:
          driver.distance ?? null,

        driverLatitude:
          driver.latitude ?? null,

        driverLongitude:
          driver.longitude ?? null,

        driverPhone:
          driver.phone ?? null,

        // ==========================
        // PASSAGER
        // ==========================

        passengerId:
          passenger.userId,

        passengerName:
          passenger.name ?? null,

        passengerPhone:
          passenger.phone ?? null,

        passengerLocation:
          passenger.location ?? null,

        pickup:
          passenger.pickup ?? null,

        destination:
          passenger.destination ?? null,

        // ==========================
        // COURSE
        // ==========================

        estimatedDistance:
          passenger.estimatedDistance ?? null,

        estimatedDuration:
          passenger.estimatedDuration ?? null,

        estimatedPrice:
          passenger.estimatedPrice ?? null,

        vehicleType:
          passenger.vehicleType ?? null,

        // ==========================
        // MATCHING
        // ==========================

        searchMode:
          "broadcast",

        status:
          "pending",

        // ==========================
        // DATES
        // ==========================

        createdAt:
          serverTimestamp(),

        acceptedAt:
          null,

        timeoutAt:
          null,

        respondedAt:
          null,

        cancelledAt:
          null,
      }
    );

    console.log(
      "✅ Demande créée :",
      requestRef.id,
      "→",
      driver.name
    );

    return requestRef.id;

  } catch (error) {

    console.error(
      "❌ createRideRequest :",
      error
    );

    throw error;
  }
}


// ======================================================
// RÉCUPÉRER UNE DEMANDE
// ======================================================

export async function getRideRequest(
  requestId
) {
  try {

    const requestRef =
      doc(
        db,
        "ride_requests",
        requestId
      );

    const requestSnap =
      await getDoc(requestRef);

    if (!requestSnap.exists()) {

      console.log(
        "❌ Demande introuvable :",
        requestId
      );

      return null;
    }

    return {
      id: requestSnap.id,
      ...requestSnap.data(),
    };

  } catch (error) {

    console.error(
      "❌ getRideRequest :",
      error
    );

    throw error;
  }
}


// ======================================================
// ACCEPTER UNE DEMANDE
// ======================================================
//
// Lorsqu'une demande est acceptée :
//
// 1. La demande passe à "accepted"
// 2. Le conducteur est affecté à la course
// 3. La course passe à "driver_assigned"
// 4. Les autres demandes pending sont annulées
// 5. Le timer de recherche est arrêté
//
// ======================================================

export async function acceptRideRequest(
  requestId
) {
  try {
    console.log("🔄 Acceptation demande :", requestId);

    const result = await runTransaction(db, async (transaction) => {
      // ==================================================
      // 1. RÉFÉRENCE DE LA DEMANDE
      // ==================================================
      const requestRef = doc(
        db,
        "ride_requests",
        requestId
      );

      const requestSnap = await transaction.get(requestRef);

      if (!requestSnap.exists()) {
        throw new Error("Demande de course introuvable.");
      }

      const request = requestSnap.data();

      // ==================================================
      // 2. LA DEMANDE DOIT ÊTRE PENDING
      // ==================================================
      if (request.status !== "pending") {
        console.log(
          "⚠️ Demande déjà traitée :",
          request.status
        );

        return {
          success: false,
          reason: "request_already_processed",
          status: request.status,
        };
      }

      const rideId = request.rideId;
      const driverId = request.driverId;

      if (!rideId) {
        throw new Error("rideId absent de la demande.");
      }

      if (!driverId) {
        throw new Error("driverId absent de la demande.");
      }

      // ==================================================
      // 3. RÉFÉRENCES COURSE + CONDUCTEUR
      // ==================================================
      const rideRef = doc(db, "rides", rideId);
      const driverRef = doc(db, "users", driverId);

      const rideSnap = await transaction.get(rideRef);
      const driverSnap = await transaction.get(driverRef);

      if (!rideSnap.exists()) {
        throw new Error("Course introuvable.");
      }

      if (!driverSnap.exists()) {
        throw new Error("Conducteur introuvable.");
      }

      const ride = rideSnap.data();
      const driver = driverSnap.data();

      // ==================================================
      // 4. LA COURSE DOIT ENCORE ÊTRE EN RECHERCHE
      // ==================================================
      if (
        ride.status !== "searching" &&
        ride.status !== "pending"
      ) {
        console.log(
          "⚠️ Course déjà traitée :",
          ride.status
        );

        return {
          success: false,
          reason: "ride_already_processed",
          status: ride.status,
        };
      }

      // ==================================================
      // 5. LE CONDUCTEUR DOIT ÊTRE DISPONIBLE
      // ==================================================
      if (driver.isOnline !== true) {
        throw new Error(
          "Le conducteur est hors ligne."
        );
      }

      if (
        driver.availability &&
        driver.availability !== "available"
      ) {
        throw new Error(
          "Le conducteur n'est plus disponible."
        );
      }

      if (
        driver.currentRideId !== null &&
        driver.currentRideId !== undefined
      ) {
        throw new Error(
          "Le conducteur a déjà une course en cours."
        );
      }

      // ==================================================
      // 6. INFORMATIONS DU CONDUCTEUR
      // ==================================================
      const driverData = {
        driverId,
        driverName:
          request.driverName ?? driver.name ?? null,
        driverPhone:
          request.driverPhone ?? driver.phone ?? null,
        driverVehicleType:
          request.driverVehicleType ??
          request.vehicleType ??
          driver.vehicleType ??
          null,
        driverLatitude:
          request.driverLatitude ??
          driver.latitude ??
          null,
        driverLongitude:
          request.driverLongitude ??
          driver.longitude ??
          null,
        driverDistance:
          request.driverDistance ?? null,
      };

      console.log(
        "🚕 Conducteur sélectionné :",
        driverData
      );

      // ==================================================
      // 7. ACCEPTATION ATOMIQUE
      // ==================================================
      transaction.update(requestRef, {
        status: "accepted",
        acceptedAt: serverTimestamp(),
        respondedAt: serverTimestamp(),
      });

      transaction.update(rideRef, {
        driverId: driverData.driverId,
        driverName: driverData.driverName,
        driverPhone: driverData.driverPhone,
        driverVehicleType: driverData.driverVehicleType,
        driverLatitude: driverData.driverLatitude,
        driverLongitude: driverData.driverLongitude,
        driverDistance: driverData.driverDistance,
        acceptedRequestId: requestId,
        acceptedAt: serverTimestamp(),
        status: "driver_assigned",
        searchEndedAt: serverTimestamp(),
        currentSearchingDriverId: null,
        currentSearchingDriverName: null,
        currentSearchingDriverDistance: null,
      });

      // ==================================================
      // 8. LE CONDUCTEUR DEVIENT OCCUPÉ
      // ==================================================
      transaction.update(driverRef, {
        availability: "busy",
        currentRideId: rideId,
      });

      return {
        success: true,
        rideId,
        requestId,
        driver: driverData,
        status: "driver_assigned",
      };
    });

    if (!result.success) {
      return result;
    }

    console.log(
      "✅ Demande acceptée :",
      requestId
    );

    // ==================================================
    // 9. ANNULER LES AUTRES DEMANDES DU CONDUCTEUR
    // ==================================================
    // Le conducteur ne peut accepter qu'une seule course.
    // Toutes ses autres demandes pending sont donc annulées,
    // y compris celles correspondant à d'autres courses.
    const cancelledCount =
      await cancelOtherDriverRideRequests(
        result.driver.driverId,
        requestId
      );

    console.log(
      "🧹 Autres demandes annulées :",
      cancelledCount
    );

    // ==================================================
    // 10. ARRÊTER LE TIMER DE RECHERCHE
    // ==================================================
    stopRideSearchTimer(result.rideId);

    console.log(
      "🛑 Timer de recherche arrêté :",
      result.rideId
    );

    return result;
  } catch (error) {
    console.error(
      "❌ acceptRideRequest :",
      error
    );

    throw error;
  }
}

// ======================================================
// REFUSER UNE DEMANDE
// ======================================================

export async function rejectRideRequest(
  requestId
) {
  try {

    const requestRef =
      doc(
        db,
        "ride_requests",
        requestId
      );

    const requestSnap =
      await getDoc(requestRef);

    if (!requestSnap.exists()) {

      throw new Error(
        "Demande introuvable."
      );
    }

    const request =
      requestSnap.data();

    // Ne pas modifier une demande
    // déjà traitée.

    if (
      request.status !==
      "pending"
    ) {

      console.log(
        "ℹ️ Demande déjà traitée :",
        request.status
      );

      return {
        success: false,
        status:
          request.status,
      };
    }

    await updateDoc(
      requestRef,
      {
        status:
          "rejected",

        respondedAt:
          serverTimestamp(),
      }
    );

    console.log(
      "❌ Demande refusée :",
      requestId
    );

    return {
      success: true,

      requestId,

      status:
        "rejected",
    };

  } catch (error) {

    console.error(
      "❌ rejectRideRequest :",
      error
    );

    throw error;
  }
}


// ======================================================
// EXPIRER UNE DEMANDE
// ======================================================

export async function timeoutRideRequest(
  requestId
) {
  try {

    const requestRef =
      doc(
        db,
        "ride_requests",
        requestId
      );

    const requestSnap =
      await getDoc(requestRef);

    if (!requestSnap.exists()) {
      return;
    }

    const request =
      requestSnap.data();

    // Ne pas écraser une demande
    // déjà traitée.

    if (
      request.status !==
      "pending"
    ) {

      console.log(
        "ℹ️ Demande déjà traitée :",
        request.status
      );

      return;
    }

    await updateDoc(
      requestRef,
      {
        status:
          "timeout",

        timeoutAt:
          serverTimestamp(),

        respondedAt:
          serverTimestamp(),
      }
    );

    console.log(
      "⏰ Demande expirée :",
      requestId
    );

  } catch (error) {

    console.error(
      "❌ timeoutRideRequest :",
      error
    );

    throw error;
  }
}


// ======================================================
// RÉCUPÉRER TOUTES LES DEMANDES D'UNE COURSE
// ======================================================

export async function getRideRequests(
  rideId
) {
  try {

    const q =
      query(
        collection(
          db,
          "ride_requests"
        ),
        where(
          "rideId",
          "==",
          rideId
        )
      );

    const snapshot =
      await getDocs(q);

    const requests = [];

    snapshot.forEach(
      (item) => {

        requests.push({
          id:
            item.id,

          ...item.data(),
        });

      }
    );

    console.log(
      "📋 Demandes de la course :",
      requests.length
    );

    return requests;

  } catch (error) {

    console.error(
      "❌ getRideRequests :",
      error
    );

    throw error;
  }
}


// ======================================================
// ANNULER LES AUTRES DEMANDES
// ======================================================

export async function cancelOtherRideRequests(
  rideId,
  acceptedRequestId
) {
  try {

    const requests =
      await getRideRequests(
        rideId
      );

    const otherRequests =
      requests.filter(
        (request) =>
          request.id !==
            acceptedRequestId &&
          request.status ===
            "pending"
      );

    const updates =
      otherRequests.map(
        (request) =>
          updateDoc(
            doc(
              db,
              "ride_requests",
              request.id
            ),
            {
              status:
                "cancelled",

              cancelledAt:
                serverTimestamp(),

              respondedAt:
                serverTimestamp(),
            }
          )
      );

    await Promise.all(
      updates
    );

    console.log(
      "🧹 Autres demandes annulées :",
      otherRequests.length
    );

    return otherRequests.length;

  } catch (error) {

    console.error(
      "❌ cancelOtherRideRequests :",
      error
    );

    throw error;
  }
}

// ======================================================
// ANNULER LES AUTRES DEMANDES PENDING DU CONDUCTEUR
// ======================================================
export async function cancelOtherDriverRideRequests(
  driverId,
  acceptedRequestId
) {
  try {
    if (!driverId) return 0;

    const q = query(
      collection(db, "ride_requests"),
      where("driverId", "==", driverId),
      where("status", "==", "pending")
    );

    const snapshot = await getDocs(q);

    const otherRequests = snapshot.docs.filter(
      (item) => item.id !== acceptedRequestId
    );

    if (otherRequests.length === 0) {
      console.log(
        "🟢 Aucune autre demande pending pour le conducteur"
      );
      return 0;
    }

    const batch = writeBatch(db);

    otherRequests.forEach((item) => {
      batch.update(
        doc(db, "ride_requests", item.id),
        {
          status: "cancelled",
          cancelledAt: serverTimestamp(),
          respondedAt: serverTimestamp(),
        }
      );
    });

    await batch.commit();

    console.log(
      "🧹 Autres demandes du conducteur annulées :",
      otherRequests.length
    );

    return otherRequests.length;
  } catch (error) {
    console.error(
      "❌ cancelOtherDriverRideRequests :",
      error
    );
    throw error;
  }
}

