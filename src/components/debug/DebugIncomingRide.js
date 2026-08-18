import {
    addDoc,
    collection,
    serverTimestamp,
} from "firebase/firestore";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
} from "react-native";

import { db } from "../../../firebase/config";

export default function DebugIncomingRide({
  rideId,
  driverId,
  passenger,
}) {
  if (!__DEV__) return null;

  const simulateIncomingRide = async () => {
    try {
      if (!rideId || !driverId) {
        console.log("Ride ou Driver manquant.");
        return;
      }

      await addDoc(collection(db, "ride_requests"), {
        rideId,
        driverId,
        passengerId: passenger?.userId,
        passengerName: passenger?.name,
        passengerPhone: passenger?.phone,
        attemptedDrivers: [],
        status: "pending",
        createdAt: serverTimestamp(),
      });

      console.log("🚖 Demande simulée envoyée.");

    } catch (error) {
      console.log(error);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={simulateIncomingRide}
    >
      <Text style={styles.text}>
        🚖 Simuler une demande conducteur
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#FF9800",
    margin: 15,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  text: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 17,
  },
});