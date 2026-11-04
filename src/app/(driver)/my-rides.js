import { useCallback, useEffect, useState } from "react";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import Header from "../../components/Header";
import { db } from "../../../firebase/config";
import { getUser } from "../../storage/userStorage";

function getDateMillis(value) {
  if (!value) return 0;

  if (typeof value?.toDate === "function") {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime())
      ? date.getTime()
      : 0;
  }

  if (typeof value?.seconds === "number") {
    return value.seconds * 1000;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? 0 : value.getTime();
  }

  if (typeof value === "number") {
    return value < 1e12 ? value * 1000 : value;
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function getBamakoDateParts(date) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Africa/Bamako",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, Number(part.value)]));
}

function isThisWeek(value, now = new Date()) {
  const millis = getDateMillis(value);
  if (!millis) return false;

  const dateParts = getBamakoDateParts(new Date(millis));
  const todayParts = getBamakoDateParts(now);

  const completedDay = new Date(Date.UTC(
    dateParts.year,
    dateParts.month - 1,
    dateParts.day
  ));
  const today = new Date(Date.UTC(
    todayParts.year,
    todayParts.month - 1,
    todayParts.day
  ));

  // Semaine du lundi au dimanche, selon la date locale de Bamako.
  const daySinceMonday = (today.getUTCDay() + 6) % 7;
  const weekStart = new Date(today);
  weekStart.setUTCDate(today.getUTCDate() - daySinceMonday);

  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

  return completedDay >= weekStart && completedDay < weekEnd;
}

function formatLocation(location, fallbackLabel) {
  if (typeof location === "string" && location.trim()) {
    return location;
  }

  if (
    location &&
    typeof location === "object" &&
    typeof location.address === "string" &&
    location.address.trim()
  ) {
    return location.address;
  }

  // Ne pas exposer les coordonnées GPS brutes dans l'historique.
  // Si aucune adresse lisible n'est disponible, afficher un libellé clair.
  return fallbackLabel;
}

function formatDate(value) {
  const millis = getDateMillis(value);
  if (!millis) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Bamako",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(millis));
}

function formatMoney(value) {
  return `${Math.round(Number(value) || 0).toLocaleString("fr-FR")} FCFA`;
}

