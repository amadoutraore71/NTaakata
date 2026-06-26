import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";
import AppHeader from "../../components/AppHeader";
export default function RideDetails() {
  const confirmRide = () => {
    router.push("/(passenger)/payment");
  };

  return (
    <SafeAreaView style={styles.container}>
<AppHeader
  title="Détails de la course"
  profileRoute="/(driver)/profile"
/>

      {/* Conducteur */}
      <View style={styles.driverCard}>
        <Image
          source={{
            uri: "https://randomuser.me/api/portraits/men/1.jpg",
          }}
          style={styles.avatar}
        />

        <Text style={styles.driverName}>
          Moussa Traoré
        </Text>

        <Text style={styles.driverInfo}>
          ⭐ 4.8
        </Text>

        <Text style={styles.driverInfo}>
          🏍️ Moto
        </Text>
      </View>

      {/* Informations */}
      <View style={styles.infoCard}>
        <Text style={styles.label}>
          Départ
        </Text>

        <Text style={styles.value}>
          Sogoniko
        </Text>

        <Text style={styles.label}>
          Destination
        </Text>

        <Text style={styles.value}>
          Badalabougou
        </Text>

        <Text style={styles.label}>
          Distance
        </Text>

        <Text style={styles.value}>
          7 km
        </Text>

        <Text style={styles.label}>
          Prix
        </Text>

        <Text style={styles.price}>
          1 500 FCFA
        </Text>
      </View>

      {/* Bouton */}
      <TouchableOpacity
        style={styles.button}
        onPress={confirmRide}
      >
        <Text style={styles.buttonText}>
          Confirmer la course
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

  driverCard: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    alignItems: "center",
    padding: 20,
    elevation: 3,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },

  driverName: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
  },

  driverInfo: {
    color: "#666",
    marginTop: 5,
  },

  infoCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
  },

  label: {
    color: "#666",
    marginTop: 10,
  },

  value: {
    fontWeight: "bold",
    fontSize: 16,
  },

  price: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginTop: 5,
  },

  button: {
    backgroundColor: "#F4C300",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },

  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});