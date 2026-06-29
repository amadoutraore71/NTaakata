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

export default function Drivers() {
  const [drivers, setDrivers] =
    useState([]);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const usersSnapshot =
        await getDocs(
          collection(db, "users")
        );

      const driversList = [];

      usersSnapshot.forEach(
        (document) => {
          const user =
            document.data();

          if (
            user.role === "driver"
          ) {
            driversList.push({
              id: document.id,
              ...user,
            });
          }
        }
      );

      setDrivers(driversList);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
    >
      <Text style={styles.title}>
        Conducteurs
      </Text>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
      >
        {drivers.length === 0 ? (
          <Text style={styles.empty}>
            Aucun conducteur
          </Text>
        ) : (
          drivers.map((driver) => (
            <View
              key={driver.userId}
              style={styles.card}
            >
              <Text style={styles.name}>
                👤 {driver.name}
              </Text>

              <Text style={styles.info}>
                📞 {driver.phone}
              </Text>

              <Text style={styles.info}>
                💰 Abonnement :
                {" "}
                {driver.subscriptionActive
                  ? "Actif"
                  : "Inactif"}
              </Text>

              <Text style={styles.info}>
                💵 Frais journalier :
                {" "}
                {driver.dailyFee || 0}
                {" "}
                FCFA
              </Text>

              <Text
                style={[
                  styles.status,
                  {
                    color:
                      driver.subscriptionActive
                        ? "green"
                        : "red",
                  },
                ]}
              >
                {driver.subscriptionActive
                  ? "🟢 Autorisé à recevoir des courses"
                  : "🔴 Abonnement expiré"}
              </Text>
            </View>
          ))
        )}
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
      marginBottom: 20,
    },

    empty: {
      textAlign: "center",
      marginTop: 50,
      color: "#666",
    },

    card: {
      backgroundColor:
        "#F8F8F8",
      borderRadius: 15,
      padding: 15,
      marginBottom: 15,
    },

    name: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
    },

    info: {
      color: "#555",
      marginBottom: 5,
    },

    status: {
      marginTop: 10,
      fontWeight: "bold",
    },
  });