export default function MyRides() {
  const [rides, setRides] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadRides = useCallback(async () => {
    try {
      setLoading(true);

      const currentDriver = await getUser();

      if (!currentDriver?.userId) {
        setRides([]);
        setTotalRevenue(0);
        return;
      }

      const ridesQuery = query(
        collection(db, "rides"),
        where("driverId", "==", currentDriver.userId)
      );

      const snapshot = await getDocs(ridesQuery);
      const now = new Date();
      const weeklyRides = [];
      let weeklyRevenue = 0;

      snapshot.forEach((rideDoc) => {
        const ride = rideDoc.data();

        // Cet écran affiche uniquement les courses terminées cette semaine.
        if (ride.status !== "completed") return;
        if (!isThisWeek(ride.completedAt, now)) return;

        const amountValue =
          ride.paidAmount !== null && ride.paidAmount !== undefined
            ? ride.paidAmount
            : ride.estimatedPrice;

        const amount = Number(amountValue);
        if (Number.isFinite(amount) && amount > 0) {
          weeklyRevenue += amount;
        }

        weeklyRides.push({
          id: rideDoc.id,
          ...ride,
        });
      });

      weeklyRides.sort(
        (a, b) => getDateMillis(b.completedAt) - getDateMillis(a.completedAt)
      );

      setRides(weeklyRides);
      setTotalRevenue(weeklyRevenue);
    } catch (error) {
      console.error("Erreur chargement des courses de la semaine :", error);
      Alert.alert(
        "Erreur",
        "Impossible de charger les courses de cette semaine."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRides();
  }, [loadRides]);

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Mes Courses"
        profileRoute="/(driver)/profile"
      />

      <View style={styles.pageContent}>
        <Text style={styles.title}>Courses de la semaine</Text>
        <Text style={styles.subtitle}>
          Du lundi au dimanche
        </Text>

        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>
            Revenus des courses cette semaine
          </Text>
          <Text style={styles.revenue}>
            {formatMoney(totalRevenue)}
          </Text>
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <Text style={styles.empty}>Chargement des courses...</Text>
          ) : rides.length === 0 ? (
            <Text style={styles.empty}>
              Aucune course terminée cette semaine.
            </Text>
          ) : (
            rides.map((ride) => (
              <View key={ride.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.rideHeading}>
                    <Text style={styles.rideHeadingTitle}>Trajet effectué</Text>
                    <Text style={styles.rideDate}>
                      {formatDate(ride.completedAt)}
                    </Text>
                  </View>

                  <View style={styles.completedBadge}>
                    <View style={styles.completedDot} />
                    <Text style={styles.completedBadgeText}>Terminée</Text>
                  </View>
                </View>

                <View style={styles.routePanel}>
                  <View style={styles.routeRow}>
                    <View style={styles.pickupDot} />
                    <View style={styles.routeCopy}>
                      <Text style={styles.routeLabel}>DÉPART</Text>
                      <Text style={styles.routeAddress} numberOfLines={2}>
                        {formatLocation(ride.pickup, "Position de départ enregistrée")}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.routeConnector} />

                  <View style={styles.routeRow}>
                    <View style={styles.destinationDot} />
                    <View style={styles.routeCopy}>
                      <Text style={styles.routeLabel}>DESTINATION</Text>
                      <Text style={styles.routeAddress} numberOfLines={2}>
                        {formatLocation(ride.destination, "Destination enregistrée")}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.amountCaption}>MONTANT DE LA COURSE</Text>
                    <Text style={styles.price}>
                      {formatMoney(
                        ride.paidAmount !== null && ride.paidAmount !== undefined
                          ? ride.paidAmount
                          : ride.estimatedPrice
                      )}
                    </Text>
                  </View>
                  <View style={styles.receiptIcon}>
                    <Text style={styles.receiptIconText}>✓</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  pageContent: {
    flex: 1,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginTop: 8,
  },
  subtitle: {
    color: "#78827C",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  revenueCard: {
    backgroundColor: "#FFF7D6",
    borderRadius: 15,
    padding: 17,
    marginBottom: 14,
  },
  revenueLabel: {
    color: "#666666",
    fontSize: 13,
  },
  revenue: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginTop: 7,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  empty: {
    textAlign: "center",
    color: "#777777",
    marginTop: 35,
    fontSize: 15,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 15,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: "#E5EEE8",
    shadowColor: "#073B2D",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  rideHeading: {
    flex: 1,
    marginRight: 8,
  },
  rideHeadingTitle: {
    color: "#18352B",
    fontSize: 14,
    fontWeight: "800",
  },
  rideDate: {
    color: "#849089",
    fontSize: 11,
    marginTop: 3,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E4F5EB",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  completedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16945B",
    marginRight: 6,
  },
  completedBadgeText: {
    color: "#0B6E4F",
    fontSize: 10,
    fontWeight: "800",
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
    minHeight: 36,
  },
  routeCopy: {
    flex: 1,
    marginLeft: 10,
  },
  routeLabel: {
    color: "#89958E",
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
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0B9A63",
    borderWidth: 2,
    borderColor: "#CDEBDD",
  },
  destinationDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
    backgroundColor: "#F0B900",
  },
  routeConnector: {
    height: 13,
    width: 2,
    backgroundColor: "#C8D9CF",
    marginLeft: 4,
    marginVertical: -1,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 13,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: "#EEF2EF",
  },
  amountCaption: {
    color: "#89958E",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  price: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0B6E4F",
  },
  receiptIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#E5F4ED",
    alignItems: "center",
    justifyContent: "center",
  },
  receiptIconText: {
    color: "#0B6E4F",
    fontSize: 17,
    fontWeight: "900",
  },
});
