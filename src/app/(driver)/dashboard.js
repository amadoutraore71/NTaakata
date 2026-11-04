import { router, useFocusEffect } from "expo-router";
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
import React, { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../../firebase/config";
import {
  acceptRideRequest,
  rejectRideRequest,
  timeoutRideRequest,
} from "../../../services/matching/rideRequestService";
import {
  playRideRequestSound,
  prepareRideRequestSound,
  stopRideRequestSound,
} from "../../../services/soundService";
import { isSubscriptionValid } from "../../../services/subscriptionService";
import { getUser, saveUser } from "../../storage/userStorage";
import DriverLocation from "./driver-location";

export default function DriverDashboard() {
  // Adaptation aux petits téléphones, grands téléphones et tablettes.
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const horizontalPadding = screenWidth < 360 ? 12 : screenWidth > 700 ? 24 : 18;
  const compactLayout = screenWidth < 360 || screenHeight < 700;
  const [subscriptionActive, setSubscriptionActive] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  const [totalRatings, setTotalRatings] = useState(0);
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
          console.log("🔄 Actualisation du dashboard conducteur...");

          const driver = await getUser();

          console.log("🚗 Conducteur récupéré :", driver);

          if (!driver?.userId) {
            console.log("❌ Conducteur connecté introuvable");
            return;
          }

          await Promise.all([checkSubscription(driver), loadStats(driver)]);

          console.log("✅ Dashboard conducteur chargé");
        } catch (error) {
          console.error("❌ Erreur actualisation Dashboard :", error);
        } finally {
          setLoading(false);
        }
      };

      refreshDashboard();
    }, []),
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
            "⏸️ Écoute demandes non démarrée : conducteur hors ligne ou abonnement inactif",
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
          driver.userId,
        );

        unsubscribeRide = listenIncomingRide(driver.userId);
      } catch (error) {
        console.error("❌ Erreur écoute demandes conducteur :", error);
      }
    };

    startRideListener();

    return () => {
      if (unsubscribeRide) {
        unsubscribeRide();
        console.log("🛑 Écoute des demandes conducteur arrêtée");
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
        const current = typeof next[id] === "number" ? next[id] : 60;

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
          console.log(
            "⏰ Demande expirée après 60 secondes :",
            request.requestId,
          );
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
      where("status", "==", "pending"),
    );

    return onSnapshot(
      q,
      (snapshot) => {
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
            next[id] = typeof previous[id] === "number" ? previous[id] : 60;
          });
          countdownsRef.current = next;
          return next;
        });

        if (requests.length > 0) {
          playRideRequestSound();
        } else {
          stopRideRequestSound();
        }
      },
      (error) => {
        console.error("❌ Erreur écoute demandes conducteur :", error);
      },
    );
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
          result?.reason || result?.status || "raison inconnue",
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
          syncError,
        );
      }

      setIncomingRides([]);
      setRequestCountdowns({});
      countdownsRef.current = {};
      expiringRef.current.clear();

      console.log("🚗 Course attribuée au conducteur :", result.rideId);

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
        previous.filter((item) => item.requestId !== request.requestId),
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
        console.log("❌ Impossible de vérifier l'abonnement : userId manquant");

        setSubscriptionActive(false);
        return;
      }

      console.log("🔎 Vérification abonnement Firestore :", driver.userId);

      // ============================================================
      // FIRESTORE = SOURCE DE VÉRITÉ
      // ============================================================

      const driverRef = doc(db, "users", driver.userId);

      const snapshot = await getDoc(driverRef);

      if (!snapshot.exists()) {
        console.log("❌ Conducteur introuvable dans Firestore");

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

      console.log("💾 Utilisateur local synchronisé avec Firestore");
      console.log("🔥 Données abonnement Firestore :", {
        userId: data.userId,
        subscriptionActive: data.subscriptionActive,
        subscriptionExpiresAt: data.subscriptionExpiresAt,
        subscriptionPaidAt: data.subscriptionPaidAt,
      });

      // ============================================================
      // VÉRIFIER L'EXPIRATION
      // ============================================================

      const valid =
        data.subscriptionActive === true &&
        isSubscriptionValid(data.subscriptionExpiresAt);

      console.log("📅 Abonnement valide :", valid);

      // ============================================================
      // SI EXPIRÉ → DÉSACTIVER
      // ============================================================

      if (!valid && data.subscriptionActive === true) {
        console.log("⛔ Abonnement expiré → désactivation");

        await updateDoc(driverRef, {
          subscriptionActive: false,
        });
      }

      // ============================================================
      // METTRE À JOUR L'ÉTAT DE L'ÉCRAN
      // ============================================================

      setSubscriptionActive(valid);

      // ============================================================
      // RÉCUPÉRER LES AUTRES DONNÉES CONDUCTEUR
      // ============================================================

      // Les champs sont ceux réellement enregistrés par rate-driver.js.
      setAverageRating(
        typeof data.averageRating === "number" ? data.averageRating : 0,
      );

      setTotalRatings(
        typeof data.totalRatings === "number" ? data.totalRatings : 0,
      );

      setIsOnline(data.isOnline === true);
    } catch (error) {
      console.error("❌ Erreur vérification abonnement :", error);

      setSubscriptionActive(false);
    }
  };
  const loadStats = async (driver) => {
    const q = query(
      collection(db, "rides"),
      where("driverId", "==", driver.userId),
    );
    const snapshot = await getDocs(q);
    let dailyRevenue = 0;
    let completedRides = 0;

    // La journée est calculée selon le fuseau de Bamako (UTC+0).
    const bamakoDateKey = (date) => {
      const parts = new Intl.DateTimeFormat("en", {
        timeZone: "Africa/Bamako",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(date);
      const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
      return `${values.year}-${values.month}-${values.day}`;
    };
    const todayKey = bamakoDateKey(new Date());

    snapshot.forEach((document) => {
      const ride = document.data();
      if (ride.status !== "completed") return;

      const completedAt = ride.completedAt?.toDate
        ? ride.completedAt.toDate()
        : ride.completedAt instanceof Date
          ? ride.completedAt
          : null;
      const wasCompletedToday = completedAt && bamakoDateKey(completedAt) === todayKey;

      // Le compteur affiche uniquement les courses terminées aujourd'hui.
      if (wasCompletedToday) completedRides += 1;

      // Même règle que l'écran « Mes revenus » :
      // une course terminée contribue au revenu avec paidAmount si disponible,
      // sinon estimatedPrice comme montant de secours.
      const amountValue =
        ride.paidAmount !== null && ride.paidAmount !== undefined
          ? ride.paidAmount
          : ride.estimatedPrice;
      const amount = Number(amountValue);

      if (
        wasCompletedToday &&
        Number.isFinite(amount) &&
        amount > 0
      ) {
        dailyRevenue += amount;
      }
    });

    setTotalRevenue(dailyRevenue);
    setTotalRides(completedRides);
  };

  const toggleOnlineStatus = async (value) => {
    try {
      const driver = await getUser();

      if (!driver) return;

      await updateDoc(
        doc(db, "users", driver.userId),

        {
          isOnline: value,
        },
      );

      setIsOnline(value);

      // ============================================================
      // PASSAGE HORS LIGNE = SUPPRESSION IMMÉDIATE DES DEMANDES
      // ============================================================
      if (!value) {
        console.log(
          "🔴 Conducteur hors ligne → suppression des demandes affichées",
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
        <Text style={styles.loading}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <DriverLocation />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingHorizontal: horizontalPadding,
            maxWidth: screenWidth > 700 ? 640 : undefined,
            alignSelf: "center",
            width: "100%",
            paddingBottom: screenHeight < 700 ? 6 : 10,
            flexGrow: 1,
            justifyContent: "space-between",
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête compact : aucun gros titre « Tableau de bord ». */}
        <View style={styles.topBar}>
          <View style={styles.brandBlock}>
            <View style={styles.logoMark}>
              <Text style={styles.logoMarkText}>N</Text>
            </View>
            <View>
              <Text style={styles.brandName}>N’Taakata</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push("/(driver)/profile")}
            accessibilityRole="button"
            accessibilityLabel="Ouvrir le profil"
          >
            <Text style={styles.profileGlyph}>●</Text>
          </TouchableOpacity>
        </View>

        {/* Le statut est l'élément principal en haut de l'écran. */}
        <View style={styles.statusHero}>
          <View style={styles.statusHeroTop}>
            <View style={styles.statusCopy}>
              <View style={styles.statusEyebrowRow}>
                <View
                  style={[
                    styles.statusDot,
                    isOnline ? styles.dotOnline : styles.dotOffline,
                  ]}
                />
                <Text style={styles.statusEyebrow}>STATUT EN DIRECT</Text>
              </View>
              <Text style={[styles.statusHeroTitle, compactLayout && styles.statusHeroTitleCompact]}>
                {isOnline ? "Vous êtes en ligne" : "Vous êtes hors ligne"}
              </Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={toggleOnlineStatus}
              disabled={!subscriptionActive}
              trackColor={{ false: "#6D8279", true: "#7BD8A8" }}
              thumbColor={isOnline ? "#FFFFFF" : "#F1F4F2"}
              ios_backgroundColor="#6D8279"
            />
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroFooter}>
            <View>
              <Text style={styles.heroFooterValue}>
                {subscriptionActive ? "Actif" : "Non actif"}
              </Text>
            </View>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>
                {subscriptionActive ? "Prêt à rouler" : "Action requise"}
              </Text>
            </View>
          </View>
        </View>

        {!subscriptionActive && (
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionIcon}>
              <Text style={styles.subscriptionIconText}>!</Text>
            </View>
            <View style={styles.subscriptionContent}>
              <Text style={styles.subscriptionTitle}>Abonnement requis</Text>
              <Text style={styles.subscriptionDescription}>
                Activez votre abonnement journalier de 100 FCFA pour recevoir
                des demandes de courses.
              </Text>
              <TouchableOpacity
                style={styles.subscriptionButton}
                onPress={() => router.push("/(driver)/subscription")}
              >
                <Text style={styles.subscriptionButtonText}>
                  Activer maintenant ›
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.revenueCard}>
          <View style={styles.revenueTopRow}>
            <View>
              <Text style={styles.revenueLabel}>Revenus journaliers</Text>
              <Text style={styles.revenueAmount}>
                {Number(totalRevenue).toLocaleString("fr-FR")}{" "}
                <Text style={styles.revenueCurrency}>FCFA</Text>
              </Text>
            </View>
            <View style={styles.revenueIcon}>
              <Text style={styles.revenueIconText}>↗</Text>
            </View>
          </View>
        </View>

        <View style={[styles.metricsRow, compactLayout && styles.metricsRowCompact]}>
          <View style={[styles.metricCard, compactLayout && styles.metricCardCompact]}>
            <View style={[styles.metricIcon, styles.metricIconGreen]}>
              <Text style={styles.metricGreenGlyph}>✓</Text>
            </View>
            <Text style={styles.metricValue}>{totalRides}</Text>
            <Text style={styles.metricLabel}>Courses réalisées</Text>
          </View>
          <View style={[styles.metricCard, compactLayout && styles.metricCardCompact]}>
            <View style={[styles.metricIcon, styles.metricIconYellow]}>
              <Text style={styles.metricYellowGlyph}>★</Text>
            </View>
            <Text style={styles.metricValue}>
              {Number(averageRating).toFixed(1)}
              <Text style={styles.ratingOutOf}>/5</Text>
            </Text>
            <Text style={styles.metricLabel}>
              Note moyenne · {totalRatings} avis
            </Text>
          </View>
        </View>

        {/* Conservé pour tester la création et la réception des demandes. */}
        {/* <View style={styles.debugContainer}>
        <View style={styles.debugHeading}>
          <Text style={styles.debugTitle}>Zone de test</Text>
          <Text style={styles.debugBadge}>DEBUG</Text>
        </View>
        <DebugRideRequest />
      </View>*/}

        {subscriptionActive && isOnline && incomingRides.length > 0 && (
          <View style={styles.incomingRequestsPanel}>
            <View style={styles.requestHeaderRow}>
              <View>
                <Text style={styles.requestTitle}>Nouvelles demandes</Text>
              </View>
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
                    <View
                      style={[
                        styles.countdownPill,
                        countdown <= 10 && styles.countdownUrgent,
                      ]}
                    >
                      <Text style={styles.countdownText}>{countdown}s</Text>
                    </View>
                  </View>
                  <View style={styles.compactRoute}>
                    <View style={styles.compactRoutePoint}>
                      <View style={styles.pickupMarker} />
                      <View style={styles.compactRouteText}>
                        <Text style={styles.addressCaption}>DÉPART</Text>
                        <Text style={styles.requestText} numberOfLines={1}>
                          {request.pickup?.address ||
                            "Lieu de prise en charge non précisé"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.compactRoutePoint}>
                      <View style={styles.destinationMarker} />
                      <View style={styles.compactRouteText}>
                        <Text style={styles.addressCaption}>DESTINATION</Text>
                        <Text style={styles.requestText} numberOfLines={1}>
                          {request.destination?.address || "Destination"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.compactPriceRow}>
                    <View>
                      <Text style={styles.priceLabel}>Prix</Text>
                    </View>
                    <Text style={styles.priceValue}>
                      {Number(request.estimatedPrice || 0).toLocaleString(
                        "fr-FR",
                      )}{" "}
                      FCFA
                    </Text>
                  </View>
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[
                        styles.rejectButton,
                        busy && styles.disabledButton,
                      ]}
                      onPress={() => rejectRide(request)}
                      disabled={busy}
                    >
                      <Text style={styles.rejectButtonText}>Refuser</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.acceptButton,
                        busy && styles.disabledButton,
                      ]}
                      onPress={() => acceptRide(request)}
                      disabled={busy}
                    >
                      <Text style={styles.acceptButtonText}>
                        {actionRequestId === request.requestId
                          ? "Traitement..."
                          : "Accepter"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          style={styles.primaryAction}
          onPress={() => {
            if (!subscriptionActive) {
              router.push("/(driver)/subscription");
              return;
            }
            router.push("/(driver)/requests");
          }}
        >
          <View style={styles.primaryActionIcon}>
            <Text style={styles.primaryActionGlyph}>↗</Text>
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.primaryActionTitle}>Voir les demandes</Text>
            <Text style={styles.primaryActionSubtitle}>
              Consultez les courses disponibles
            </Text>
          </View>
          <Text style={styles.actionChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push("/(driver)/earnings")}
        >
          <View style={styles.secondaryActionIcon}>
            <Text style={styles.secondaryActionGlyph}>₣</Text>
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.quickActionTitle}>Mes revenus</Text>
            <Text style={styles.quickActionSubtitle}>Consultez vos gains</Text>
          </View>
          <Text style={styles.quickChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push("/(driver)/my-rides")}
        >
          <View style={styles.secondaryActionIcon}>
            <Text style={styles.secondaryActionGlyph}>≡</Text>
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.quickActionTitle}>Mes courses</Text>
            <Text style={styles.quickActionSubtitle}>
              Retrouvez votre historique
            </Text>
          </View>
          <Text style={styles.quickChevron}>›</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const COLORS = {
  background: "#F4F7F5",
  dark: "#073B2D",
  green: "#0B6E4F",
  greenLight: "#E5F4ED",
  greenBorder: "#CDE7DA",
  white: "#FFFFFF",
  text: "#18352B",
  muted: "#728078",
  yellow: "#F4C300",
  yellowLight: "#FFF6D6",
  red: "#D94841",
  redLight: "#FFF0EF",
  border: "#E3EAE5",
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  contentContainer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
  },
  loading: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 50,
    color: COLORS.muted,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  brandBlock: { flexDirection: "row", alignItems: "center" },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: COLORS.dark,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  logoMarkText: { color: COLORS.white, fontSize: 23, fontWeight: "900" },
  brandName: { color: COLORS.dark, fontSize: 19, fontWeight: "900" },
  profileButton: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  profileGlyph: { color: COLORS.green, fontSize: 22, fontWeight: "900" },
  statusHero: {
    backgroundColor: COLORS.dark,
    borderRadius: 25,
    padding: 20,
    marginBottom: 18,
    shadowColor: "#052A20",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
  },
  statusHeroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusCopy: { flex: 1, paddingRight: 10 },
  statusEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 7 },
  dotOnline: { backgroundColor: "#70E2A5" },
  dotOffline: { backgroundColor: "#FF8B83" },
  statusEyebrow: {
    color: "#B9D4C8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  statusHeroTitle: { color: COLORS.white, fontSize: 21, fontWeight: "800" },
  statusHeroTitleCompact: { fontSize: 18 },
  heroDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.16)",
    marginTop: 20,
    marginBottom: 14,
  },
  heroFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroFooterValue: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 3,
  },
  heroPill: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  heroPillText: { color: "#DFF7E9", fontSize: 11, fontWeight: "700" },
  subscriptionCard: {
    flexDirection: "row",
    backgroundColor: COLORS.yellowLight,
    borderColor: "#F0D98A",
    borderWidth: 1,
    borderRadius: 20,
    padding: 15,
    marginBottom: 22,
  },
  subscriptionIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: COLORS.yellow,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  subscriptionIconText: { color: COLORS.dark, fontSize: 20, fontWeight: "900" },
  subscriptionContent: { flex: 1 },
  subscriptionTitle: {
    color: "#5F4B00",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 5,
  },
  subscriptionDescription: { color: "#766426", fontSize: 12, lineHeight: 18 },
  subscriptionButton: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.yellow,
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginTop: 12,
  },
  subscriptionButtonText: {
    color: COLORS.dark,
    fontSize: 12,
    fontWeight: "800",
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 5,
    marginBottom: 12,
  },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: "900" },
  sectionHint: { color: COLORS.muted, fontSize: 11 },
  revenueCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 12,
  },
  revenueTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  revenueLabel: { color: COLORS.muted, fontSize: 12, fontWeight: "600" },
  revenueAmount: {
    color: COLORS.dark,
    fontSize: 27,
    fontWeight: "900",
    marginTop: 7,
  },
  revenueCurrency: { color: COLORS.green, fontSize: 13, fontWeight: "800" },
  revenueIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: COLORS.greenLight,
    alignItems: "center",
    justifyContent: "center",
  },
  revenueIconText: { color: COLORS.green, fontSize: 25, fontWeight: "900" },

  metricsRow: { flexDirection: "row", marginHorizontal: -5, marginBottom: 21 },
  metricsRowCompact: { marginBottom: 14 },
  metricCard: {
    flex: 1,
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 142,
  },
  metricCardCompact: { minHeight: 116, padding: 12 },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  metricIconGreen: { backgroundColor: COLORS.greenLight },
  metricIconYellow: { backgroundColor: COLORS.yellowLight },
  metricGreenGlyph: { color: COLORS.green, fontSize: 18, fontWeight: "900" },
  metricYellowGlyph: { color: "#9A7900", fontSize: 18, fontWeight: "900" },
  metricValue: { color: COLORS.dark, fontSize: 24, fontWeight: "900" },
  ratingOutOf: { color: COLORS.muted, fontSize: 12, fontWeight: "600" },
  metricLabel: { color: COLORS.muted, fontSize: 11, marginTop: 5 },

  debugContainer: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 14,
    marginBottom: 20,
  },
  debugHeading: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  debugTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    marginRight: 8,
  },
  debugBadge: {
    color: "#805B00",
    backgroundColor: COLORS.yellowLight,
    overflow: "hidden",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  incomingRequestsPanel: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
    shadowColor: COLORS.dark,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  requestHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
  },
  requestTitle: { color: COLORS.dark, fontSize: 15, fontWeight: "900" },
  requestBadge: {
    minWidth: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: COLORS.greenLight,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
  },
  requestBadgeText: { color: COLORS.green, fontSize: 16, fontWeight: "900" },
  requestItem: {
    backgroundColor: "#FBFDFC",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    padding: 10,
    marginBottom: 8,
  },
  requestItemTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  countdownPill: {
    backgroundColor: COLORS.redLight,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  countdownUrgent: { backgroundColor: "#FFDAD7" },
  countdownText: { color: COLORS.red, fontSize: 13, fontWeight: "900" },
  pickupMarker: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: COLORS.green,
  },
  destinationMarker: {
    width: 11,
    height: 11,
    borderRadius: 3,
    backgroundColor: COLORS.yellow,
  },
  addressCaption: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  requestText: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  compactRoute: {
    backgroundColor: "#F5FAF7",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  compactRoutePoint: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 25,
  },
  compactRouteText: { flex: 1, marginLeft: 9 },
  compactPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.greenLight,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 8,
    marginTop: 8,
  },
  priceLabel: { color: COLORS.dark, fontSize: 12, fontWeight: "900" },
  priceValue: {
    color: COLORS.green,
    fontSize: 15,
    fontWeight: "900",
    textAlign: "right",
    flexShrink: 1,
    marginLeft: 8,
  },
  buttonRow: { flexDirection: "row", marginTop: 9 },
  rejectButton: {
    flex: 0.8,
    height: 39,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#F2C7C4",
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectButtonText: { color: COLORS.red, fontSize: 13, fontWeight: "800" },
  acceptButton: {
    flex: 1.4,
    height: 39,
    borderRadius: 11,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 9,
  },
  acceptButtonText: { color: COLORS.white, fontSize: 13, fontWeight: "800" },
  disabledButton: { opacity: 0.5 },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.dark,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  primaryActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.13)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  primaryActionGlyph: { color: COLORS.white, fontSize: 23, fontWeight: "900" },
  actionCopy: { flex: 1 },
  primaryActionTitle: { color: COLORS.white, fontSize: 14, fontWeight: "900" },
  primaryActionSubtitle: { color: "#B9D4C8", fontSize: 11, marginTop: 4 },
  actionChevron: { color: COLORS.white, fontSize: 27, marginLeft: 8 },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  secondaryActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.greenLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  secondaryActionGlyph: {
    color: COLORS.green,
    fontSize: 20,
    fontWeight: "900",
  },
  quickActionTitle: { color: COLORS.text, fontSize: 14, fontWeight: "900" },
  quickActionSubtitle: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  quickChevron: { color: "#9AA69F", fontSize: 27, marginLeft: 8 },
});
