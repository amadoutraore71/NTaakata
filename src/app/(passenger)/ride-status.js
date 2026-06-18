import {
  useEffect,
  useState,
} from "react";

import { router } from "expo-router";
import {
  collection,
  onSnapshot,
} from "firebase/firestore";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { db } from "../../../firebase/config";
import { getUser } from "../../storage/userStorage";

export default function RideStatus() {
  const [ride, setRide] =
    useState(null);

  const [loading, setLoading] =
    useState(true);
useEffect(() => {
  if (
    ride?.status === "completed" &&
    ride?.driverPhone &&
    !ride.ratingSubmitted
  ) {
    router.push({
      pathname:
        "/(passenger)/rate-driver",
      params: {
        rideId: ride.id,
        driverPhone:
          ride.driverPhone,
        driverName:
          ride.driverName,
      },
    });
  }
}, [ride]);
  useEffect(() => {
  let unsubscribe;

  const init = async () => {
    const user =
      await getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    unsubscribe =
      onSnapshot(
        collection(db, "rides"),
        (snapshot) => {
          let lastRide = null;

          snapshot.forEach(
            (document) => {
              const data =
                document.data();

              if (
                data.passengerPhone ===
                user.phone
              ) {
                lastRide = {
                  id: document.id,
                  ...data,
                };
              }
            }
          );
snapshot.forEach((document) => {
  const data = document.data();

  if (
    data.passengerPhone ===
    user.phone
  ) {
    console.log(
      "COURSE TROUVEE =",
      document.id,
      data.status
    );

    if (
      !lastRide ||
      new Date(data.createdAt) >
        new Date(lastRide.createdAt)
    ) {
      lastRide = {
        id: document.id,
        ...data,
      };
    }
  }
});
          setRide(lastRide);
          setLoading(false);
        }
      );
  };

  init();

  return () => {
    if (unsubscribe)
      unsubscribe();
  };
}, []);


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
          📏 Distance
        </Text>

        <Text style={styles.value}>
          {ride.distance || 0} km
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
          "🚕 Chauffeur trouvé et en route"}

        {ride.status === "in_progress" &&
          "🛣️ Course en cours"}

        {ride.status === "completed" &&
          "✅ Course terminée"}
      </Text>
    
        {ride.driverName && (
  <>
            <Text style={styles.label}>
              👤 Chauffeur
            </Text>

            <Text style={styles.value}>
              {ride.driverName}
            </Text>
          </>
        )}
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
         
            {ride.vehicleType && (
            <>
              <Text style={styles.label}>
                🚗 Véhicule
              </Text>

              <Text style={styles.value}>
                {ride.vehicleType}
              </Text>
            </>
          )}
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