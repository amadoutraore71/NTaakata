import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { calculateFare } from "../utils/fareCalculator";

export default function VehicleCard({
  icon,
  title,
  badge,
  vehicleKey,
  selectedVehicle,
  distance,
  onPress,
}) {
  const hasDistance =
    distance !== null &&
    distance !== undefined &&
    distance > 0;

  const price = hasDistance
    ? calculateFare(distance, vehicleKey)
    : null;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[
        styles.card,
        selectedVehicle === vehicleKey &&
          styles.selected,
      ]}
      onPress={onPress}
    >
      {/* ICÔNE */}
      <Text style={styles.icon}>
        {icon}
      </Text>

      {/* PRIX */}
      <View style={styles.priceContainer}>
        {price !== null ? (
          <Text style={styles.price}>
            {price.toLocaleString()} FCFA
          </Text>
        ) : (
          <Text style={styles.pricePlaceholder}>
            —
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,

    minWidth: 0,

    backgroundColor: "#FFFFFF",

    borderRadius: 20,

    paddingVertical: 18,
    paddingHorizontal: 6,

    marginHorizontal: 4,

    alignItems: "center",
    justifyContent: "center",

    minHeight: 145,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6,

    elevation: 5,
  },

  selected: {
    borderWidth: 3,
    borderColor: "#0B6E4F",

    transform: [
      {
        scale: 1.02,
      },
    ],
  },

  icon: {
    fontSize: 42,
    textAlign: "center",
  },

  priceContainer: {
    marginTop: 18,

    minHeight: 30,

    justifyContent: "center",
    alignItems: "center",

    width: "100%",
  },

  price: {
    fontSize: 14,
    fontWeight: "800",

    color: "#0B6E4F",

    textAlign: "center",

    flexShrink: 1,
  },

  pricePlaceholder: {
    fontSize: 20,
    fontWeight: "700",

    color: "#999999",
  },
});