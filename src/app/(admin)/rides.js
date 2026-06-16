import {
  useEffect,
  useState,
} from "react";

import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../../../firebase/config";

export default function AdminDashboard() {
  const [users, setUsers] =
    useState(0);

  const [drivers, setDrivers] =
    useState(0);

  const [rides, setRides] =
    useState(0);

  const [subscriptions,
    setSubscriptions] =
    useState(0);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics =
    async () => {
      try {
        const usersSnapshot =
          await getDocs(
            collection(
              db,
              "users"
            )
          );

        let totalUsers = 0;
        let totalDrivers = 0;
        let activeSubscriptions =
          0;

        usersSnapshot.forEach(
          (document) => {
            const user =
              document.data();

            totalUsers++;

            if (
              user.role ===
              "driver"
            ) {
              totalDrivers++;
            }

            if (
              user.subscriptionActive
            ) {
              activeSubscriptions++;
            }
          }
        );

        const ridesSnapshot =
          await getDocs(
            collection(
              db,
              "rides"
            )
          );

        setUsers(totalUsers);
        setDrivers(totalDrivers);
        setSubscriptions(
          activeSubscriptions
        );
        setRides(
          ridesSnapshot.size
        );
      } catch (error) {
        console.log(error);
      }
    };

  return (
    <SafeAreaView
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
      >
        <Text style={styles.title}>
          Tableau de bord Admin
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>
            👥 Utilisateurs
          </Text>

          <Text style={styles.value}>
            {users}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>
            🚕 Conducteurs
          </Text>

          <Text style={styles.value}>
            {drivers}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>
            📍 Courses
          </Text>

          <Text style={styles.value}>
            {rides}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>
            💰 Abonnements actifs
          </Text>

          <Text style={styles.value}>
            {subscriptions}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.push(
              "/(admin)/users"
            )
          }
        >
          <Text
            style={
              styles.buttonText
            }
          >
            Voir les utilisateurs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.secondaryButton
          }
          onPress={() =>
            router.push(
              "/(admin)/rides"
            )
          }
        >
          <Text
            style={
              styles.buttonText
            }
          >
            Voir les courses
          </Text>
        </TouchableOpacity>
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
      fontSize: 30,
      fontWeight: "bold",
      color: "#0B6E4F",
    },

    button: {
      backgroundColor:
        "#0B6E4F",
      height: 55,
      borderRadius: 12,
      justifyContent:
        "center",
      alignItems: "center",
      marginTop: 20,
    },

    secondaryButton: {
      backgroundColor:
        "#F4C300",
      height: 55,
      borderRadius: 12,
      justifyContent:
        "center",
      alignItems: "center",
      marginTop: 15,
    },

    buttonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "bold",
    },
  });