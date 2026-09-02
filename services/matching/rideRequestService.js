import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
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

    console.log(
      "🔄 Acceptation demande :",
      requestId
    );

    // ==================================================
    // 1. RÉCUPÉRER LA DEMANDE
    // ==================================================

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
        "Demande de course introuvable."
      );
    }

    const request =
      requestSnap.data();

    // ==================================================
    // 2. VÉRIFIER QUE LA DEMANDE EST ENCORE PENDING
    // ==================================================

    if (
      request.status !==
      "pending"
    ) {

      console.log(
        "⚠️ Demande déjà traitée :",
        request.status
      );

      return {
        success: false,
        reason:
          "request_already_processed",
        status:
          request.status,
      };
    }

    // ==================================================
    // 3. RÉCUPÉRER LA COURSE
    // ==================================================

    const rideId =
      request.rideId;

    if (!rideId) {

      throw new Error(
        "rideId absent de la demande."
      );
    }

    const rideRef =
      doc(
        db,
        "rides",
        rideId
      );

    const rideSnap =
      await getDoc(rideRef);

    if (!rideSnap.exists()) {

      throw new Error(
        "Course introuvable."
      );
    }

    const ride =
      rideSnap.data();

    // ==================================================
    // 4. VÉRIFIER QUE LA COURSE EST EN RECHERCHE
    // ==================================================

    if (
      ride.status !==
        "searching" &&
      ride.status !==
        "pending"
    ) {

      console.log(
        "⚠️ Course déjà traitée :",
        ride.status
      );

      return {
        success: false,
        reason:
          "ride_already_processed",
        status:
          ride.status,
      };
    }

    // ==================================================
    // 5. INFORMATIONS DU CONDUCTEUR
    // ==================================================

    const driverData = {
      driverId:
        request.driverId ??
        null,

      driverName:
        request.driverName ??
        null,

      driverPhone:
        request.driverPhone ??
        null,

      driverVehicleType:
        request.driverVehicleType ??
        request.vehicleType ??
        null,

      driverLatitude:
        request.driverLatitude ??
        null,

      driverLongitude:
        request.driverLongitude ??
        null,

      driverDistance:
        request.driverDistance ??
        null,
    };

    console.log(
      "🚕 Conducteur sélectionné :",
      driverData
    );

    // ==================================================
    // 6. ACCEPTER LA DEMANDE
    // ==================================================

    await updateDoc(
      requestRef,
      {
        status:
          "accepted",

        acceptedAt:
          serverTimestamp(),

        respondedAt:
          serverTimestamp(),
      }
    );

    console.log(
      "✅ Demande acceptée :",
      requestId
    );

    // ==================================================
    // 7. AFFECTER LE CONDUCTEUR À LA COURSE
    // ==================================================

    await updateDoc(
      rideRef,
      {
        // ==========================
        // CONDUCTEUR
        // ==========================

        driverId:
          driverData.driverId,

        driverName:
          driverData.driverName,

        driverPhone:
          driverData.driverPhone,

        driverVehicleType:
          driverData.driverVehicleType,

        driverLatitude:
          driverData.driverLatitude,

        driverLongitude:
          driverData.driverLongitude,

        driverDistance:
          driverData.driverDistance,

        // ==========================
        // ACCEPTATION
        // ==========================

        acceptedRequestId:
          requestId,

        acceptedAt:
          serverTimestamp(),

        // ==========================
        // STATUT
        // ==========================

        status:
          "driver_assigned",

        // ==========================
        // FIN DE RECHERCHE
        // ==========================

        searchEndedAt:
          serverTimestamp(),

        currentSearchingDriverId:
          null,

        currentSearchingDriverName:
          null,

        currentSearchingDriverDistance:
          null,
      }
    );

    console.log(
      "🚕 Conducteur affecté à la course :",
      driverData.driverName
    );

    // ==================================================
    // 8. ANNULER LES AUTRES DEMANDES
    // ==================================================

    const cancelledCount =
      await cancelOtherRideRequests(
        rideId,
        requestId
      );

    console.log(
      "🧹 Autres demandes annulées :",
      cancelledCount
    );

    // ==================================================
    // 9. ARRÊTER LE TIMER DE RECHERCHE
    // ==================================================

    stopRideSearchTimer(
      rideId
    );

    console.log(
      "🛑 Timer de recherche arrêté :",
      rideId
    );

    // ==================================================
    // 10. RETOURNER LE RÉSULTAT
    // ==================================================

    return {
      success: true,

      rideId,

      requestId,

      driver:
        driverData,

      status:
        "driver_assigned",
    };

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