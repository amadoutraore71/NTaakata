import {
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";

import {
  collection,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../../../firebase/config";
import { getUser } from "../../storage/userStorage";

export default function Subscription() {
  const handlePayment = async () => {
    try {
      const user = await getUser();

      if (!user) {
        Alert.alert(
          "Erreur",
          "Utilisateur introuvable"
        );
        return;
      }

      const q = query(
        collection(db, "users"),
        where("phone", "==", user.phone)
      );

      const querySnapshot =
        await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert(
          "Erreur",
          "Conducteur introuvable"
        );
        return;
      }

      const driverDoc =
        querySnapshot.docs[0];

     const now = new Date();

const expiresAt = new Date(
  now.getTime() +
  24 * 60 * 60 * 1000
);

await updateDoc(
  driverDoc.ref,
  {
    subscriptionActive: true,

    dailyFee: 100,

    subscriptionPaidAt:
      now.toISOString(),

    subscriptionExpiresAt:
      expiresAt.toISOString(),
  }
);

      Alert.alert(
        "Paiement validé",
        "Votre abonnement a été activé."
      );

      router.replace(
        "/(driver)/dashboard"
      );

    } catch (error) {
      console.log(error);

      Alert.alert(
        "Erreur",
        "Impossible d'activer l'abonnement."
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <View style={styles.card}>
        <Text style={styles.title}>
          Abonnement Conducteur
        </Text>

        <Text style={styles.subtitle}>
          Activez votre compte conducteur
          pour recevoir des demandes
          de courses.
        </Text>

        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>
            Tarif journalier
          </Text>

          <Text style={styles.price}>
            100 FCFA
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.info}>
            ✓ Réception des demandes
          </Text>

          <Text style={styles.info}>
            ✓ Accès complet au Dashboard
          </Text>

          <Text style={styles.info}>
            ✓ Validité : 24 heures
          </Text>

          <Text style={styles.info}>
            ✓ Renouvelable chaque jour
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handlePayment}
        >
          <Text style={styles.buttonText}>
            Payer maintenant
          </Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          N'Taakata Conducteur
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    padding: 25,
    elevation: 5,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    color: "#0B6E4F",
  },

  subtitle: {
    textAlign: "center",
    color: "#666",
    marginTop: 10,
    lineHeight: 22,
  },

  priceContainer: {
    alignItems: "center",
    marginVertical: 30,
  },

  priceLabel: {
    color: "#666",
    fontSize: 18,
  },

  price: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#F4C300",
    marginTop: 10,
  },

  infoBox: {
    marginBottom: 30,
  },

  info: {
    fontSize: 16,
    marginBottom: 12,
    color: "#333",
  },

  button: {
    backgroundColor: "#F4C300",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },

  footer: {
    textAlign: "center",
    marginTop: 20,
    color: "#888",
  },
});