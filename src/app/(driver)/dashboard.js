import {
    router,
    useFocusEffect,
} from "expo-router";
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
import React, {
    useEffect,
    useState,
} from "react";
import {
    ScrollView,
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
    timeoutRideRequest,
} from "../../../services/matching/rideRequestService";
import {
  prepareRideRequestSound,
  playRideRequestSound,
  stopRideRequestSound,
} from "../../../services/soundService";
import { isSubscriptionValid } from "../../../services/subscriptionService";
import AppHeader from "../../components/AppHeader";
import DebugRideRequest from "../../components/driver/DebugRideRequest";
import IncomingRideCard from "../../components/driver/IncomingRideCard";
import {
    getUser,
    saveUser,
} from "../../storage/userStorage";
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
  const [countdown, setCountdown] = useState(60);
  const [totalRides, setTotalRides] = useState(0);
  const [incomingRide, setIncomingRide] = useState(null);
  useFocusEffect(
  React.useCallback(() => {

  const refreshDashboard = async () => {
  try {
    console.log(
      "🔄 Actualisation du dashboard conducteur..."
    );

    const driver = await getUser();

    console.log(
      "🚗 Conducteur récupéré :",
      driver
    );

    if (!driver?.userId) {
      console.log(
        "❌ Conducteur connecté introuvable"
      );
      return;
    }

    await Promise.all([
      checkSubscription(driver),
      loadStats(driver),
    ]);

    console.log(
      "✅ Dashboard conducteur chargé"
    );

  } catch (error) {
    console.error(
      "❌ Erreur actualisation Dashboard :",
      error
    );

  } finally {
    setLoading(false);
  }
};

    refreshDashboard();

  }, [])
);
useEffect(() => {
  prepareRideRequestSound();

  return () => {
    stopRideRequestSound();
  };
}, []);
 useEffect(() => {

  let unsubscribeRide = null;

  const startRideListener = async () => {

    try {

      const driver = await getUser();

      if (!driver?.userId) {
        return;
      }

      console.log(
        "🎧 Écoute des demandes conducteur démarrée :",
        driver.userId
      );

      unsubscribeRide =
        listenIncomingRide(driver.userId);

    } catch (error) {

      console.error(
        "❌ Erreur écoute demandes conducteur :",
        error
      );

    }

  };

  startRideListener();

  return () => {

    if (unsubscribeRide) {
      unsubscribeRide();

      console.log(
        "🛑 Écoute des demandes conducteur arrêtée"
      );
    }

  };

}, []);

