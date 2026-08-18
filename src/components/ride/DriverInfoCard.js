import { MaterialIcons } from "@expo/vector-icons";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function DriverInfoCard({
  driver,
  routeInfo,
  price,
  onOrder,
}) {
  if (!driver) return null;

  return (
    <View style={styles.card}>

      <Text style={styles.name}>
        👤 {driver.name}
      </Text>

      <Text style={styles.rating}>
        ⭐ {driver.averageRating || "Nouveau"}
      </Text>

      <Text style={styles.vehicle}>
        {driver.vehicleType === "moto" ? "🏍️" : "🚗"}{" "}
        {driver.vehicleBrand || "--"}
        {driver.vehicleModel ? ` ${driver.vehicleModel}` : ""}
      </Text>

      <Text style={styles.info}>
        📞 {driver.phone}
      </Text>

      <View style={styles.separator} />

      <Text style={styles.detail}>
        📍 Distance :
        {" "}
        {driver.distance
          ? `${driver.distance} m`
          : "--"}
      </Text>

      <Text style={styles.detail}>
        ⏱ Temps estimé :
        {" "}
        {routeInfo?.duration
          ? `${Math.round(routeInfo.duration)} min`
          : "--"}
      </Text>

      <Text style={styles.price}>
        💰 {price || "--"} FCFA
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={onOrder}
      >
        <MaterialIcons
          name="local-taxi"
          color="#FFF"
          size={22}
        />

        <Text style={styles.buttonText}>
          Commander
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    margin: 15,
    borderRadius: 20,
    padding: 20,
    elevation: 8,
  },

  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
  },

  rating: {
    marginTop: 4,
    color: "#F4B400",
    fontWeight: "bold",
  },

  vehicle: {
    marginTop: 12,
    fontSize: 16,
    color: "#444",
  },

  info: {
    marginTop: 6,
    fontSize: 16,
    color: "#444",
  },

  separator: {
    height: 1,
    backgroundColor: "#EEE",
    marginVertical: 15,
  },

  detail: {
    fontSize: 16,
    color: "#555",
    marginBottom: 8,
  },

  price: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: "bold",
    color: "#0B6E4F",
  },

  button: {
    marginTop: 20,
    backgroundColor: "#0B6E4F",
    borderRadius: 15,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    marginLeft: 10,
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});