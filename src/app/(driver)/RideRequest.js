import { router, useLocalSearchParams } from "expo-router";
import { doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../../firebase/config";

export default function RideRequest() {
  const { rideId } = useLocalSearchParams();

  const [ride, setRide] = useState(null);

  useEffect(() => {
    if (!rideId) return;

    const unsubscribe = onSnapshot(
      doc(db, "rides", rideId),
      (snapshot) => {
        if (!snapshot.exists()) return;

        setRide({
          id: snapshot.id,
          ...snapshot.data(),
        });
      }
    );

    return () => unsubscribe();
  }, [rideId]);

  const acceptRide = async () => {
    await updateDoc(doc(db, "rides", ride.id), {
      status: "accepted",
      acceptedAt: serverTimestamp(),
    });

    router.replace("/(driver)/dashboard");
  };

  const rejectRide = async () => {
    await updateDoc(doc(db, "rides", ride.id), {
      status: "rejected",
    });

    router.back();
  };

  if (!ride) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        Nouvelle demande
      </Text>

      <View style={styles.card}>
        <Text style={styles.info}>
          👤 {ride.passengerName}
        </Text>

        <Text style={styles.info}>
          📞 {ride.passengerPhone}
        </Text>

        <Text style={styles.info}>
          💰 {ride.estimatedPrice} FCFA
        </Text>

        <Text style={styles.info}>
          📍 {(ride.estimatedDistance / 1000).toFixed(1)} km
        </Text>
      </View>

      <TouchableOpacity
        style={styles.accept}
        onPress={acceptRide}
      >
        <Text style={styles.buttonText}>
          ✅ Accepter
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.reject}
        onPress={rejectRide}
      >
        <Text style={styles.buttonText}>
          ❌ Refuser
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
    fontSize: 26,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#F7F7F7",
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },

  info: {
    fontSize: 18,
    marginBottom: 10,
  },

  accept: {
    backgroundColor: "#0B6E4F",
    padding: 18,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: "center",
  },

  reject: {
    backgroundColor: "#D32F2F",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 18,
  },
});