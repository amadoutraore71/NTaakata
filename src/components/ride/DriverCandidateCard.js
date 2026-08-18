import { MaterialIcons } from "@expo/vector-icons";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function DriverCandidateCard({
  driver,
  onSelect,
}) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => onSelect(driver)}
    >
      <View style={styles.left}>
        <MaterialIcons
          name={
            driver.vehicleType === "moto"
              ? "two-wheeler"
              : "local-taxi"
          }
          size={34}
          color="#0B6E4F"
        />
      </View>

      <View style={styles.center}>
        <Text style={styles.name}>
          {driver.name}
        </Text>

        <Text style={styles.vehicle}>
          {driver.vehicleBrand || "--"}
          {" • "}
          {driver.vehicleColor || "--"}
        </Text>

        <Text style={styles.distance}>
          {(driver.distance / 1000).toFixed(2)} km
        </Text>
      </View>

      <View style={styles.right}>
        <MaterialIcons
          name="chevron-right"
          size={28}
          color="#999"
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#FFF",

    marginHorizontal: 15,
    marginVertical: 8,

    padding: 16,

    borderRadius: 18,

    elevation: 4,
  },

  left: {
    width: 45,
    alignItems: "center",
  },

  center: {
    flex: 1,
    marginLeft: 12,
  },

  right: {
    justifyContent: "center",
  },

  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },

  vehicle: {
    marginTop: 3,
    color: "#666",
  },

  distance: {
    marginTop: 6,
    color: "#0B6E4F",
    fontWeight: "bold",
  },
});