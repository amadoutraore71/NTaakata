import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Earnings() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>
          Mes revenus
        </Text>

        {/* Revenus du jour */}
        <View style={styles.card}>
          <Text style={styles.label}>
            Revenus aujourd'hui
          </Text>

          <Text style={styles.amount}>
            12 500 FCFA
          </Text>
        </View>

        {/* Revenus semaine */}
        <View style={styles.card}>
          <Text style={styles.label}>
            Revenus cette semaine
          </Text>

          <Text style={styles.amount}>
            78 000 FCFA
          </Text>
        </View>

        {/* Revenus mois */}
        <View style={styles.card}>
          <Text style={styles.label}>
            Revenus ce mois
          </Text>

          <Text style={styles.amount}>
            315 000 FCFA
          </Text>
        </View>

        {/* Nombre de courses */}
        <View style={styles.card}>
          <Text style={styles.label}>
            Courses effectuées
          </Text>

          <Text style={styles.amount}>
            126
          </Text>
        </View>

        {/* Abonnement */}
        <View style={styles.subscriptionCard}>
          <Text style={styles.subscriptionTitle}>
            Abonnement Chauffeur
          </Text>

          <Text style={styles.active}>
            🟢 Actif
          </Text>

          <Text style={styles.subscriptionText}>
            Expire le : 05/06/2026
          </Text>

          <Text style={styles.subscriptionText}>
            Montant journalier : 1000 FCFA
          </Text>
        </View>

        {/* Paiement abonnement */}
        <TouchableOpacity style={styles.payButton}>
          <Text style={styles.payButtonText}>
            Payer l'abonnement
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#0B6E4F",
    margin: 20,
  },

  card: {
    backgroundColor: "#F8F8F8",
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 15,
  },

  label: {
    color: "#666",
    marginBottom: 8,
  },

  amount: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0B6E4F",
  },

  subscriptionCard: {
    backgroundColor: "#FFF8E1",
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 10,
  },

  subscriptionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  active: {
    fontSize: 16,
    fontWeight: "bold",
    color: "green",
    marginBottom: 10,
  },

  subscriptionText: {
    color: "#555",
    marginBottom: 5,
  },

  payButton: {
    backgroundColor: "#F4C300",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  payButtonText: {
    fontWeight: "bold",
    fontSize: 16,
  },
});