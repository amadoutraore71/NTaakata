import { useState } from "react";

import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  addDoc,
  collection,
} from "firebase/firestore";

import { db } from "../../../firebase/config";

import LogoutButton from "../../components/LogoutButton";
import { getUser } from "../../storage/userStorage";

export default function PassengerHome() {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleRideRequest = async () => {
    try {
      if (!pickup.trim()) {
        Alert.alert(
          "Erreur",
          "Veuillez saisir le point de départ"
        );
        return;
      }

      if (!destination.trim()) {
        Alert.alert(
          "Erreur",
          "Veuillez saisir la destination"
        );
        return;
      }

      setLoading(true);

      const user = await getUser();

      if (!user) {
        Alert.alert(
          "Erreur",
          "Utilisateur introuvable"
        );
        setLoading(false);
        return;
      }

      await addDoc(
        collection(db, "rides"),
        {
          pickup,
          destination,

          passengerPhone:
            user.phone,

          price: 1500,

          status: "pending",

          createdAt:
            new Date().toISOString(),
        }
      );

      Alert.alert(
        "Succès",
        "Votre demande de course a été envoyée."
      );

      setPickup("");
      setDestination("");

      setLoading(false);
    } catch (error) {
      console.log(error);

      setLoading(false);

      Alert.alert(
        "Erreur",
        "Impossible d'envoyer la demande."
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Commander une course
        </Text>

        <LogoutButton />
      </View>

      {/* Formulaire */}
      <View style={styles.card}>
        <Text style={styles.label}>
          📍 Point de départ
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex : Sogoniko"
          value={pickup}
          onChangeText={setPickup}
        />

        <Text style={styles.label}>
          🎯 Destination
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex : Kalaban Coura"
          value={destination}
          onChangeText={setDestination}
        />

        {/* Prix estimé */}
        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>
            Prix estimé
          </Text>

          <Text style={styles.price}>
            1500 FCFA
          </Text>
        </View>

        {/* Bouton */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleRideRequest}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading
              ? "Envoi..."
              : "Commander"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0B6E4F",
  },

  card: {
    backgroundColor: "#F8F8F8",
    borderRadius: 15,
    padding: 20,
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 10,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    height: 55,
    paddingHorizontal: 15,
  },

  priceCard: {
    backgroundColor: "#FFF3CD",
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
  },

  priceLabel: {
    color: "#666",
    fontSize: 14,
  },

  price: {
    marginTop: 5,
    fontSize: 24,
    fontWeight: "bold",
    color: "#0B6E4F",
  },

  button: {
    backgroundColor: "#F4C300",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },

  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
});