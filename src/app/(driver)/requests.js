import {
  useEffect,
  useState,
} from "react";
import {
  Alert,

  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { router } from "expo-router";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../firebase/config";
import AppHeader from "../../components/AppHeader";
import { getUser } from "../../storage/userStorage";

export default function Requests() {
  const [requests, setRequests] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const driver = await getUser();
      console.log("USER COMPLET =", driver);
      console.log("DRIVER COMPLET =", driver);
      console.log("USER COMPLET =", driver);
      if (!driver) {
        setLoading(false);
        return;
      }

      console.log(
        "Conducteur connecté :",
        driver.vehicleType
      );

      const querySnapshot = await getDocs(
  collection(db, "ride_requests")
);
const requests = [];

querySnapshot.forEach((docItem) => {
  const data = docItem.data();

  if (
    data.driverId === driver.userId &&
    data.status === "pending"
  ) {
    requests.push({
      id: docItem.id,
      ...data,
    });
  }
});

setRequests(requests);
console.log("REQUESTS =", requests);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };



const acceptRide = async (ride) => {
  try {
    const driver = await getUser();

    console.log("Conducteur connecté :", driver);

    // ✅ Étape 1 : mettre à jour la demande
    await updateDoc(
      doc(db, "ride_requests", ride.id),
      {
        status: "accepted",
        acceptedAt: new Date(),
      }
    );

    // ✅ Étape 2 : mettre à jour la course
  // 1. La demande
await updateDoc(
  doc(db, "ride_requests", ride.id),
  {
    status: "accepted",
    acceptedAt: new Date(),
  }
);

// 2. La course
await updateDoc(
  doc(db, "rides", ride.rideId),
  {
    status: "accepted",

    driverId: driver.userId,
    driverName: driver.name,
    driverPhone: driver.phone,
    vehicleType: driver.vehicleType,

    acceptedAt: new Date(),
  }
);

    Alert.alert(
      "Succès",
      "Course acceptée"
    );

    router.push("/(driver)/current-ride");

  } catch (error) {
    console.log(error);

    Alert.alert(
      "Erreur",
      "Impossible d'accepter la course"
    );
  }
};

 const rejectRide = async (ride) => {
  try {

    await updateDoc(
      doc(db, "ride_requests", ride.id),
      {
        status: "rejected",
        rejectedAt: new Date(),
      }
    );

    Alert.alert(
      "Succès",
      "Course refusée"
    );

    loadRequests();

  } catch (error) {
    console.log(error);

    Alert.alert(
      "Erreur",
      "Impossible de refuser la course"
    );
  }
};
  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.container
        }
      >
        <Text
          style={styles.title}
        >
          Demandes de courses
        </Text>

        <Text
          style={
            styles.emptyText
          }
        >
          Chargement...
        </Text>
      </SafeAreaView>
    );
  }

  if (
    requests.length === 0
  ) {
    return (
      <SafeAreaView
        style={
          styles.container
        }
      >
        <Text
          style={styles.title}
        >
          Demandes de courses
        </Text>

        <Text
          style={
            styles.emptyText
          }
        >
          Aucune demande disponible
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView

      style={styles.container}
    >
      <AppHeader
        title="Demandes de courses"
        profileRoute="/(driver)/profile"
      />

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
      >
        {requests.map(
          (ride) => (
            <View
              key={ride.id}
              style={styles.card}
            >
              <Text
                style={
                  styles.passenger
                }
              >
                👤{" "}
                {ride.passengerName ||
                  ride.passengerPhone}
              </Text>

              <Text
                style={styles.info}
              >
                📍 Départ : {ride.pickup?.address|| "Position actuelle"}
              </Text>

              <Text
                style={styles.info}
              >
                🎯 Destination : {ride.destination?.address || "Destination"}
              </Text>

              <Text style={styles.info}>
                {ride.vehicleType === "moto"
                  ? "🏍️ Moto"
                  : "🚗 Voiture"}
              </Text>

              <Text
                style={
                  styles.price
                }
              >
                💰 {ride.estimatedPrice} FCFA
              </Text>

              <View
                style={
                  styles.buttons
                }
              >
                <TouchableOpacity
                  style={
                    styles.acceptButton
                  }
                  onPress={() =>
                    acceptRide(
                      ride
                    )
                  }
                >
                  <Text
                    style={
                      styles.buttonText
                    }
                  >
                    Accepter
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.rejectButton
                  }
                  onPress={() =>
                    rejectRide(
                      ride
                    )
                  }
                >
                  <Text
                    style={
                      styles.buttonText
                    }
                  >
                    Refuser
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginBottom: 20,
  },

  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#666",
  },

  card: {
    backgroundColor: "#F8F8F8",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },

  passenger: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  info: {
    color: "#555",
    marginBottom: 5,
  },

  price: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "bold",
    color: "#0B6E4F",
  },

  buttons: {
    flexDirection: "row",
    marginTop: 15,
    justifyContent: "space-between",
  },

  acceptButton: {
    flex: 1,
    backgroundColor: "#0B6E4F",
    padding: 12,
    borderRadius: 10,
    marginRight: 5,
    alignItems: "center",
  },

  rejectButton: {
    flex: 1,
    backgroundColor: "#E53935",
    padding: 12,
    borderRadius: 10,
    marginLeft: 5,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});