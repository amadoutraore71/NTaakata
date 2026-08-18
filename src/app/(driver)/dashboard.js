import { router } from "expo-router";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    updateDoc,
    where
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../../firebase/config";
import {
    acceptRideRequest,
    rejectRideRequest,
} from "../../../services/matching/rideRequestService";
import {
    playRideRequestSound,
    stopRideRequestSound,
} from "../../../services/soundService";
import AppHeader from "../../components/AppHeader";
import IncomingRideCard from "../../components/driver/IncomingRideCard";
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
  const [countdown, setCountdown] = useState(20);
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
  useEffect(() => {
    if (!incomingRide) return;
    playRideRequestSound();
    setCountdown(20);

    const timer = setInterval(() => {
      setCountdown((value) => value - 1);
    }, 1000);

    return () => clearInterval(timer);

  }, [incomingRide]);
  useEffect(() => {
    if (!incomingRide) return;

    if (countdown !== 0) return;

    rejectRide();

  }, [countdown, incomingRide]);
  const listenIncomingRide = (userId) => {

    const q = query(
      collection(db, "ride_requests"),
      where("driverId", "==", userId),
      where("status", "==", "pending")
    );
    return onSnapshot(q, async (snapshot) => {

      if (snapshot.empty) {
        setIncomingRide(null);
        return;
      }

      const request = snapshot.docs[0];

      setIncomingRide({
        id: request.data().rideId,
        requestId: request.id,
        ...request.data(),
      });


    });
  }
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
  const acceptRide = async () => {
    if (!incomingRide) return;

    try {
      await stopRideRequestSound();

      await acceptRideRequest(
        incomingRide.requestId
      );

      setIncomingRide(null);

      router.push({
        pathname: "/(driver)/RideStatus",
        params: {
          rideId: incomingRide.id,
        },
      });

    } catch (error) {
      console.log(error);
    }
  };

  const rejectRide = async () => {
    if (!incomingRide) return;

    try {

      await stopRideRequestSound();

      await rejectRideRequest(
        incomingRide.requestId
      );

      setIncomingRide(null);

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
      <IncomingRideCard
        visible={!!incomingRide}
        request={incomingRide}
        countdown={countdown}
        onAccept={acceptRide}
        onReject={rejectRide}
      />
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
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalCard: {
    width: "90%",
    backgroundColor: "#FFF",
    borderRadius: 25,
    padding: 25,
    elevation: 20,
  },

  requestText: {
    fontSize: 18,
    marginTop: 12,
  },

  buttonRow: {
    flexDirection: "row",
    marginTop: 30,
  },

  buttonLabel: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 17,
  },
  priceCard: {
    backgroundColor: "#EAF8F2",
    borderRadius: 15,
    padding: 18,
    marginVertical: 15,
    alignItems: "center",
  },

  priceLabel: {
    color: "#666",
    fontSize: 14,
  },

  priceValue: {
    marginTop: 5,
    fontSize: 28,
    fontWeight: "bold",
    color: "#0B6E4F",
  },
  requestBadge: {
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 2,
    borderRadius: 5,
    backgroundColor: "#FFF",
  },

  requestBadgeText: {
    color: "#0B6E4F",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 1,
  },
});