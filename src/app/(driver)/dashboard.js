import { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../../firebase/config";
import AppHeader from "../../components/AppHeader";
import { getUser } from "../../storage/userStorage";
import { isSubscriptionValid } from "../../utils/subscriptionChecker";
import DriverLocation from "./driver-location";
export default function DriverDashboard() {
  const [subscriptionActive, setSubscriptionActive] =
    useState(false);

  const [loading, setLoading] =
    useState(true);
  const [isOnline, setIsOnline] =
    useState(false);
  const [totalRevenue, setTotalRevenue] =
    useState(0);
  const [averageRating, setAverageRating] =
    useState(0);

  const [totalRatings, setTotalRatings] =
    useState(0);
  const [totalRides, setTotalRides] = useState(0);
  const [incomingRide, setIncomingRide] = useState(null);
useEffect(() => {

  let unsubscribeRide;

  const init = async () => {

    const driver = await getUser();

    if (!driver?.userId) {

      setLoading(false);
      return;

    }

    await Promise.all([
      checkSubscription(driver),
      loadStats(driver),
    ]);

    unsubscribeRide =
      listenIncomingRide(driver.userId);

    setLoading(false);

  };

  init();

  return () => {

    if (unsubscribeRide) {
      unsubscribeRide();
    }

  };

}, []);
const listenIncomingRide = (userId) => {

  const q = query(
    collection(db, "rides"),
    where("driverId", "==", userId),
    where("status", "==", "pending")
  );

  return onSnapshot(q, (snapshot) => {

    if (snapshot.empty) {

      setIncomingRide(null);

      return;

    }

    const ride = {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data(),
    };

    setIncomingRide(ride);

  });

};
const initDashboard = async () => {

  try {

    const driver = await getUser();

    if (!driver?.userId) {

      setLoading(false);

      return;

    }

    await Promise.all([

      checkSubscription(driver),

      loadStats(driver),

    ]);

  } catch (error) {

    console.log(error);

  } finally {

    setLoading(false);

  }

};
const checkSubscription = async (driver) => {

  const driverRef = doc(
    db,
    "users",
    driver.userId
  );

  const snapshot =
    await getDoc(driverRef);

  if (!snapshot.exists()) return;

  const data = snapshot.data();

  setAverageRating(
    data.averageRating || 0
  );

  setTotalRatings(
    data.totalRatings || 0
  );

  setIsOnline(
    data.isOnline || false
  );

  const valid =
    isSubscriptionValid(
      data.subscriptionExpiresAt
    );

  if (
    !valid &&
    data.subscriptionActive
  ) {

    await updateDoc(
      driverRef,
      {
        subscriptionActive: false,
      }
    );

  }

  setSubscriptionActive(valid);

};
const loadStats = async (driver) => {

  const q = query(

    collection(db, "rides"),

    where(
      "driverId",
      "==",
      driver.userId
    )

  );

  const snapshot =
    await getDocs(q);

  let revenue = 0;

  let rides = 0;

  snapshot.forEach((document) => {

    const ride = document.data();

    if (
      ride.status === "completed"
    ) {

      rides++;

      revenue += Number(
        ride.estimatedPrice || 0
      );

    }

  });

  setTotalRevenue(revenue);

  setTotalRides(rides);

};

const toggleOnlineStatus =
  async (value) => {

    try {

      const driver =
        await getUser();

      if (!driver) return;

      await updateDoc(

        doc(
          db,
          "users",
          driver.userId
        ),

        {
          isOnline: value,
        }

      );

      setIsOnline(value);

    } catch (error) {

      console.log(error);

    }

  };


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>

        <Text style={styles.loading}>
          Chargement...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      <DriverLocation />

      <AppHeader
        title="Tableau de bord"
        profileRoute="/(driver)/profile"
      />

      {!subscriptionActive && (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            🔒 Votre abonnement conducteur n'est pas actif.
          </Text>

          <Text style={styles.warningSubText}>
            Activez votre abonnement journalier de
            100 FCFA pour recevoir des demandes
            de courses.
          </Text>

          <TouchableOpacity
            style={styles.activateButton}
            onPress={() =>
              router.push(
                "/(driver)/subscription"
              )
            }
          >
            <Text style={styles.activateText}>
              Activer maintenant
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>
          Statut Chauffeur
        </Text>

        <View style={styles.statusRow}>
          <Text style={styles.activeText}>
            {isOnline
              ? "🟢 En ligne"
              : "🔴 Hors ligne"}
          </Text>

          <Switch
            value={isOnline}
            onValueChange={
              toggleOnlineStatus
            }
            disabled={
              !subscriptionActive
            }
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>
          Revenus aujourd'hui
        </Text>

        <Text style={styles.amount}>
          {totalRevenue} FCFA
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>
          Courses effectuées
        </Text>

        <Text style={styles.amount}>
          {totalRides}
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>
          Note du conducteur
        </Text>

        <Text style={styles.amount}>
          ⭐ {Number(averageRating).toFixed(1)}/5
        </Text>

        <Text
          style={{
            color: "#666",
            marginTop: 5,
          }}
        >
          {totalRatings} avis
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          if (!subscriptionActive) {
            router.push(
              "/(driver)/subscription"
            );
            return;
          }

          router.push(
            "/(driver)/requests"
          );
        }}
      >
        <Text style={styles.buttonText}>
          Voir les demandes
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() =>
          router.push(
            "/(driver)/earnings"
          )
        }
      >
        <Text style={styles.secondaryText}>
          Mes revenus
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() =>
          router.push(
            "/(driver)/my-rides"
          )
        }
      >
        <Text style={styles.secondaryText}>
          Mes courses
        </Text>
      </TouchableOpacity>
      {incomingRide && (

<View style={styles.requestCard}>

<Text style={styles.requestTitle}>
🚖 Nouvelle demande
</Text>

<Text>
👤 {incomingRide.passengerName}
</Text>

<Text>
📞 {incomingRide.passengerPhone}
</Text>

<Text>
💰 {incomingRide.estimatedPrice} FCFA
</Text>

<View
style={{
flexDirection:"row",
marginTop:20
}}
>

<TouchableOpacity
style={styles.rejectButton}
>

<Text style={{color:"#FFF"}}>
REFUSER
</Text>

</TouchableOpacity>

<TouchableOpacity
style={styles.acceptButton}
>

<Text style={{color:"#FFF"}}>
ACCEPTER
</Text>

</TouchableOpacity>

</View>

</View>

)}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 20,
    marginTop: 100,
  },

  loading: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 50,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#0B6E4F",
  },
  warningCard: {
    backgroundColor: "#FFF3CD",
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FFE69C",
  },

  warningText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#856404",
    marginBottom: 8,
  },

  warningSubText: {
    color: "#856404",
    marginBottom: 15,
    lineHeight: 20,
  },

  activateButton: {
    backgroundColor: "#F4C300",
    height: 45,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  activateText: {
    fontWeight: "bold",
    fontSize: 15,
  },

  statusCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },

  statusTitle: {
    fontWeight: "bold",
    marginBottom: 10,
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  activeText: {
    fontSize: 16,
    fontWeight: "600",
  },

  card: {
    backgroundColor: "#F8F8F8",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },

  label: {
    color: "#666",
  },

  amount: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginTop: 5,
  },

  button: {
    backgroundColor: "#F4C300",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },

  buttonText: {
    fontWeight: "bold",
    fontSize: 16,
  },

  secondaryButton: {
    backgroundColor: "#0B6E4F",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },

  secondaryText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  requestCard: {
  position: "absolute",
  left: 15,
  right: 15,
  bottom: 20,
  backgroundColor: "#FFF",
  borderRadius: 20,
  padding: 20,
  elevation: 12,
},

requestTitle: {
  fontSize: 22,
  fontWeight: "bold",
  marginBottom: 15,
},

acceptButton: {
  flex: 1,
  backgroundColor: "#0B6E4F",
  height: 50,
  borderRadius: 10,
  justifyContent: "center",
  alignItems: "center",
  marginLeft: 10,
},

rejectButton: {
  flex: 1,
  backgroundColor: "#E53935",
  height: 50,
  borderRadius: 10,
  justifyContent: "center",
  alignItems: "center",
  marginRight: 10,
},
});