import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

  const getBadgeStyle = () => {
    switch (vehicleKey) {
      case "moto":
        return styles.badgeEconomy;

      case "voiture":
        return styles.badgePopular;

      case "premium":
        return styles.badgePremium;

      default:
        return styles.badgeEconomy;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[
        styles.card,
        selectedVehicle === vehicleKey && styles.selected,
      ]}
      onPress={onPress}
    >
      <Text style={styles.icon}>
        {icon}
      </Text>

      <Text style={styles.title}>
        {title}
      </Text>

      {price !== null && (
        <Text style={styles.price}>
          {price.toLocaleString()} FCFA
        </Text>
      )}

      <View style={getBadgeStyle()}>
        <Text style={styles.badgeText}>
          {badge}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 10,
    marginHorizontal: 5,
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,

    elevation: 6,
  },

  selected: {
    borderWidth: 2,
    borderColor: "#0B6E4F",
    transform: [
      {
        scale: 1.03,
      },
    ],
  },

  icon: {
    fontSize: 38,
  },

  title: {
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 8,
  },

  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginTop: 12,
  },

  badgeEconomy: {
    marginTop: 18,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  badgePopular: {
    marginTop: 18,
    backgroundColor: "#FFF4D6",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  badgePremium: {
    marginTop: 18,
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
});