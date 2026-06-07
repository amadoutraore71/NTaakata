import {
    SafeAreaView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { router } from "expo-router";

export default function DriverDashboard() {
  return (
    <SafeAreaView style={styles.container}>

      <Text style={styles.title}>
        Tableau de bord
      </Text>

      {/* Statut */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>
          Statut Chauffeur
        </Text>

        <View style={styles.statusRow}>
          <Text style={styles.activeText}>
            🟢 En ligne
          </Text>

          <Switch value={true} />
        </View>
      </View>

      {/* Revenus */}
      <View style={styles.card}>
        <Text style={styles.label}>
          Revenus aujourd'hui
        </Text>

        <Text style={styles.amount}>
          12 500 FCFA
        </Text>
      </View>

      {/* Courses */}
      <View style={styles.card}>
        <Text style={styles.label}>
          Courses effectuées
        </Text>

        <Text style={styles.amount}>
          8
        </Text>
      </View>

      {/* Actions */}
      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push("/(driver)/requests")
        }
      >
        <Text style={styles.buttonText}>
          Voir les demandes
        </Text>
      </TouchableOpacity>

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

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginBottom: 25,
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
});