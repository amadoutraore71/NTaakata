import { useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Payment() {
  const [selectedMethod, setSelectedMethod] =
    useState("cash");

  const tripAmount = 1500;

  const confirmPayment = () => {
    Alert.alert(
      "Course confirmée",
      "Votre conducteur est en route."
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        Paiement
      </Text>

      <View style={styles.priceCard}>
        <Text style={styles.label}>
          Montant de la course
        </Text>

        <Text style={styles.price}>
          {tripAmount} FCFA
        </Text>
      </View>

      <Text style={styles.sectionTitle}>
        Choisissez un moyen de paiement
      </Text>

      {/* Orange Money */}
      <TouchableOpacity
        style={[
          styles.paymentCard,
          selectedMethod === "orange" &&
          styles.selectedCard,
        ]}
        onPress={() =>
          setSelectedMethod("orange")
        }
      >
        <Text style={styles.paymentText}>
          🟠 Orange Money
        </Text>
      </TouchableOpacity>

      {/* Moov Money */}
      <TouchableOpacity
        style={[
          styles.paymentCard,
          selectedMethod === "moov" &&
          styles.selectedCard,
        ]}
        onPress={() =>
          setSelectedMethod("moov")
        }
      >
        <Text style={styles.paymentText}>
          🔵 Moov Money
        </Text>
      </TouchableOpacity>

      {/* Cash */}
      <TouchableOpacity
        style={[
          styles.paymentCard,
          selectedMethod === "cash" &&
          styles.selectedCard,
        ]}
        onPress={() =>
          setSelectedMethod("cash")
        }
      >
        <Text style={styles.paymentText}>
          💵 Paiement Cash
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={confirmPayment}
      >
        <Text style={styles.buttonText}>
          Confirmer
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

  priceCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
  },

  label: {
    color: "#666",
  },

  price: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginTop: 10,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },

  paymentCard: {
    backgroundColor: "#F8F8F8",
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
  },

  selectedCard: {
    borderWidth: 2,
    borderColor: "#0B6E4F",
  },

  paymentText: {
    fontSize: 16,
    fontWeight: "600",
  },

  button: {
    marginTop: 30,
    backgroundColor: "#F4C300",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});