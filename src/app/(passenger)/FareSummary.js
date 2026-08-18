import {
    StyleSheet,
    Text,
    View,
} from "react-native";

import { calculateFare } from "../../utils/fareCalculator";

export default function FareSummary({
  distance,
  vehicleType,
}) {
  if (!distance) return null;

  const price = calculateFare(
    distance,
    vehicleType
  );

  const duration = Math.round(
    (distance / 40) * 60
  );

  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Estimation
      </Text>

      <View style={styles.row}>
        <Text style={styles.label}>
          📍 Distance
        </Text>

        <Text style={styles.value}>
          {distance.toFixed(1)} km
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>
          ⏱ Temps
        </Text>

        <Text style={styles.value}>
          {hours > 0
            ? `${hours} h ${minutes} min`
            : `${minutes} min`}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>
          💰 Prix estimé
        </Text>

        <Text style={styles.price}>
          {price.toLocaleString()} FCFA
        </Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    elevation: 3,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  label: {
    fontSize: 16,
    color: "#666",
  },

  value: {
    fontSize: 16,
    fontWeight: "600",
  },

  price: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0B6E4F",
  },

});