import { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LogoutButton from "../../components/LogoutButton";

import { router } from "expo-router";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../../firebase/config";
import { getUser } from "../../storage/userStorage";

export default function DriverDashboard() {
  const [subscriptionActive, setSubscriptionActive] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadDriver();
  }, []);

  const loadDriver = async () => {
    try {
      const user = await getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "users"),
        where("phone", "==", user.phone)
      );

      const querySnapshot =
        await getDocs(q);

      if (!querySnapshot.empty) {
        const driver =
          querySnapshot.docs[0].data();

        setSubscriptionActive(
          driver.subscriptionActive || false
        );

        console.log(
          "subscriptionActive =",
          driver.subscriptionActive
        );
      }

      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>
          Chargement...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.header}>
        <Text style={styles.title}>
          Tableau de bord
        </Text>
        <LogoutButton />
      </View>
      {!subscriptionActive && (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            🔒 Votre abonnement conducteur
            n'est pas actif.
          </Text>

          <Text style={styles.warningSubText}>
            Activez votre abonnement
            journalier de 100 FCFA pour
            recevoir des demandes de courses.
          </Text>

          <TouchableOpacity
            style={styles.activateButton}
            onPress={() =>
              router.push(
                "/(driver)/subscription"
              )
            }
          >
            <Text style={styles.activateText}>
              Activer maintenant
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>
          Statut Chauffeur
        </Text>

        <View style={styles.statusRow}>
          <Text style={styles.activeText}>
            🟢 En ligne
          </Text>

          <Switch value={true} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>
          Revenus aujourd'hui
        </Text>

        <Text style={styles.amount}>
          12 500 FCFA
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>
          Courses effectuées
        </Text>

        <Text style={styles.amount}>
          8
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          if (!subscriptionActive) {
            router.push(
              "/(driver)/subscription"
            );
            return;
          }

          router.push(
            "/(driver)/requests"
          );
        }}
      >
        <Text style={styles.buttonText}>
          Voir les demandes
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() =>
          router.push(
            "/(driver)/earnings"
          )
        }
      >
        <Text style={styles.secondaryText}>
          Mes revenus
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
    marginTop: 100
  },

  loading: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 50,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginBottom: 25,
  },

  warningCard: {
    backgroundColor: "#FFF3CD",
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FFE69C",
  },

  warningText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#856404",
    marginBottom: 8,
  },

  warningSubText: {
    color: "#856404",
    marginBottom: 15,
    lineHeight: 20,
  },

  activateButton: {
    backgroundColor: "#F4C300",
    height: 45,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  activateText: {
    fontWeight: "bold",
    fontSize: 15,
  },

  statusCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },

  statusTitle: {
    fontWeight: "bold",
    marginBottom: 10,
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  activeText: {
    fontSize: 16,
    fontWeight: "600",
  },

  card: {
    backgroundColor: "#F8F8F8",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },

  label: {
    color: "#666",
  },

  amount: {
    fontSize: 26,
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
    marginTop: 20,
  },

  buttonText: {
    fontWeight: "bold",
    fontSize: 16,
  },

  secondaryButton: {
    backgroundColor: "#0B6E4F",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },

  secondaryText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  header: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},
});