import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../../firebase/config";
import { getUser, saveUser } from "../../storage/userStorage";
import {
  acceptRideRequest,
  rejectRideRequest,
} from "../../../services/matching/rideRequestService";
import { isSubscriptionValid } from "../../../services/subscriptionService";

function getAddress(value, fallback) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object") {
    if (typeof value.address === "string" && value.address.trim()) {
      return value.address.trim();
    }
  }
  return fallback;
}

function formatMoney(value) {
  const amount = Number(value);
  return `${Number.isFinite(amount) ? amount.toLocaleString("fr-FR") : "—"} FCFA`;
}

function formatDistance(value) {
  const meters = Number(value);
  if (!Number.isFinite(meters) || meters < 0) return null;
  if (meters < 1000) return `${Math.round(meters)} m de vous`;
  return `${(meters / 1000).toFixed(1).replace(".", ",")} km de vous`;
}

function formatTime(value) {
  if (!value) return "";
  const date = typeof value.toDate === "function"
    ? value.toDate()
    : value.seconds
      ? new Date(value.seconds * 1000)
      : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Le délai global de recherche de course retenu dans N’Taakata est de 60 secondes.
const REQUEST_TIMEOUT_SECONDS = 60;

function getTimestampMillis(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value < 1e12 ? value * 1000 : value;
  return 0;
}

function getRemainingSeconds(request, now) {
  const createdAt = getTimestampMillis(request.createdAt);
  if (!createdAt) return REQUEST_TIMEOUT_SECONDS;

  const deadline = createdAt + REQUEST_TIMEOUT_SECONDS * 1000;
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

function formatCountdown(seconds) {
  return `${Math.max(0, seconds)} s`;
}

export default function DriverRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [actionRequestId, setActionRequestId] = useState(null);
  const [clockNow, setClockNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let unsubscribe = null;
      let cancelled = false;

      const listen = async () => {
        setLoading(true);
        setAvailabilityMessage("");

        try {
          const localDriver = await getUser();

          if (!localDriver?.userId) {
            if (!cancelled) {
              setRequests([]);
              setAvailabilityMessage("Connectez-vous comme conducteur pour voir les demandes.");
              setLoading(false);
            }
            return;
          }

          const driverRef = doc(db, "users", localDriver.userId);
          const driverSnapshot = await getDoc(driverRef);

          if (!driverSnapshot.exists()) {
            if (!cancelled) {
              setRequests([]);
              setAvailabilityMessage("Profil conducteur introuvable.");
              setLoading(false);
            }
            return;
          }

          const driver = driverSnapshot.data();
          await saveUser({ ...localDriver, ...driver });

          const subscriptionIsActive =
            driver.subscriptionActive === true &&
            isSubscriptionValid(driver.subscriptionExpiresAt);

          if (driver.isOnline !== true || !subscriptionIsActive) {
            if (!cancelled) {
              setRequests([]);
              setAvailabilityMessage(
                driver.isOnline !== true
                  ? "Passez en ligne pour recevoir les demandes à proximité."
                  : "Votre abonnement conducteur doit être actif pour recevoir des demandes."
              );
              setLoading(false);
            }
            return;
          }

          const requestsQuery = query(
            collection(db, "ride_requests"),
            where("driverId", "==", localDriver.userId),
            where("status", "==", "pending")
          );

          unsubscribe = onSnapshot(
            requestsQuery,
            (snapshot) => {
              if (cancelled) return;

              const nextRequests = snapshot.docs
                .map((requestDoc) => ({
                  ...requestDoc.data(),
                  requestId: requestDoc.id,
                  id: requestDoc.data().rideId,
                }))
                .sort((a, b) => {
                  const aTime = a.createdAt?.seconds || 0;
                  const bTime = b.createdAt?.seconds || 0;
                  return bTime - aTime;
                });

              setRequests(nextRequests);
              setLoading(false);
            },
            (error) => {
              console.error("Erreur écoute demandes conducteur :", error);
              if (!cancelled) {
                setRequests([]);
                setAvailabilityMessage(
                  "Impossible de charger les demandes. Vérifiez votre connexion."
                );
                setLoading(false);
              }
            }
          );
        } catch (error) {
          console.error("Erreur ouverture page demandes :", error);
          if (!cancelled) {
            setRequests([]);
            setAvailabilityMessage("Une erreur est survenue pendant le chargement.");
            setLoading(false);
          }
        }
      };

      listen();

      return () => {
        cancelled = true;
        if (unsubscribe) unsubscribe();
      };
    }, [])
  );

  const handleAccept = async (request) => {
    if (!request?.requestId || !request?.id || actionRequestId) return;

    try {
      setActionRequestId(request.requestId);
      const result = await acceptRideRequest(request.requestId);

      if (!result?.success) {
        Alert.alert(
          "Demande indisponible",
          result?.reason || "Cette demande a déjà été prise ou n'est plus disponible."
        );
        return;
      }

      try {
        const localDriver = await getUser();
        if (localDriver?.userId) {
          const freshSnapshot = await getDoc(doc(db, "users", localDriver.userId));
          if (freshSnapshot.exists()) {
            await saveUser({ ...localDriver, ...freshSnapshot.data() });
          }
        }
      } catch (syncError) {
        console.warn("Synchronisation locale conducteur impossible :", syncError);
      }

      router.replace({
        pathname: "/(driver)/RideStatus",
        params: { rideId: result.rideId || request.id },
      });
    } catch (error) {
      console.error("Erreur acceptation demande :", error);
      Alert.alert("Erreur", "Impossible d'accepter cette course pour le moment.");
    } finally {
      setActionRequestId(null);
    }
  };

  const handleReject = async (request) => {
    if (!request?.requestId || actionRequestId) return;

    try {
      setActionRequestId(request.requestId);
      await rejectRideRequest(request.requestId);
      setRequests((current) =>
        current.filter((item) => item.requestId !== request.requestId)
      );
    } catch (error) {
      console.error("Erreur refus demande :", error);
      Alert.alert("Erreur", "Impossible de refuser cette demande.");
    } finally {
      setActionRequestId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        
        <View style={styles.headerSpacer} />
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{requests.length}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color={COLORS.green} />
            <Text style={styles.stateText}>Recherche des demandes...</Text>
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>⌕</Text>
            </View>
            <Text style={styles.emptyTitle}>Aucune demande pour le moment</Text>
            <Text style={styles.emptyText}>
              {availabilityMessage ||
                "Aucune course ne vous a encore été proposée à proximité. Restez en ligne, les nouvelles demandes apparaîtront ici."}
            </Text>
          </View>
        ) : (
          requests.map((request) => {
            const busy = actionRequestId !== null;
            const distance = formatDistance(request.driverDistance);

            return (
              <View key={request.requestId} style={styles.requestCard}>
                <View style={styles.cardTop}>
                  <View style={styles.newRequestLabel}>
                    <View style={styles.newDot} />
                    <Text style={styles.newRequestText}>NOUVELLE COURSE</Text>
                  </View>
                  <View style={styles.cardTopRight}>
                    {distance ? (
                      <View style={styles.distanceBadge}>
                        <Text style={styles.distanceText}>{distance}</Text>
                      </View>
                    ) : null}
                    <View
                      style={[
                        styles.timerBadge,
                        getRemainingSeconds(request, clockNow) <= 10 &&
                          styles.timerBadgeUrgent,
                      ]}
                    >
                      <Text
                        style={[
                          styles.timerText,
                          getRemainingSeconds(request, clockNow) <= 10 &&
                            styles.timerTextUrgent,
                        ]}
                      >
                        ⏱ {formatCountdown(getRemainingSeconds(request, clockNow))}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.routePanel}>
                  <View style={styles.routeRow}>
                    <View style={styles.pickupDot} />
                    <View style={styles.routeCopy}>
                      <Text style={styles.routeLabel}>DÉPART</Text>
                      <Text style={styles.routeAddress} numberOfLines={2}>
                        {getAddress(request.pickup, "Point de départ non précisé")}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.routeLine} />
                  <View style={styles.routeRow}>
                    <View style={styles.destinationDot} />
                    <View style={styles.routeCopy}>
                      <Text style={styles.routeLabel}>DESTINATION</Text>
                      <Text style={styles.routeAddress} numberOfLines={2}>
                        {getAddress(request.destination, "Destination non précisée")}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailsRow}>
                  <View>
                    <Text style={styles.priceCaption}>PRIX </Text>
                    <Text style={styles.price}>
                      {formatMoney(request.estimatedPrice)}
                    </Text>
                  </View>
                  <View style={styles.detailsRight}>
                    <Text style={styles.vehicle}>
                      {request.vehicleType === "voiture" ? "🚗 Voiture" : "🏍️ Moto"}
                    </Text>
                  </View>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.rejectButton, busy && styles.disabled]}
                    onPress={() => handleReject(request)}
                    disabled={busy}
                  >
                    <Text style={styles.rejectText}>Refuser</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.acceptButton, busy && styles.disabled]}
                    onPress={() => handleAccept(request)}
                    disabled={busy}
                  >
                    <Text style={styles.acceptText}>
                      {actionRequestId === request.requestId
                        ? "Traitement..."
                        : "Accepter la course"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const COLORS = {
  background: "#F4F7F5",
  green: "#0B6E4F",
  dark: "#073B2D",
  text: "#18352B",
  muted: "#77847D",
  border: "#E2EBE5",
  paleGreen: "#E7F5ED",
  white: "#FFFFFF",
  red: "#C94C45",
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 28,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  backGlyph: {
    color: COLORS.dark,
    fontSize: 30,
    lineHeight: 32,
    marginTop: -3,
  },
  headerSpacer: {
    flex: 1,
  },
  countBadge: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: COLORS.paleGreen,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  countText: {
    color: COLORS.green,
    fontSize: 15,
    fontWeight: "900",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    flexGrow: 1,
  },
  stateBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 55,
  },
  stateText: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 12,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 34,
    marginTop: 8,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: COLORS.paleGreen,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyIconText: {
    color: COLORS.green,
    fontSize: 34,
    fontWeight: "700",
    marginTop: -4,
  },
  emptyTitle: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
  },
  requestCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 14,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.dark,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  newRequestLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  newDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#18A567",
    marginRight: 7,
  },
  newRequestText: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  cardTopRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  distanceBadge: {
    backgroundColor: COLORS.paleGreen,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  distanceText: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: "800",
  },
  timerBadge: {
    backgroundColor: "#FFF4D8",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  timerBadgeUrgent: {
    backgroundColor: "#FCE7E5",
  },
  timerText: {
    color: "#9A6A00",
    fontSize: 10,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  timerTextUrgent: {
    color: COLORS.red,
  },
  routePanel: {
    backgroundColor: "#F6FAF7",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 37,
  },
  routeCopy: {
    flex: 1,
    marginLeft: 10,
  },
  routeLabel: {
    color: "#8A968F",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  routeAddress: {
    color: "#294238",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  pickupDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#0B9A63",
    borderWidth: 2,
    borderColor: "#CDEBDD",
  },
  destinationDot: {
    width: 11,
    height: 11,
    borderRadius: 3,
    backgroundColor: "#F0B900",
  },
  routeLine: {
    width: 2,
    height: 13,
    backgroundColor: "#C8D9CF",
    marginLeft: 4,
    marginVertical: -1,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 13,
    paddingHorizontal: 2,
  },
  priceCaption: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  price: {
    color: COLORS.green,
    fontSize: 18,
    fontWeight: "900",
  },
  detailsRight: {
    alignItems: "flex-end",
  },
  vehicle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    marginTop: 14,
  },
  rejectButton: {
    flex: 0.8,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#EBC9C6",
    backgroundColor: "#FFF9F8",
    alignItems: "center",
    justifyContent: "center",
  },
  rejectText: {
    color: COLORS.red,
    fontSize: 13,
    fontWeight: "800",
  },
  acceptButton: {
    flex: 1.5,
    height: 44,
    borderRadius: 13,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 9,
  },
  acceptText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.55,
  },
});
