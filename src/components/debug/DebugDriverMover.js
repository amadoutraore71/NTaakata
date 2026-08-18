import {
    doc,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import { useState } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { db } from "../../../firebase/config";
import {
    startDriverMovement,
} from "../../services/simulation/driverMovementService";

export default function DebugDriverMover({
  rideId,
  driverId,
  startLocation,
  endLocation,
}) {
  const [moving, setMoving] = useState(false);

  const simulateMovement = async () => {
    if (!driverId || !startLocation || !endLocation) {
      console.log("❌ Paramètres manquants.");
      return;
    }

    try {
      setMoving(true);

      console.log("🚕 Début de la simulation");

      // Le conducteur commence à venir vers le passager
      if (rideId) {
        await updateDoc(
          doc(db, "rides", rideId),
          {
            status: "arriving",
            driverArrivingAt: serverTimestamp(),
          }
        );
      }

      await startDriverMovement({
        driverId,
        startLocation,
        endLocation,

        onStep: async () => {
          // Rien pour l'instant.
          // Plus tard on pourra mettre à jour
          // la distance, l'ETA, etc.
        },

        onFinished: async () => {
          if (!rideId) return;

          await updateDoc(
            doc(db, "rides", rideId),
            {
              status: "in_progress",
              startedAt: serverTimestamp(),
            }
          );

          console.log("✅ Conducteur arrivé au point de départ");
        },
      });

      console.log("🏁 Simulation terminée");

    } catch (error) {
      console.log(error);
    } finally {
      setMoving(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          moving && styles.buttonDisabled,
        ]}
        onPress={simulateMovement}
        disabled={moving}
      >
        <Text style={styles.text}>
          {moving
            ? "🚕 Déplacement..."
            : "🚕 Simuler le déplacement"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },

  button: {
    backgroundColor: "#1976D2",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  text: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});