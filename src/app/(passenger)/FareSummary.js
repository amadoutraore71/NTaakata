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

    paddingHorizontal: 10,
    paddingVertical: 8,

    marginBottom: 0,

    elevation: 0,
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111111",

    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    marginBottom: 6,
  },

  label: {
    fontSize: 16,
    color: "#666666",
  },

  value: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111111",
  },

  price: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0B6E4F",
  },
});