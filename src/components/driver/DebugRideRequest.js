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
  writeBatch,
} from "firebase/firestore";

import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { db } from "../../../firebase/config";
import {
  stopDriverMovement,
} from "../../../src/services/simulation/driverMovementService";
import { getUser } from "../../storage/userStorage";

export default function DebugRideRequest() {
  if (!__DEV__) return null;

  const simulateRideRequest = async () => {
    try {
      console.log("========================================");
      console.log("🧪 CRÉATION DEMANDE DEBUG CONDUCTEUR");

      const localDriver = await getUser();

      if (!localDriver?.userId) {
        console.log("❌ Conducteur connecté introuvable");
        Alert.alert("Erreur", "Conducteur connecté introuvable.");
        return;
      }

      console.log("🚗 Conducteur debug :", localDriver.userId);

      const driverRef = doc(db, "users", localDriver.userId);
      const driverSnapshot = await getDoc(driverRef);

      if (!driverSnapshot.exists()) {
        console.log("❌ Conducteur introuvable dans Firestore");
        Alert.alert("Erreur", "Conducteur introuvable dans Firestore.");
        return;
      }

      const driver = driverSnapshot.data();

      console.log("🔎 État conducteur :", {
        userId: driver.userId,
        name: driver.name,
        isOnline: driver.isOnline,
        availability: driver.availability,
      });

      if (driver.isOnline !== true) {
        console.log("⛔ DEMANDE DEBUG REFUSÉE : conducteur hors ligne");
        Alert.alert(
          "Conducteur hors ligne",
          "Vous devez être en ligne pour recevoir une demande de course."
        );
        return;
      }

      if (driver.availability && driver.availability !== "available") {
        console.log("⛔ DEMANDE DEBUG REFUSÉE : conducteur indisponible");
        console.log("🚗 availability =", driver.availability);

        Alert.alert(
          "Conducteur indisponible",
          "Le conducteur n'est actuellement pas disponible pour une nouvelle course."
        );
        return;
      }

      const rideRef = await addDoc(collection(db, "rides"), {
        passengerId: "DEBUG_PASSENGER",
        passengerName: "Passager Debug",
        passengerPhone: "70000000",

        driverId: null,
        driverName: null,
        driverPhone: null,

        pickup: {
          address: "Position debug du passager",
          latitude: 13.432,
          longitude: -6.263,
        },

        destination: {
          address: "API Ségou, Avenue de l'An 2000",
          latitude: 13.4322042,
          longitude: -6.2773017,
        },

        estimatedDistance: 2.2,
        estimatedDuration: 3,
        estimatedPrice: 500,

        vehicleType: driver.vehicleType ?? "moto",

        paymentMethod: "Espèces",
        paymentStatus: "pending",

        searchMode: "broadcast",
        status: "searching",

        createdAt: serverTimestamp(),
        acceptedAt: null,
        startedAt: null,
        completedAt: null,
        cancelledAt: null,
      });

      console.log("✅ Course debug créée :", rideRef.id);

      const requestRef = await addDoc(
        collection(db, "ride_requests"),
        {
          rideId: rideRef.id,

          driverId: driver.userId,
          driverName: driver.name ?? null,
          driverPhone: driver.phone ?? null,
          driverVehicleType: driver.vehicleType ?? null,
          driverLatitude: driver.latitude ?? null,
          driverLongitude: driver.longitude ?? null,

          passengerId: "DEBUG_PASSENGER",
          passengerName: "Passager Debug",
          passengerPhone: "70000000",

          passengerLocation: {
            latitude: 13.432,
            longitude: -6.263,
          },

          pickup: {
            address: "Position debug du passager",
            latitude: 13.432,
            longitude: -6.263,
          },

          destination: {
            address: "API Ségou, Avenue de l'An 2000",
            latitude: 13.4322042,
            longitude: -6.2773017,
          },

          estimatedDistance: 2.2,
          estimatedDuration: 3,
          estimatedPrice: 500,

          vehicleType: driver.vehicleType ?? "moto",

          searchMode: "broadcast",
          status: "pending",

          attemptedDrivers: [driver.userId],

          createdAt: serverTimestamp(),
          acceptedAt: null,
          timeoutAt: null,
          respondedAt: null,
          cancelledAt: null,
        }
      );

      console.log("📩 Demande debug créée :", requestRef.id);
      console.log("⏱️ Le conducteur dispose maintenant de 60 secondes.");
      console.log("========================================");
    } catch (error) {
      console.error("❌ Erreur création demande debug :", error);

      Alert.alert(
        "Erreur",
        "Impossible de créer la demande de test."
      );
    }
  };

  const resetDriverTest = async () => {
    try {
      console.log("========================================");
      console.log("🧹 RÉINITIALISATION TEST CONDUCTEUR");

      const localDriver = await getUser();

      if (!localDriver?.userId) {
        Alert.alert("Erreur", "Conducteur connecté introuvable.");
        return;
      }

      const driverId = String(localDriver.userId);
      const driverRef = doc(db, "users", driverId);

      const driverSnapshot = await getDoc(driverRef);

      if (!driverSnapshot.exists()) {
        Alert.alert("Erreur", "Conducteur introuvable dans Firestore.");
        return;
      }

      const driver = driverSnapshot.data();

      // Arrêter une éventuelle simulation de déplacement.
      stopDriverMovement(driverId);

      // ----------------------------------------------------------
      // 1. Annuler la course actuellement liée au conducteur
      // ----------------------------------------------------------
      if (driver.currentRideId) {
        const currentRideRef = doc(
          db,
          "rides",
          String(driver.currentRideId)
        );

        const currentRideSnapshot = await getDoc(currentRideRef);

        if (currentRideSnapshot.exists()) {
          const currentRide = currentRideSnapshot.data();

          if (
            currentRide.status !== "completed" &&
            currentRide.status !== "cancelled"
          ) {
            await updateDoc(currentRideRef, {
              status: "cancelled",
              cancelledAt: serverTimestamp(),
            });

            console.log(
              "🧹 Course actuelle annulée :",
              driver.currentRideId
            );
          }
        }
      }

      // ----------------------------------------------------------
      // 2. Annuler toutes les demandes encore pending
      //    de ce conducteur
      // ----------------------------------------------------------
      const pendingQuery = query(
        collection(db, "ride_requests"),
        where("driverId", "==", driverId),
        where("status", "==", "pending")
      );

      const pendingSnapshot = await getDocs(pendingQuery);

      if (!pendingSnapshot.empty) {
        const batch = writeBatch(db);

        pendingSnapshot.docs.forEach((requestDoc) => {
          batch.update(requestDoc.ref, {
            status: "cancelled",
            cancelledAt: serverTimestamp(),
            respondedAt: serverTimestamp(),
          });
        });

        await batch.commit();
      }

      console.log(
        "🧹 Demandes pending annulées :",
        pendingSnapshot.size
      );

      // ----------------------------------------------------------
      // 3. Libérer le conducteur
      // ----------------------------------------------------------
      await updateDoc(driverRef, {
        availability: "available",
        currentRideId: null,
      });

      console.log(
        "🟢 Conducteur remis disponible :",
        driverId
      );

      Alert.alert(
        "Test réinitialisé",
        "Le conducteur est maintenant disponible et les anciennes demandes de test ont été annulées."
      );

      console.log("========================================");
    } catch (error) {
      console.error(
        "❌ Erreur réinitialisation conducteur :",
        error
      );

      Alert.alert(
        "Erreur",
        "Impossible de réinitialiser le test."
      );
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.testButton}
        onPress={simulateRideRequest}
      >
        <Text style={styles.testText}>
          🔧 TESTER UNE DEMANDE CONDUCTEUR
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resetButton}
        onPress={resetDriverTest}
      >
        <Text style={styles.resetText}>
          🧹 RÉINITIALISER LE TEST CONDUCTEUR
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },

  testButton: {
    backgroundColor: "#B87500",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  testText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 15,
    textAlign: "center",
  },

  resetButton: {
    backgroundColor: "#E53935",
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  resetText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
});