useEffect(() => {
  if (!incomingRide) {
    return;
  }

  console.log("⏱️ Compte à rebours démarré : 60 secondes");

  setCountdown(60);

  const interval = setInterval(() => {
    setCountdown((previous) => {
      if (previous <= 1) {
        clearInterval(interval);

        console.log("⏰ Compte à rebours terminé");

        return 0;
      }

      return previous - 1;
    });
  }, 1000);

  return () => {
    clearInterval(interval);
  };
}, [incomingRide]);
useEffect(() => {
  if (!incomingRide || countdown !== 0) {
    return;
  }

  const expireRequest = async () => {
    try {
      console.log(
        "⏰ Demande expirée après 60 secondes :",
        incomingRide.requestId
      );

      await stopRideRequestSound();

      await timeoutRideRequest(
        incomingRide.requestId
      );

      setIncomingRide(null);

    } catch (error) {
      console.error(
        "❌ Erreur expiration demande :",
        error
      );

      setIncomingRide(null);
    }
  };

  expireRequest();

}, [countdown, incomingRide]);
const listenIncomingRide = (userId) => {
  const q = query(
    collection(db, "ride_requests"),
    where("driverId", "==", userId),
    where("status", "==", "pending")
  );

  return onSnapshot(q, async (snapshot) => {

    if (snapshot.empty) {
      await stopRideRequestSound();
      setIncomingRide(null);
      return;
    }

    const request = snapshot.docs[0];

    const newRide = {
      id: request.data().rideId,
      requestId: request.id,
      ...request.data(),
    };

    console.log("🚨 NOUVELLE DEMANDE REÇUE");

    // 🔊 SON IMMÉDIAT
    playRideRequestSound();

    // 🚨 MODAL IMMÉDIAT
    setIncomingRide(newRide);

   
    
  });
};
  const checkSubscription = async (driver) => {
  try {
    if (!driver?.userId) {
      console.log(
        "❌ Impossible de vérifier l'abonnement : userId manquant"
      );

      setSubscriptionActive(false);
      return;
    }

    console.log(
      "🔎 Vérification abonnement Firestore :",
      driver.userId
    );

    // ============================================================
    // FIRESTORE = SOURCE DE VÉRITÉ
    // ============================================================

    const driverRef = doc(
      db,
      "users",
      driver.userId
    );

    const snapshot = await getDoc(driverRef);

    if (!snapshot.exists()) {
      console.log(
        "❌ Conducteur introuvable dans Firestore"
      );

      setSubscriptionActive(false);
      return;
    }

    const data = snapshot.data();
// ============================================================
// SYNCHRONISER FIRESTORE → STOCKAGE LOCAL
// ============================================================

await saveUser({
  ...driver,
  ...data,
});

console.log(
  "💾 Utilisateur local synchronisé avec Firestore"
);
    console.log(
      "🔥 Données abonnement Firestore :",
      {
        userId: data.userId,
        subscriptionActive:
          data.subscriptionActive,
        subscriptionExpiresAt:
          data.subscriptionExpiresAt,
        subscriptionPaidAt:
          data.subscriptionPaidAt,
      }
    );

    // ============================================================
    // VÉRIFIER L'EXPIRATION
    // ============================================================

    const valid =
      data.subscriptionActive === true &&
      isSubscriptionValid(
        data.subscriptionExpiresAt
      );

    console.log(
      "📅 Abonnement valide :",
      valid
    );

    // ============================================================
    // SI EXPIRÉ → DÉSACTIVER
    // ============================================================

    if (
      !valid &&
      data.subscriptionActive === true
    ) {
      console.log(
        "⛔ Abonnement expiré → désactivation"
      );

      await updateDoc(
        driverRef,
        {
          subscriptionActive: false,
        }
      );
    }

    // ============================================================
    // METTRE À JOUR L'ÉTAT DE L'ÉCRAN
    // ============================================================

    setSubscriptionActive(valid);

    // ============================================================
    // RÉCUPÉRER LES AUTRES DONNÉES CONDUCTEUR
    // ============================================================

   setAverageRating(
  typeof data.rating === "number"
    ? data.rating
    : 0
);

setTotalRatings(
  typeof data.ratingCount === "number"
    ? data.ratingCount
    : 0
);

    setIsOnline(
      data.isOnline === true
    );

  } catch (error) {
    console.error(
      "❌ Erreur vérification abonnement :",
      error
    );

    setSubscriptionActive(false);
  }
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

    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >

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
              router.push("/(driver)/subscription")
            }
          >
            <Text style={styles.activateText}>
              Activer maintenant
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* STATUT CONDUCTEUR */}
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
            onValueChange={toggleOnlineStatus}
            disabled={!subscriptionActive}
          />
        </View>
      </View>

      {/* REVENUS */}
      <View style={styles.card}>
        <Text style={styles.label}>
          Revenus aujourd'hui
        </Text>

        <Text style={styles.amount}>
          {totalRevenue} FCFA
        </Text>
      </View>

      {/* COURSES */}
      <View style={styles.card}>
        <Text style={styles.label}>
          Courses effectuées
        </Text>

        <Text style={styles.amount}>
          {totalRides}
        </Text>
      </View>

      {/* NOTE */}
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

      {/* DEMANDES */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          if (!subscriptionActive) {
            router.push("/(driver)/subscription");
            return;
          }

          router.push("/(driver)/requests");
        }}
      >
        <Text style={styles.buttonText}>
          Voir les demandes
        </Text>
      </TouchableOpacity>

      {/* REVENUS */}
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() =>
          router.push("/(driver)/earnings")
        }
      >
        <Text style={styles.secondaryText}>
          Mes revenus
        </Text>
      </TouchableOpacity>

      {/* COURSES */}
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() =>
          router.push("/(driver)/my-rides")
        }
      >
        <Text style={styles.secondaryText}>
          Mes courses
        </Text>
      </TouchableOpacity>

      {/* TEST */}
      <DebugRideRequest />

      <View style={styles.bottomSpace} />

    </ScrollView>

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
},
scrollView: {
  flex: 1,
},

contentContainer: {
  padding: 20,
  paddingBottom: 40,
},

bottomSpace: {
  height: 30,
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