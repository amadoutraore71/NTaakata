import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import Header from "../../components/Header";

import { db } from "../../../firebase/config";

import { getUser } from "../../storage/userStorage";

import {
  completeRide,
  startRide,
} from "../../../services/rideLifecycleService";

export default function MyRides() {

  const [rides, setRides] = useState([]);

  const [driver, setDriver] = useState(null);

  const [totalRevenue, setTotalRevenue] =
    useState(0);

  useEffect(() => {
    loadRides();
  }, []);

  async function loadRides() {

    try {

      const currentDriver =
        await getUser();

      if (!currentDriver) {
        return;
      }

      setDriver(currentDriver);

      const snapshot =
        await getDocs(
          collection(db, "rides")
        );

      const myRides = [];

      let revenue = 0;

      snapshot.forEach((doc) => {

        const ride = doc.data();

        if (
          ride.driverId ===
          currentDriver.userId
        ) {

          myRides.push({
            id: doc.id,
            ...ride,
          });

          if (
            ride.status ===
            "completed"
          ) {

            revenue += Number(
              ride.estimatedPrice || 0
            );

          }

        }

      });

      myRides.sort((a, b) => {

        const dateA =
          a.createdAt?.seconds || 0;

        const dateB =
          b.createdAt?.seconds || 0;

        return dateB - dateA;

      });

      setRides(myRides);

      setTotalRevenue(revenue);

    } catch (error) {

      console.log(error);

    }

  }

  async function handleStartRide(
    rideId
  ) {

    try {

      await startRide(rideId);

      Alert.alert(
        "Succès",
        "La course a démarré."
      );

      loadRides();

    } catch (error) {

      console.log(error);

      Alert.alert(
        "Erreur",
        "Impossible de démarrer la course."
      );

    }

  }

  async function handleCompleteRide(
    rideId
  ) {

    try {

      await completeRide(rideId);

      Alert.alert(
        "Succès",
        "La course est terminée."
      );

      loadRides();

    } catch (error) {

      console.log(error);

      Alert.alert(
        "Erreur",
        "Impossible de terminer la course."
      );

    }

  }

  return (

    <SafeAreaView
      style={styles.container}
    >

      <Header
        title="Mes Courses"
        profileRoute="/(driver)/profile"
      />

      <Text style={styles.title}>
        Mes Courses
      </Text>

      <View
        style={styles.revenueCard}
      >

        <Text
          style={styles.revenueLabel}
        >
          Revenus totaux
        </Text>

        <Text
          style={styles.revenue}
        >
          {totalRevenue} FCFA
        </Text>

      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
      >

        {rides.length === 0 ? (

          <Text style={styles.empty}>
            Aucune course trouvée.
          </Text>

        ) : (

          rides.map((ride) => (

            <View
              key={ride.id}
              style={styles.card}
            >

              <Text style={styles.route}>
                👤 {ride.passengerName}
              </Text>

              <Text style={styles.route}>
                📞 {ride.passengerPhone}
              </Text>

              <Text style={styles.route}>
                📍 {ride.pickup}
              </Text>

              <Text style={styles.route}>
                🎯 {ride.destination}
              </Text>

              <Text style={styles.price}>
                💰 {ride.estimatedPrice} FCFA
              </Text>

              <Text style={styles.route}>
                📅{" "}
                {ride.createdAt?.seconds
                  ? new Date(
                    ride.createdAt.seconds *
                    1000
                  ).toLocaleDateString()
                  : "-"}
              </Text>

              <Text style={styles.status}>
                🚕 Statut : {ride.status}
              </Text>
              {ride.status === "accepted" && (
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() =>
                    handleStartRide(ride.id)
                  }
                >
                  <Text style={styles.buttonText}>
                    ▶️ Démarrer la course
                  </Text>
                </TouchableOpacity>
              )}

              {ride.status === "started" && (
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={() =>
                    handleCompleteRide(
                      ride.id
                    )
                  }
                >
                  <Text style={styles.buttonText}>
                    🏁 Terminer la course
                  </Text>
                </TouchableOpacity>
              )}

              {ride.status === "completed" && (
                <View
                  style={
                    styles.completedBadge
                  }
                >
                  <Text
                    style={
                      styles.completedText
                    }
                  >
                    ✅ Course terminée
                  </Text>
                </View>
              )}

            </View>

          ))

        )}

      </ScrollView>

    </SafeAreaView>

  );

}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginBottom: 20,
  },

  revenueCard: {
    backgroundColor: "#FFF7D6",
    borderRadius: 15,
    padding: 18,
    marginBottom: 20,
  },

  revenueLabel: {
    color: "#666",
    fontSize: 15,
  },

  revenue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginTop: 8,
  },

  empty: {
    textAlign: "center",
    marginTop: 60,
    color: "#666",
    fontSize: 16,
  },

  card: {
    backgroundColor: "#F8F8F8",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },

  route: {
    fontSize: 16,
    marginBottom: 6,
    color: "#333",
  },

  price: {
    marginTop: 10,
    marginBottom: 8,
    fontSize: 18,
    fontWeight: "bold",
    color: "#0B6E4F",
  },

  status: {
    marginTop: 8,
    marginBottom: 10,
    fontWeight: "700",
    color: "#444",
  },

  startButton: {
    backgroundColor: "#F4C300",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },

  completeButton: {
    backgroundColor: "#0B6E4F",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },

  completedBadge: {
    marginTop: 15,
    backgroundColor: "#D4EDDA",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  completedText: {
    color: "#155724",
    fontWeight: "bold",
    fontSize: 15,
  },

});