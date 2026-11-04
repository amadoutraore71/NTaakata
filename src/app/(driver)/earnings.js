import { useCallback, useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { db } from "../../../firebase/config";
import { getUser } from "../../storage/userStorage";

function getDateValue(value) {
  if (!value) return null;

  let date = null;

  if (typeof value?.toDate === "function") {
    date = value.toDate();
  } else if (value instanceof Date) {
    date = value;
  } else if (typeof value?.seconds === "number") {
    date = new Date(value.seconds * 1000);
  } else if (typeof value === "number") {
    date = new Date(value < 1e12 ? value * 1000 : value);
  } else if (typeof value === "string") {
    date = new Date(value);
  }

  return date instanceof Date && !Number.isNaN(date.getTime())
    ? date
    : null;
}

function getBamakoDateKey(date) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Africa/Bamako",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
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

function isSameWeek(date, today) {
  const dateParts = getBamakoDateParts(date);
  const todayParts = getBamakoDateParts(today);

  // Les dates sont converties en UTC uniquement pour calculer le jour civil
  // de Bamako, qui est en UTC+0.
  const dateUtc = new Date(Date.UTC(
    dateParts.year,
    dateParts.month - 1,
    dateParts.day
  ));
  const todayUtc = new Date(Date.UTC(
    todayParts.year,
    todayParts.month - 1,
    todayParts.day
  ));

  const dayOfWeek = (todayUtc.getUTCDay() + 6) % 7; // lundi = 0
  const weekStart = new Date(todayUtc);
  weekStart.setUTCDate(todayUtc.getUTCDate() - dayOfWeek);

  return dateUtc >= weekStart && dateUtc <= todayUtc;
}

function isSameMonth(date, today) {
  const a = getBamakoDateParts(date);
  const b = getBamakoDateParts(today);
  return a.year === b.year && a.month === b.month;
}

function formatMoney(value) {
  return `${Math.round(Number(value) || 0).toLocaleString("fr-FR")} FCFA`;
}


export default function Earnings() {
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [weekRevenue, setWeekRevenue] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [completedRides, setCompletedRides] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadEarnings = useCallback(async () => {
    try {
      setLoading(true);

      const driver = await getUser();
      if (!driver?.userId) {
        setTodayRevenue(0);
        setWeekRevenue(0);
        setMonthRevenue(0);
        setCompletedRides(0);
        return;
      }

      const today = new Date();
      const todayKey = getBamakoDateKey(today);

      const ridesSnapshot = await getDocs(
        query(
          collection(db, "rides"),
          where("driverId", "==", driver.userId)
        )
      );

      let todayTotal = 0;
      let weekTotal = 0;
      let monthTotal = 0;
      let allCompleted = 0;

      ridesSnapshot.forEach((rideDocument) => {
        const ride = rideDocument.data();

        if (ride.status !== "completed") return;

        allCompleted += 1;

        const completedAt = getDateValue(ride.completedAt);
        if (!completedAt) return;

        const amountValue =
          ride.paidAmount !== null && ride.paidAmount !== undefined
            ? ride.paidAmount
            : ride.estimatedPrice;

        const amount = Number(amountValue);
        if (!Number.isFinite(amount) || amount <= 0) return;

        if (getBamakoDateKey(completedAt) === todayKey) {
          todayTotal += amount;
        }

        if (isSameWeek(completedAt, today)) {
          weekTotal += amount;
        }

        if (isSameMonth(completedAt, today)) {
          monthTotal += amount;
        }
      });

      setTodayRevenue(todayTotal);
      setWeekRevenue(weekTotal);
      setMonthRevenue(monthTotal);
      setCompletedRides(allCompleted);

    } catch (error) {
      console.error("Erreur chargement des revenus :", error);
      Alert.alert(
        "Erreur",
        "Impossible de charger vos revenus. Vérifiez votre connexion puis réessayez."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Mes revenus</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadEarnings}
            accessibilityRole="button"
            accessibilityLabel="Actualiser les revenus"
          >
            <Text style={styles.refreshText}>↻</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.loading}>Chargement des revenus...</Text>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.label}>Revenus aujourd'hui</Text>
              <Text style={styles.amount}>{formatMoney(todayRevenue)}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Revenus cette semaine</Text>
              <Text style={styles.amount}>{formatMoney(weekRevenue)}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Revenus ce mois</Text>
              <Text style={styles.amount}>{formatMoney(monthRevenue)}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Courses effectuées</Text>
              <Text style={styles.amount}>{completedRides.toLocaleString("fr-FR")}</Text>
            </View>

          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingTop: 22,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 22,
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 30,
    fontWeight: "bold",
    color: "#0B6E4F",
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#E5F4ED",
    alignItems: "center",
    justifyContent: "center",
  },
  refreshText: {
    color: "#0B6E4F",
    fontSize: 25,
    fontWeight: "bold",
  },
  loading: {
    marginTop: 35,
    textAlign: "center",
    color: "#666666",
  },
  card: {
    flexGrow: 1,
    minHeight: 96,
    backgroundColor: "#F8F8F8",
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    alignSelf: "stretch",
    justifyContent: "center",
  },
  label: {
    color: "#666666",
    marginBottom: 8,
  },
  amount: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0B6E4F",
  },
});
