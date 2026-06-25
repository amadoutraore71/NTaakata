import {
  useEffect,
  useState,
} from "react";

import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../../../firebase/config";

export default function Payments() {
  const [subscriptionRevenue,
    setSubscriptionRevenue] =
    useState(0);

  const [ridesRevenue,
    setRidesRevenue] =
    useState(0);

  const [totalRevenue,
    setTotalRevenue] =
    useState(0);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      let subscriptions = 0;
      let commissions = 0;

      // Conducteurs
      const usersSnapshot =
        await getDocs(
          collection(db, "users")
        );

      usersSnapshot.forEach(
        (document) => {
          const user =
            document.data();

          if (
            user.role === "driver" &&
            user.subscriptionActive
          ) {
            subscriptions +=
              Number(
                user.dailyFee || 100
              );
          }
        }
      );

      // Courses
      const ridesSnapshot =
        await getDocs(
          collection(db, "rides")
        );

      ridesSnapshot.forEach(
        (document) => {
          const ride =
            document.data();

          if (
            ride.status ===
            "completed"
          ) {
            commissions +=
              Number(
                ride.price || 0
              ) * 0.1;
          }
        }
      );

      setSubscriptionRevenue(
        subscriptions
      );

      setRidesRevenue(
        commissions
      );

      setTotalRevenue(
        subscriptions +
        commissions
      );
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
    >
      <ScrollView>
        <Text style={styles.title}>
          Revenus N'Taakata
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>
            💰 Abonnements
          </Text>

          <Text style={styles.value}>
            {subscriptionRevenue}
            FCFA
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>
            🚕 Commissions Courses
          </Text>

          <Text style={styles.value}>
            {ridesRevenue}
            FCFA
          </Text>
        </View>

        <View style={styles.totalCard}>
          <Text
            style={styles.totalLabel}
          >
            📈 Revenu Total
          </Text>

          <Text
            style={styles.totalValue}
          >
            {totalRevenue}
            FCFA
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#FFFFFF",
      padding: 20,
      marginTop: 80,
    },

    title: {
      fontSize: 30,
      fontWeight: "bold",
      color: "#0B6E4F",
      marginBottom: 25,
    },

    card: {
      backgroundColor:
        "#F8F8F8",
      borderRadius: 15,
      padding: 20,
      marginBottom: 15,
    },

    label: {
      color: "#666",
      marginBottom: 10,
    },

    value: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#0B6E4F",
    },

    totalCard: {
      backgroundColor:
        "#FFF3CD",
      borderRadius: 15,
      padding: 20,
      marginTop: 20,
    },

    totalLabel: {
      fontSize: 18,
      fontWeight: "bold",
    },

    totalValue: {
      fontSize: 32,
      fontWeight: "bold",
      color: "#0B6E4F",
      marginTop: 10,
    },
  });