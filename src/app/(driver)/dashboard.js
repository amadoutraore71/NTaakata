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
    useRef,
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
  const [totalRides, setTotalRides] = useState(0);
  const [incomingRides, setIncomingRides] = useState([]);
  const [requestCountdowns, setRequestCountdowns] = useState({});
  const [actionRequestId, setActionRequestId] = useState(null);
  const incomingRidesRef = useRef([]);
  const countdownsRef = useRef({});
  const expiringRef = useRef(new Set());
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

      // ============================================================
      // HORS LIGNE / ABONNEMENT INACTIF = AUCUNE DEMANDE À ÉCOUTER
      // ============================================================
      if (!isOnline || !subscriptionActive) {
        console.log(
          "⏸️ Écoute demandes non démarrée : conducteur hors ligne ou abonnement inactif"
        );

        setIncomingRides([]);
        setRequestCountdowns({});
        countdownsRef.current = {};
        expiringRef.current.clear();
        await stopRideRequestSound();
        return;
      }

      console.log(
        "🎧 Écoute des demandes conducteur démarrée :",
        driver.userId
      );

      unsubscribeRide = listenIncomingRide(driver.userId);
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

    // Nettoyage immédiat lors du passage hors ligne
    if (!isOnline || !subscriptionActive) {
      setIncomingRides([]);
      setRequestCountdowns({});
      countdownsRef.current = {};
      expiringRef.current.clear();
      stopRideRequestSound();
    }
  };
}, [isOnline, subscriptionActive]);

useEffect(() => {
  incomingRidesRef.current = incomingRides;
}, [incomingRides]);

useEffect(() => {
  countdownsRef.current = requestCountdowns;
}, [requestCountdowns]);

// ============================================================
// COMPTE À REBOURS INDIVIDUELS — 60 S PAR DEMANDE
// ============================================================
useEffect(() => {
  if (incomingRides.length === 0) return;

  const interval = setInterval(() => {
    const next = { ...countdownsRef.current };
    const expired = [];

    incomingRidesRef.current.forEach((request) => {
      const id = request.requestId;
      const current =
        typeof next[id] === "number" ? next[id] : 60;

      if (current <= 1) {
        next[id] = 0;
        if (!expiringRef.current.has(id)) {
          expiringRef.current.add(id);
          expired.push(request);
        }
      } else {
        next[id] = current - 1;
      }
    });

    countdownsRef.current = next;
    setRequestCountdowns(next);

    expired.forEach(async (request) => {
      try {
        console.log("⏰ Demande expirée après 60 secondes :", request.requestId);
        await timeoutRideRequest(request.requestId);
      } catch (error) {
        console.error("❌ Erreur expiration demande :", error);
      } finally {
        expiringRef.current.delete(request.requestId);
      }
    });
  }, 1000);

  return () => clearInterval(interval);
}, [incomingRides.length]);

const listenIncomingRide = (userId) => {
  const q = query(
    collection(db, "ride_requests"),
    where("driverId", "==", userId),
    where("status", "==", "pending")
  );

  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map((docSnap) => ({
      id: docSnap.data().rideId,
      requestId: docSnap.id,
      ...docSnap.data(),
    }));

    console.log(`📩 ${requests.length} demande(s) conducteur reçue(s)`);

    setIncomingRides(requests);

    setRequestCountdowns((previous) => {
      const next = {};
      requests.forEach((request) => {
        const id = request.requestId;
        next[id] =
          typeof previous[id] === "number" ? previous[id] : 60;
      });
      countdownsRef.current = next;
      return next;
    });

    if (requests.length > 0) {
      playRideRequestSound();
    } else {
      stopRideRequestSound();
    }
  }, (error) => {
    console.error("❌ Erreur écoute demandes conducteur :", error);
  });
};

const acceptRide = async (request) => {
  if (!request?.requestId || !request?.id || actionRequestId) return;

  try {
    setActionRequestId(request.requestId);
    console.log("🌐 Acceptation demande :", request.requestId);

    const result = await acceptRideRequest(request.requestId);

    if (!result?.success) {
      console.log(
        "⚠️ Acceptation refusée :",
        result?.reason || result?.status || "raison inconnue"
      );
      return;
    }

    await stopRideRequestSound();

    // ============================================================
    // SYNCHRONISER LE CONDUCTEUR LOCAL APRÈS ACCEPTATION
    // Firestore est la source de vérité : RideStatus et les autres
    // écrans doivent immédiatement connaître l'état BUSY.
    // ============================================================
    try {
      const localDriver = await getUser();

      if (localDriver?.userId) {
        const driverRef = doc(db, "users", localDriver.userId);
        const driverSnapshot = await getDoc(driverRef);

        if (driverSnapshot.exists()) {
          const freshDriver = driverSnapshot.data();

          await saveUser({
            ...localDriver,
            ...freshDriver,
          });

          console.log("💾 Conducteur local synchronisé après acceptation :", {
            availability: freshDriver.availability,
            currentRideId: freshDriver.currentRideId,
          });
        }
      }
    } catch (syncError) {
      console.error(
        "⚠️ Synchronisation conducteur après acceptation impossible :",
        syncError
      );
    }

    setIncomingRides([]);
    setRequestCountdowns({});
    countdownsRef.current = {};
    expiringRef.current.clear();

    console.log(
      "🚗 Course attribuée au conducteur :",
      result.rideId
    );

    router.push({
      pathname: "/(driver)/RideStatus",
      params: { rideId: result.rideId || request.id },
    });
  } catch (error) {
    console.error("❌ Erreur acceptation demande :", error);
  } finally {
    setActionRequestId(null);
  }
};

