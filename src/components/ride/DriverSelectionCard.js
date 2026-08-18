import { MaterialIcons } from "@expo/vector-icons";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function DriverSelectionCard({
  driver,
  onConfirm,
  onCancel,
}) {

  if (!driver) return null;

  return (

    <View style={styles.card}>

      <MaterialIcons
        name={
          driver.vehicleType === "moto"
            ? "two-wheeler"
            : "local-taxi"
        }
        size={55}
        color="#0B6E4F"
      />

      <Text style={styles.name}>
        {driver.name}
      </Text>

      <Text style={styles.vehicle}>
        {driver.vehicleBrand}
        {" • "}
        {driver.vehicleColor}
      </Text>

      <Text style={styles.distance}>
        {(driver.distance / 1000).toFixed(2)} km
      </Text>

      <View style={styles.buttons}>

        <TouchableOpacity
          style={styles.confirm}
          onPress={onConfirm}
        >
          <Text style={styles.buttonText}>
            Choisir
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancel}
          onPress={onCancel}
        >
          <Text style={styles.buttonText}>
            Retour
          </Text>
        </TouchableOpacity>

      </View>

    </View>

  );

}

const styles = StyleSheet.create({

  card: {

    position: "absolute",

    bottom: 260,

    left: 20,

    right: 20,

    backgroundColor: "#FFF",

    borderRadius: 20,

    padding: 20,

    alignItems: "center",

    elevation: 10,

  },

  name: {

    fontSize: 22,

    fontWeight: "bold",

    marginTop: 10,

  },

  vehicle: {

    marginTop: 6,

    color: "#666",

  },

  distance: {

    marginTop: 8,

    fontWeight: "bold",

    color: "#0B6E4F",

  },

  buttons: {

    flexDirection: "row",

    marginTop: 20,

  },

  confirm: {

    backgroundColor: "#0B6E4F",

    paddingHorizontal: 25,

    paddingVertical: 12,

    borderRadius: 12,

    marginRight: 10,

  },

  cancel: {

    backgroundColor: "#D32F2F",

    paddingHorizontal: 25,

    paddingVertical: 12,

    borderRadius: 12,

  },

  buttonText: {

    color: "#FFF",

    fontWeight: "bold",

  },

});