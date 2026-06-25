import { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";

export default function SearchRide() {
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleType, setVehicleType] =
    useState("moto");

  const searchDrivers = () => {
    router.push("/(passenger)/drivers");
  };

  return (
    <SafeAreaView style={styles.container}>

      <Text style={styles.title}>
        Rechercher un trajet
      </Text>

      {/* Départ */}
      <TextInput
        style={styles.input}
        placeholder="Point de départ"
        value={departure}
        onChangeText={setDeparture}
      />

      {/* Destination */}
      <TextInput
        style={styles.input}
        placeholder="Destination"
        value={destination}
        onChangeText={setDestination}
      />

      {/* Choix véhicule */}
      <Text style={styles.label}>
        Type de transport
      </Text>

      <View style={styles.vehicleContainer}>

        <TouchableOpacity
          style={[
            styles.vehicleButton,
            vehicleType === "moto" &&
            styles.selectedVehicle,
          ]}
          onPress={() =>
            setVehicleType("moto")
          }
        >
          <Text style={styles.vehicleText}>
            🏍️ Moto
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.vehicleButton,
            vehicleType === "voiture" &&
            styles.selectedVehicle,
          ]}
          onPress={() =>
            setVehicleType("voiture")
          }
        >
          <Text style={styles.vehicleText}>
            🚗 Voiture
          </Text>
        </TouchableOpacity>

      </View>

      {/* Prix estimé */}
      <View style={styles.priceCard}>
        <Text style={styles.priceLabel}>
          Prix estimé
        </Text>

        <Text style={styles.price}>
          1 500 FCFA
        </Text>
      </View>

      {/* Rechercher */}
      <TouchableOpacity
        style={styles.searchButton}
        onPress={searchDrivers}
      >
        <Text style={styles.searchText}>
          Rechercher un conducteur
        </Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginBottom: 25,
  },

  input: {
    height: 55,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#FAFAFA",
  },

  label: {
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 10,
  },

  vehicleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  vehicleButton: {
    width: "48%",
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
  },

  selectedVehicle: {
    backgroundColor: "#F4C300",
  },

  vehicleText: {
    fontWeight: "bold",
  },

  priceCard: {
    marginTop: 25,
    padding: 20,
    borderRadius: 15,
    backgroundColor: "#F8F8F8",
  },

  priceLabel: {
    color: "#666",
  },

  price: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginTop: 5,
  },

  searchButton: {
    marginTop: 30,
    backgroundColor: "#0B6E4F",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  searchText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});