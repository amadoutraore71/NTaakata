import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  doc, onSnapshot,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";


import { db } from "../../../firebase/config";
import AppHeader from "../../components/AppHeader";


export default function RideStatus() {
  const { rideId } = useLocalSearchParams();
  const [ride, setRide] = useState(null);

  useEffect(() => {
    if (!rideId) return;

    const unsubscribe = onSnapshot(
      doc(db, "rides", rideId),
      (snapshot) => {
        if (!snapshot.exists()) return;

        const rideData = {
          id: snapshot.id,
          ...snapshot.data(),
        };

        console.log("Course mise à jour :", rideData);

        setRide(rideData);
      }
    );

    return () => unsubscribe();
  }, [rideId]);

  useEffect(() => {
    if (!ride) return;

    if (ride.status === "completed") {
      router.replace({
        pathname: "/(passenger)/rate-driver",
        params: {
          rideId: ride.id,
          driverPhone: ride.driverPhone,
          driverName: ride.driverName,
        },
      });
    }
  }, [ride]);

  return (
    <SafeAreaView style={styles.container}>

      <AppHeader
        title="Statut de la course"
        profileRoute="/(passenger)/profile"
      />
      {!ride && (
        <Text style={styles.searching}>
          🔍 Recherche d'un conducteur...
        </Text>
      )}

      {ride &&
        ride.status === "pending" && (
          <Text style={styles.searching}>
            🔍 Recherche d'un conducteur...
          </Text>
        )}
      {ride &&
        ride.status === "accepted" && (
          <View style={styles.card}>
            <Text style={styles.success}>
              ✅ Conducteur trouvé
            </Text>

            <Text style={styles.info}>
              👤 {ride.driverName}
            </Text>

            <Text style={styles.info}>
              📞 {ride.driverPhone}
            </Text>

            <Text style={styles.info}>
              🚕 {ride.vehicleType}
            </Text>

            <Text style={styles.info}>
              💰 {ride.price} FCFA
            </Text>

            <Text style={styles.info}>
              ⏳ Le conducteur arrive...
            </Text>
          </View>
        )}
      {ride &&
        ride.status === "started" && (
          <View style={styles.card}>
            <Text style={styles.success}>
              🚕 Votre course est en cours
            </Text>

            <Text style={styles.info}>
              👤 {ride.driverName}
            </Text>

            <Text style={styles.info}>
              📞 {ride.driverPhone}
            </Text>

            <Text style={styles.info}>
              📍 Le conducteur est en route...
            </Text>
          </View>
        )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFFFFF",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginBottom: 20,
  },

  searching: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 100,
  },

  card: {
    backgroundColor: "#F8F8F8",
    padding: 20,
    borderRadius: 15,
  },

  success: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginBottom: 15,
  },

  info: {
    fontSize: 18,
    marginBottom: 10,
  },
});