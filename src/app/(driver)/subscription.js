import { router } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    Alert,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    doc,
    getDoc,
    updateDoc,
} from "firebase/firestore";

import { db } from "../../../firebase/config";
import Header from "../../components/Header";
import { getUser, saveUser } from "../../storage/userStorage";
export default function Subscription() {
  const [dailyFee, setDailyFee] = React.useState(null);
  const [durationHours, setDurationHours] = React.useState(24);
  const [subscriptionEnabled, setSubscriptionEnabled] =
    React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [paymentLoading, setPaymentLoading] =
    React.useState(false);

  React.useEffect(() => {
    loadSubscriptionConfig();
  }, []);

  // =========================================================
  // CHARGER LA CONFIGURATION DEPUIS FIRESTORE
  // =========================================================
  const loadSubscriptionConfig = async () => {
    try {
      setLoading(true);

      const subscriptionRef = doc(
        db,
        "settings",
        "subscription"
      );

      const subscriptionSnapshot =
        await getDoc(subscriptionRef);

      if (!subscriptionSnapshot.exists()) {
        Alert.alert(
          "Configuration introuvable",
          "La configuration de l'abonnement n'existe pas."
        );
        return;
      }

      const data = subscriptionSnapshot.data();

      const fee =
        typeof data.dailyFee === "number"
          ? data.dailyFee
          : 100;

      const hours =
        typeof data.durationHours === "number"
          ? data.durationHours
          : 24;

      const active =
        data.active !== false;

      setDailyFee(fee);
      setDurationHours(hours);
      setSubscriptionEnabled(active);
    } catch (error) {
      console.log(
        "Erreur chargement abonnement :",
        error
      );

      Alert.alert(
        "Erreur",
        "Impossible de charger le tarif de l'abonnement."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // PAIEMENT / ACTIVATION
  // =========================================================
const handlePayment = async () => {
  if (paymentLoading) {
    return;
  }

  // ============================================================
  // VÉRIFIER LA CONFIGURATION
  // ============================================================

  if (!subscriptionEnabled) {
    Alert.alert(
      "Abonnement indisponible",
      "L'abonnement conducteur est actuellement désactivé."
    );
    return;
  }

  if (!dailyFee || dailyFee <= 0) {
    Alert.alert(
      "Erreur",
      "Le tarif de l'abonnement est invalide."
    );
    return;
  }

  try {
    setPaymentLoading(true);

    // ============================================================
    // RÉCUPÉRER L'UTILISATEUR ACTUEL
    // ============================================================

    const driver = await getUser();

    console.log(
      "🚗 Conducteur pour abonnement :",
      driver
    );

    if (!driver?.userId) {
      Alert.alert(
        "Erreur",
        "Utilisateur connecté introuvable."
      );
      return;
    }

    console.log(
      "🆔 UserId utilisé pour l'abonnement :",
      driver.userId
    );

    // ============================================================
    // UTILISER LE DOCUMENT EXACT DE L'UTILISATEUR
    // ============================================================

    const driverRef = doc(
      db,
      "users",
      driver.userId
    );

    const driverSnapshot =
      await getDoc(driverRef);

    if (!driverSnapshot.exists()) {
      console.error(
        "❌ Document users introuvable :",
        driver.userId
      );

      Alert.alert(
        "Erreur",
        "Votre compte utilisateur est introuvable dans Firebase."
      );

      return;
    }

    const firestoreDriver =
      driverSnapshot.data();

    console.log(
      "🔥 Document Firebase utilisé :",
      {
        id: driverSnapshot.id,
        userId: firestoreDriver.userId,
        phone: firestoreDriver.phone,
        role: firestoreDriver.role,
        subscriptionActive:
          firestoreDriver.subscriptionActive,
      }
    );

    // ============================================================
    // CALCUL DE L'EXPIRATION
    // ============================================================

    const now = new Date();

    const expiresAt = new Date(
      now.getTime() +
        durationHours *
          60 *
          60 *
          1000
    );

    console.log(
      "💰 Tarif :",
      dailyFee,
      "FCFA"
    );

    console.log(
      "⏱️ Durée :",
      durationHours,
      "heures"
    );

    console.log(
      "📅 Paiement :",
      now.toISOString()
    );

    console.log(
      "📅 Expiration :",
      expiresAt.toISOString()
    );

    // ============================================================
    // MODE DÉVELOPPEMENT
    // ============================================================
    //
    // Le paiement est considéré comme réussi.
    //
    // subscriptionActive reste TRUE pour le développement.
    //
    // Plus tard :
    // Orange Money / Moov Money seront intégrés ici.
    //
    // ============================================================

    await updateDoc(
      driverRef,
      {
        subscriptionActive: true,

        dailyFee: dailyFee,

        subscriptionAmount:
          dailyFee,

        subscriptionPaidAt:
          now.toISOString(),

        subscriptionExpiresAt:
          expiresAt.toISOString(),
      }
    );
// ============================================================
// SYNCHRONISER LE STOCKAGE LOCAL
// ============================================================

await saveUser({
  ...driver,

  subscriptionActive: true,

  dailyFee: dailyFee,

  subscriptionAmount: dailyFee,

  subscriptionPaidAt:
    now.toISOString(),

  subscriptionExpiresAt:
    expiresAt.toISOString(),
});

console.log(
  "💾 Stockage local synchronisé"
);
    console.log(
      "========================================"
    );

    console.log(
      "✅ ABONNEMENT ACTIVÉ"
    );

    console.log(
      "🆔 UserId :",
      driver.userId
    );

    console.log(
      "👤 Nom :",
      firestoreDriver.name
    );

    console.log(
      "💰 Montant :",
      dailyFee,
      "FCFA"
    );

    console.log(
      "📅 Expiration :",
      expiresAt.toISOString()
    );
console.log(
  "========================================"
);

// ============================================================
// CONFIRMATION
// ============================================================

Alert.alert(
  "Abonnement activé ✅",
  `Votre abonnement de ${dailyFee} FCFA est actif pendant ${durationHours} heures.`,
  [
    {
      text: "Continuer",
      onPress: () => {
        router.replace(
          "/(driver)/dashboard"
        );
      },
    },
  ]
);
  } catch (error) {
    console.error(
      "❌ Erreur activation abonnement :",
      error
    );

    Alert.alert(
      "Erreur",
      error?.message ??
        "Impossible d'activer l'abonnement."
    );

  } finally {
    setPaymentLoading(false);
  }
};
  // =========================================================
  // AFFICHAGE CHARGEMENT
  // =========================================================
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
        />

        <Header
          title="Abonnement"
          profileRoute="/(driver)/profile"
        />

        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#0B6E4F"
          />

          <Text style={styles.loadingText}>
            Chargement du tarif...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =========================================================
  // AFFICHAGE
  // =========================================================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <Header
        title="Accueil"
        profileRoute="/(driver)/profile"
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

        {/* ================================================= */}
        {/* TARIF */}
        {/* ================================================= */}
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>
            Tarif journalier
          </Text>

          <Text style={styles.price}>
            {dailyFee !== null
              ? `${dailyFee} FCFA`
              : "---"}
          </Text>
        </View>

        {/* ================================================= */}
        {/* INFORMATIONS */}
        {/* ================================================= */}
        <View style={styles.infoBox}>
          <Text style={styles.info}>
            ✓ Réception des demandes
          </Text>

          <Text style={styles.info}>
            ✓ Accès complet au Dashboard
          </Text>

          <Text style={styles.info}>
            ✓ Validité : {durationHours} heures
          </Text>

          <Text style={styles.info}>
            ✓ Renouvelable après expiration
          </Text>
        </View>

        {/* ================================================= */}
        {/* ABONNEMENT DÉSACTIVÉ */}
        {/* ================================================= */}
        {!subscriptionEnabled && (
          <View style={styles.disabledBox}>
            <Text style={styles.disabledText}>
              L'abonnement conducteur est
              actuellement indisponible.
            </Text>
          </View>
        )}

        {/* ================================================= */}
        {/* BOUTON */}
        {/* ================================================= */}
        <TouchableOpacity
          style={[
            styles.button,
            (!subscriptionEnabled ||
              paymentLoading) &&
              styles.buttonDisabled,
          ]}
          onPress={handlePayment}
          disabled={
            !subscriptionEnabled ||
            paymentLoading
          }
        >
          {paymentLoading ? (
            <ActivityIndicator
              size="small"
              color="#000000"
            />
          ) : (
            <Text style={styles.buttonText}>
              Payer maintenant
            </Text>
          )}
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

  disabledBox: {
    backgroundColor: "#FFF3F3",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },

  disabledText: {
    color: "#B00020",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 21,
  },

  button: {
    backgroundColor: "#F4C300",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonDisabled: {
    opacity: 0.5,
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

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 15,
    color: "#666",
    fontSize: 16,
  },
});