import { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../../firebase/config";
import AppHeader from "../../components/AppHeader";
import { getUser } from "../../storage/userStorage";
export default function CurrentRide() {

  const [ride, setRide] = useState(null);

  useEffect(() => {
    let unsubscribe;

    const init = async () => {
      unsubscribe = await loadRide();
    };

    init();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const loadRide = async () => {

    const driver = await getUser();

    const q = query(
      collection(db, "rides"),
      where("driverPhone", "==", driver.phone)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {

      snapshot.forEach((docItem) => {

        const data = docItem.data();

        if (
          data.status === "accepted" ||
          data.status === "started"
        ) {
          setRide({
            id: docItem.id,
            ...data,
          });
        }

      });

    });

    return unsubscribe;

  };

  const startRide = async () => {

    await updateDoc(
      doc(db, "rides", ride.id),
      {
        status: "started",
      }
    );

  };

  const finishRide = async () => {

    await updateDoc(
      doc(db, "rides", ride.id),
      {
        status: "completed",
      }
    );

    Alert.alert(
      "Succès",
      "Course terminée"
    );

    router.replace("/(driver)/dashboard");

  };

  if (!ride) {

    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>
          Aucune course
        </Text>
      </SafeAreaView>
    );

  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Course actuelle"
        profileRoute="/(driver)/profile"
      />

      <View style={styles.card}>

        <Text style={styles.info}>
          👤 {ride.passengerName}
        </Text>

        <Text style={styles.info}>
          📞 {ride.passengerPhone}
        </Text>

        <Text style={styles.info}>
          📍 {ride.pickup}
        </Text>

        <Text style={styles.info}>
          🎯 {ride.destination}
        </Text>

        <Text style={styles.info}>
          💰 {ride.price} FCFA
        </Text>

      </View>

      {ride.status === "accepted" && (

        <TouchableOpacity
          style={styles.button}
          onPress={startRide}
        >

          <Text style={styles.buttonText}>
            ▶️ Démarrer la course
          </Text>

        </TouchableOpacity>

      )}

      {ride.status === "started" && (

        <TouchableOpacity
          style={styles.finish}
          onPress={finishRide}
        >

          <Text style={styles.buttonText}>
            🏁 Terminer la course
          </Text>

        </TouchableOpacity>

      )}

    </SafeAreaView>
  );

}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#F8F8F8",
    borderRadius: 15,
    padding: 20,
  },

  info: {
    fontSize: 18,
    marginBottom: 10,
  },

  button: {
    marginTop: 30,
    backgroundColor: "#0B6E4F",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },

  finish: {
    marginTop: 30,
    backgroundColor: "#E53935",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },

});