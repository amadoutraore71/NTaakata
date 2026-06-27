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
}) {const getBadgeStyle = () => {
  switch (vehicleKey) {
    case "moto":
      return styles.badgeEconomy;

    case "voiture":
      return styles.badgePopular;

    case "climatisee":
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
        selectedVehicle === vehicleKey &&
          styles.selected,
      ]}
      onPress={onPress}
    >
      <Text style={styles.icon}>
        {icon}
      </Text>

      <Text style={styles.title}>
        {title}
      </Text>

      <Text style={styles.price}>
        ≈ {calculateFare(distance, vehicleKey)} FCFA
      </Text>

      <Text style={styles.distance}>
        📏 {distance} km
      </Text>

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
  paddingVertical: 20,
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
    marginTop: 10,
  },

  price: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginTop: 8,
  },

  distance: {
    color: "#777",
    marginTop: 5,
    fontSize: 13,
  },
badgeEconomy: {
  marginTop: 15,
  backgroundColor: "#E8F5E9",
  paddingHorizontal: 4,
  paddingVertical: 5,
  borderRadius: 20,
},

badgePopular: {
  marginTop: 15,
  backgroundColor: "#FFF4D6",
  paddingHorizontal: 10,
  paddingVertical: 5,
  borderRadius: 20,
},

badgePremium: {
  marginTop: 15,
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