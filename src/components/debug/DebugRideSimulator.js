import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

import { db } from "../../../firebase/config";

export default function DebugRideSimulator({
  rideId,
}) {
  if (!__DEV__ || !rideId) return null;

  const wait = (ms) =>
    new Promise((resolve) =>
      setTimeout(resolve, ms)
    );

  const simulateRide = async () => {
    try {
      console.log("Début simulation...");

      // Conducteur trouvé
      await updateDoc(doc(db, "rides", rideId), {
        status: "accepted",
        acceptedAt: serverTimestamp(),
      });

      await wait(3000);

      // Conducteur arrive
      await updateDoc(doc(db, "rides", rideId), {
        status: "driver_arriving",
      });

      await wait(5000);

      // Début de la course
      await updateDoc(doc(db, "rides", rideId), {
        status: "started",
        startedAt: serverTimestamp(),
      });

      await wait(8000);

      // Fin de la course
      await updateDoc(doc(db, "rides", rideId), {
        status: "completed",
        completedAt: serverTimestamp(),
      });

      console.log("Simulation terminée");

    } catch (error) {
      console.log(error);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={simulateRide}
    >
      <Text style={styles.text}>
        🚀 Simuler une course complète
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#673AB7",
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