const rejectRide = async (request) => {
  if (!request?.requestId || actionRequestId) return;

  try {
    setActionRequestId(request.requestId);
    console.log("❌ Refus demande :", request.requestId);

    await rejectRideRequest(request.requestId);

    setIncomingRides((previous) =>
      previous.filter((item) => item.requestId !== request.requestId)
    );

    setRequestCountdowns((previous) => {
      const next = { ...previous };
      delete next[request.requestId];
      countdownsRef.current = next;
      return next;
    });
  } catch (error) {
    console.error("❌ Erreur refus demande :", error);
  } finally {
    setActionRequestId(null);
  }
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

        // ============================================================
        // PASSAGE HORS LIGNE = SUPPRESSION IMMÉDIATE DES DEMANDES
        // ============================================================
        if (!value) {
          console.log(
            "🔴 Conducteur hors ligne → suppression des demandes affichées"
          );

          setIncomingRides([]);
          setRequestCountdowns({});
          countdownsRef.current = {};
          expiringRef.current.clear();

          await stopRideRequestSound();
        }

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

      {/* TEST DEBUG — volontairement AVANT les demandes pour permettre
          de créer plusieurs demandes pendant les tests. */}
      <DebugRideRequest />

      {/* DEMANDES ENTRANTES — PANNEAU INLINE, PAS DE MODAL */}
      {subscriptionActive && isOnline && incomingRides.length > 0 && (
        <View style={styles.incomingRequestsPanel}>
          <View style={styles.requestHeaderRow}>
            <Text style={styles.requestTitle}>
              🚖 Demandes disponibles
            </Text>
            <View style={styles.requestBadge}>
              <Text style={styles.requestBadgeText}>
                {incomingRides.length}
              </Text>
            </View>
          </View>

          {incomingRides.map((request) => {
            const countdown = requestCountdowns[request.requestId] ?? 60;
            const busy = actionRequestId !== null;

            return (
              <View key={request.requestId} style={styles.requestItem}>
                <View style={styles.requestItemTop}>
                  <Text style={styles.countdownText}>
                    {countdown}s
                  </Text>
                </View>

                <Text style={styles.requestText}>
                  📍 Départ : {request.pickup?.address || "Position du passager"}
                </Text>

                <Text style={styles.requestText}>
                  🎯 Destination : {request.destination?.address || "Destination"}
                </Text>

                <View style={styles.priceCard}>
                  <Text style={styles.priceLabel}>Prix</Text>
                  <Text style={styles.priceValue}>
                    {request.estimatedPrice ?? 0} FCFA
                  </Text>
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.rejectButton, busy && styles.disabledButton]}
                    onPress={() => rejectRide(request)}
                    disabled={busy}
                  >
                    <Text style={styles.buttonLabel}>Refuser</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.acceptButton, busy && styles.disabledButton]}
                    onPress={() => acceptRide(request)}
                    disabled={busy}
                  >
                    <Text style={styles.buttonLabel}>
                      {actionRequestId === request.requestId ? "Traitement..." : "Accepter"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

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

      <View style={styles.bottomSpace} />

    </ScrollView>


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
  incomingRequestsPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 15,
    marginTop: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    elevation: 8,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  requestHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  requestBadge: {
    minWidth: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },

  requestBadgeText: {
    fontSize: 20,
    fontWeight: "bold",
  },

  requestItem: {
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    padding: 14,
    marginBottom: 12,
  },

  requestItemTop: {
    alignItems: "flex-end",
    marginBottom: 2,
  },

  countdownText: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#E53935",
  },

  requestText: {
    fontSize: 16,
    marginTop: 10,
    lineHeight: 22,
  },

  priceCard: {
    backgroundColor: "#EAF8F2",
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    alignItems: "center",
  },

  priceLabel: {
    color: "#666",
    fontSize: 14,
  },

  priceValue: {
    color: "#0B6E4F",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 4,
  },

  buttonRow: {
    flexDirection: "row",
    marginTop: 18,
  },

  buttonLabel: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },

  disabledButton: {
    opacity: 0.55,
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