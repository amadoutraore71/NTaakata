import {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../../../firebase/config";
import { getUser } from "../../storage/userStorage";

export default function RideStatus() {
  const [ride, setRide] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadRide();

    const interval =
      setInterval(() => {
        loadRide();
      }, 3000);

    return () =>
      clearInterval(interval);
  }, []);

  const loadRide = async () => {
    try {
      const user =
        await getUser();

      if (!user) return;

      const querySnapshot =
        await getDocs(
          collection(db, "rides")
        );

      let lastRide = null;

      querySnapshot.forEach(
        (doc) => {
          const data =
            doc.data();

          if (
            data.passengerPhone ===
            user.phone
          ) {
            lastRide = {
              id: doc.id,
              ...data,
            };
          }
        }
      );

      setRide(lastRide);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.center}
      >
        <ActivityIndicator
          size="large"
          color="#0B6E4F"
        />
      </SafeAreaView>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView
        style={styles.center}
      >
        <Text>
          Aucune course trouvée
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      <Text style={styles.title}>
        Suivi de la course
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>
          📍 Départ
        </Text>

        <Text style={styles.value}>
          {ride.pickup}
        </Text>

        <Text style={styles.label}>
          🎯 Destination
        </Text>

        <Text style={styles.value}>
          {ride.destination}
        </Text>

        <Text style={styles.label}>
          💰 Prix
        </Text>

        <Text style={styles.value}>
          {ride.price} FCFA
        </Text>

        <Text style={styles.label}>
          🚕 Statut
        </Text>

     <Text style={[
    styles.status,
    {
      color:
        ride.status === "completed"
          ? "green"
          : ride.status === "in_progress"
          ? "#F4C300"
          : "#0B6E4F",
    },
  ]}>
        {ride.status === "pending" &&
          "🔍 Recherche d'un chauffeur..."}

        {ride.status === "accepted" &&
          "🚕 Chauffeur trouvé"}

        {ride.status === "in_progress" &&
          "🛣️ Course en cours"}

        {ride.status === "completed" &&
          "✅ Course terminée"}
      </Text>
        {ride.driverPhone && (
          <>
            <Text
              style={
                styles.label
              }
            >
              📞 Chauffeur
            </Text>

            <Text
              style={
                styles.value
              }
            >
              {
                ride.driverPhone
              }
            </Text>
          </>
        )}
      </View>
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

    center: {
      flex: 1,
      justifyContent:
        "center",
      alignItems: "center",
    },

    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#0B6E4F",
      marginBottom: 20,
    },

    card: {
      backgroundColor:
        "#F8F8F8",
      borderRadius: 15,
      padding: 20,
    },

    label: {
      fontWeight: "bold",
      marginTop: 15,
      color: "#555",
    },

    value: {
      fontSize: 18,
      marginTop: 5,
    },

   status: {
      marginTop: 15,
      fontSize: 18,
      fontWeight: "bold",
    },
  });