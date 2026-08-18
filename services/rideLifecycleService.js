import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
    setDriverAvailable,
    setDriverBusy,
} from "./driverService";
import { stopRideRequestTimer } from "./rideRequestManager";

/**
 * Le conducteur est en route vers le passager.
 */
export async function driverArriving(rideId) {
    try {
        await updateDoc(doc(db, "rides", rideId), {
            status: "driver_arriving",
            driverArrivingAt: serverTimestamp(),
        });

        console.log("🚕 Conducteur en route vers le passager");
    } catch (error) {
        console.error(error);
        throw error;
    }
}

/**
 * Le conducteur est arrivé.
 */
export async function driverArrived(rideId) {
    try {
        await updateDoc(doc(db, "rides", rideId), {
            status: "arrived",
            arrivedAt: serverTimestamp(),
        });

        console.log("📍 Conducteur arrivé");
    } catch (error) {
        console.error(error);
        throw error;
    }
}

/**
 * Début de la course.
 */
export async function startRide(rideId) {
    try {
        const rideRef = doc(db, "rides", rideId);
        const rideSnap = await getDoc(rideRef);

        if (!rideSnap.exists()) {
            throw new Error("Course introuvable");
        }

        const ride = rideSnap.data();

        await updateDoc(rideRef, {
            status: "started",
            startedAt: serverTimestamp(),
        });

        if (ride.driverId) {
            await setDriverBusy(ride.driverId);
        }

        console.log("▶️ Course démarrée");
    } catch (error) {
        console.error(error);
        throw error;
    }
}

/**
 * Fin de la course.
 */
export async function completeRide(rideId) {
    try {
        const rideRef = doc(db, "rides", rideId);
        const rideSnap = await getDoc(rideRef);

        if (!rideSnap.exists()) {
            throw new Error("Course introuvable");
        }

        const ride = rideSnap.data();

        await updateDoc(rideRef, {
            status: "completed",
            completedAt: serverTimestamp(),
        });

        if (ride.driverId) {
            await setDriverAvailable(ride.driverId);
        }

        console.log("🏁 Course terminée");
    } catch (error) {
        console.error(error);
        throw error;
    }
}

/**
 * Annulation d'une course par le passager.
 */
export async function cancelRide(rideId) {
    try {
        const rideRef = doc(db, "rides", rideId);
        const rideSnap = await getDoc(rideRef);

        if (!rideSnap.exists()) {
            throw new Error("Course introuvable");
        }

        const ride = rideSnap.data();
const allowedStatuses = [
    "searching",
    "driver_arriving",
    "arrived",
];

if (!allowedStatuses.includes(ride.status)) {
    throw new Error(
        `Impossible d'annuler une course au statut : ${ride.status}`
    );
}
// Arrêter la demande en attente s'il y en a une
const requestQuery = query(
    collection(db, "ride_requests"),
    where("rideId", "==", rideId),
    where("status", "==", "pending")
);

const requestSnapshot = await getDocs(requestQuery);

if (!requestSnapshot.empty) {
    for (const requestDoc of requestSnapshot.docs) {
    stopRideRequestTimer(requestDoc.id);

    await updateDoc(requestDoc.ref, {
        status: "cancelled",
        cancelledAt: serverTimestamp(),
    });
}

console.log("🛑 Demandes conducteur annulées");

    stopRideRequestTimer(requestDoc.id);

    await updateDoc(requestDoc.ref, {
        status: "cancelled",
        cancelledAt: serverTimestamp(),
    });

    console.log("🛑 Demande conducteur annulée");
}
        await updateDoc(rideRef, {
    status: "cancelled",
    cancelledBy: "passenger",
    cancelStage:
        ride.status === "searching"
            ? "search"
            : "before_trip",
    cancelledAt: serverTimestamp(),
});

        // Libérer le conducteur s'il avait déjà accepté
        if (ride.driverId) {
            await setDriverAvailable(ride.driverId);
        }

        console.log("❌ Course annulée par le passager");
    } catch (error) {
        console.error(error);
        throw error;
    }
}