import { useEffect, useState } from "react";

import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { SafeAreaView } from "react-native-safe-area-context";

import Header from "../../components/Header";
import RideTrackingMap from "../../components/ride/RideTrackingMap";

import { db } from "../../../firebase/config";

import { getUser } from "../../storage/userStorage";

import {
  completeRide,
  driverArrived,
  driverArriving,
  startRide,
} from "../../../services/rideLifecycleService";

export default function CurrentRide() {

  const [driver, setDriver] = useState(null);

  const [ride, setRide] = useState(null);

  useEffect(() => {

    let unsubscribe;

    async function subscribeRide() {

      const currentDriver = await getUser();

      if (!currentDriver) return;

      setDriver(currentDriver);

      const q = query(
        collection(db, "rides"),
        where("driverId", "==", currentDriver.userId)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {

        let activeRide = null;

        snapshot.forEach((doc) => {

          const data = {
            id: doc.id,
            ...doc.data(),
          };

          if (
            [
              "accepted",
              "driver_arriving",
              "arrived",
              "started",
            ].includes(data.status)
          ) {

            activeRide = data;

          }

        });

        setRide(activeRide);

      });

    }

    subscribeRide();

    return () => {

      if (unsubscribe) {

        unsubscribe();

      }

    };

  }, []);

  async function handleDriverArriving() {

    try {

      await driverArriving(ride.id);

    } catch (error) {

      console.log(error);

      Alert.alert(
        "Erreur",
        "Impossible de mettre à jour le statut."
      );

    }

  }

  async function handleDriverArrived() {

    try {

      await driverArrived(ride.id);

    } catch (error) {

      console.log(error);

      Alert.alert(
        "Erreur",
        "Impossible de mettre à jour le statut."
      );

    }

  }

  async function handleStartRide() {

    try {

      await startRide(ride.id);

    } catch (error) {

      console.log(error);

      Alert.alert(
        "Erreur",
        "Impossible de démarrer la course."
      );

    }

  }

  async function handleCompleteRide() {

    try {

      await completeRide(ride.id);

    } catch (error) {

      console.log(error);

      Alert.alert(
        "Erreur",
        "Impossible de terminer la course."
      );

    }

  }

  function callPassenger() {

    if (!ride?.passengerPhone) return;

    Linking.openURL(
      `tel:${ride.passengerPhone}`
    );

  }

  if (!ride) {

    return (

      <SafeAreaView style={styles.container}>

        <Header
          title="Course en cours"
          profileRoute="/(driver)/profile"
        />

        <View style={styles.emptyContainer}>

          <Text style={styles.emptyText}>
            Aucune course en cours.
          </Text>

        </View>

      </SafeAreaView>

    );

  }

  return (

    <SafeAreaView style={styles.container}>

      <Header
        title="Course en cours"
        profileRoute="/(driver)/profile"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
      >

        <RideTrackingMap
          ride={ride}
          driver={driver}
          passenger={{
            latitude: ride.pickup?.latitude,
            longitude: ride.pickup?.longitude,
          }}
        />

        <View style={styles.card}>

          <Text style={styles.name}>
            {ride.passengerName}
          </Text>

          <Text style={styles.info}>
            📞 {ride.passengerPhone}
          </Text>

          <Text style={styles.info}>
            📍 Départ :
          </Text>

          <Text style={styles.value}>
            {ride.pickup?.address}
          </Text>

          <Text style={styles.info}>
            🎯 Destination :
          </Text>

          <Text style={styles.value}>
            {ride.destination?.address}
          </Text>

          <Text style={styles.price}>
            {ride.estimatedPrice} FCFA
          </Text>
                    {ride.status === "accepted" && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleDriverArriving}
            >
              <Text style={styles.buttonText}>
                🚕 Je suis en route
              </Text>
            </TouchableOpacity>
          )}

          {ride.status === "driver_arriving" && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleDriverArrived}
            >
              <Text style={styles.buttonText}>
                📍 Je suis arrivé
              </Text>
            </TouchableOpacity>
          )}

          {ride.status === "arrived" && (
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartRide}
            >
              <Text style={styles.buttonText}>
                ▶️ Démarrer la course
              </Text>
            </TouchableOpacity>
          )}

          {ride.status === "started" && (
            <TouchableOpacity
              style={styles.finishButton}
              onPress={handleCompleteRide}
            >
              <Text style={styles.buttonText}>
                🏁 Terminer la course
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.callButton}
            onPress={callPassenger}
          >
            <Text style={styles.buttonText}>
              📞 Appeler le passager
            </Text>
          </TouchableOpacity>

        </View>

      </ScrollView>

    </SafeAreaView>

  );

}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    fontSize: 18,
    color: "#777",
  },

  card: {
    margin: 15,
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    elevation: 3,
  },

  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginBottom: 10,
  },

  info: {
    marginTop: 10,
    fontWeight: "600",
    color: "#666",
  },

  value: {
    marginTop: 5,
    fontSize: 16,
    color: "#333",
  },

  price: {
    marginTop: 20,
    marginBottom: 20,
    fontSize: 26,
    fontWeight: "bold",
    color: "#0B6E4F",
  },

  primaryButton: {
    marginTop: 12,
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  startButton: {
    marginTop: 12,
    backgroundColor: "#F4B400",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  finishButton: {
    marginTop: 12,
    backgroundColor: "#0B6E4F",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  callButton: {
    marginTop: 12,
    backgroundColor: "#34A853",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },

});