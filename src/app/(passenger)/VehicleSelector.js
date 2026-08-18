import { StyleSheet, Text, View } from "react-native";

import VehicleCard from "../../components/VehicleCard";

export default function VehicleSelector({
  vehicleType,
  setVehicleType,
  estimatedDistance,
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        🚕 Choisissez votre véhicule
      </Text>

      <View style={styles.vehicleContainer}>
        <VehicleCard
          icon="🏍"
          title="Moto"
          badge="Économique"
          vehicleKey="moto"
          selectedVehicle={vehicleType}
          distance={estimatedDistance}
          onPress={() => setVehicleType("moto")}
        />

        <VehicleCard
          icon="🚗"
          title="Standard"
          badge="Populaire"
          vehicleKey="voiture"
          selectedVehicle={vehicleType}
          distance={estimatedDistance}
          onPress={() => setVehicleType("voiture")}
        />

        <VehicleCard
          icon="❄️"
          title="Premium"
          badge="Climatisée"
          vehicleKey="premium"
          selectedVehicle={vehicleType}
          distance={estimatedDistance}
          onPress={() => setVehicleType("premium")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  vehicleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    marginTop: 10,
  },
});