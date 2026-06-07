import { useState } from "react";
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

const subscriptionsData = [
  {
    id: "1",
    driver: "Moussa Traoré",
    plan: "Journalier",
    amount: "1000 FCFA",
    status: "Actif",
    expiry: "07/06/2026",
  },
  {
    id: "2",
    driver: "Amadou Diallo",
    plan: "Journalier",
    amount: "1000 FCFA",
    status: "Expiré",
    expiry: "05/06/2026",
  },
];

export default function AdminSubscriptions() {
  const [search, setSearch] = useState("");

  const filteredSubscriptions =
    subscriptionsData.filter((item) =>
      item.driver
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  const renderSubscription = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.driver}>
        👨🏾‍✈️ {item.driver}
      </Text>

      <Text style={styles.info}>
        📦 Offre : {item.plan}
      </Text>

      <Text style={styles.info}>
        💰 Montant : {item.amount}
      </Text>

      <Text style={styles.info}>
        📅 Expiration : {item.expiry}
      </Text>

      <Text
        style={[
          styles.status,
          item.status === "Actif"
            ? styles.active
            : styles.expired,
        ]}
      >
        {item.status}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        Abonnements Chauffeurs
      </Text>

      {/* Statistiques */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>
          Revenus Abonnements
        </Text>

        <Text style={styles.statsAmount}>
          325 000 FCFA
        </Text>

        <Text style={styles.statsInfo}>
          Chauffeurs actifs : 385
        </Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Rechercher un chauffeur..."
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filteredSubscriptions}
        keyExtractor={(item) => item.id}
        renderItem={renderSubscription}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginBottom: 20,
  },

  statsCard: {
    backgroundColor: "#FFF8E1",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },

  statsTitle: {
    color: "#666",
  },

  statsAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginTop: 10,
  },

  statsInfo: {
    marginTop: 10,
    color: "#555",
  },

  searchInput: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#F8F8F8",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },

  driver: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },

  info: {
    color: "#555",
    marginBottom: 5,
  },

  status: {
    marginTop: 10,
    fontWeight: "bold",
  },

  active: {
    color: "green",
  },

  expired: {
    color: "#E53935",
  },
});