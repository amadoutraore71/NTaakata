import { useState } from "react";
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

const ridesData = [
  {
    id: "1",
    passenger: "Amadou Traoré",
    driver: "Moussa Traoré",
    amount: "1500 FCFA",
    status: "Terminée",
    date: "06/06/2026",
  },
  {
    id: "2",
    passenger: "Mariam Coulibaly",
    driver: "Amadou Diallo",
    amount: "2500 FCFA",
    status: "En cours",
    date: "06/06/2026",
  },
  {
    id: "3",
    passenger: "Oumar Koné",
    driver: "Boubacar Keita",
    amount: "2000 FCFA",
    status: "Annulée",
    date: "05/06/2026",
  },
];

export default function AdminRides() {
  const [search, setSearch] = useState("");

  const filteredRides = ridesData.filter(
    (ride) =>
      ride.passenger
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      ride.driver
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const renderRide = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.passenger}>
        👤 {item.passenger}
      </Text>

      <Text style={styles.info}>
        🚗 Chauffeur : {item.driver}
      </Text>

      <Text style={styles.info}>
        📅 {item.date}
      </Text>

      <Text style={styles.amount}>
        💰 {item.amount}
      </Text>

      <Text
        style={[
          styles.status,
          item.status === "Terminée"
            ? styles.completed
            : item.status === "En cours"
            ? styles.pending
            : styles.cancelled,
        ]}
      >
        {item.status}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        Gestion des Courses
      </Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Rechercher passager ou chauffeur..."
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filteredRides}
        keyExtractor={(item) => item.id}
        renderItem={renderRide}
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

  passenger: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },

  info: {
    color: "#555",
    marginBottom: 5,
  },

  amount: {
    color: "#0B6E4F",
    fontWeight: "bold",
    fontSize: 18,
    marginTop: 10,
  },

  status: {
    marginTop: 10,
    fontWeight: "bold",
  },

  completed: {
    color: "green",
  },

  pending: {
    color: "#F4C300",
  },

  cancelled: {
    color: "#E53935",
  },
});