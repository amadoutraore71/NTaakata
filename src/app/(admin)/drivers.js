import { useState } from "react";
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const driversData = [
  {
    id: "1",
    name: "Moussa Traoré",
    vehicle: "Moto",
    plate: "BK-1234-MD",
    subscription: "Actif",
    earnings: "315 000 FCFA",
  },
  {
    id: "2",
    name: "Amadou Diallo",
    vehicle: "Voiture",
    plate: "BK-5678-MD",
    subscription: "Expiré",
    earnings: "450 000 FCFA",
  },
];

export default function AdminDrivers() {
  const [search, setSearch] = useState("");

  const filteredDrivers = driversData.filter(
    (driver) =>
      driver.name
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const renderDriver = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>
        {item.name}
      </Text>

      <Text style={styles.info}>
        🚗 {item.vehicle}
      </Text>

      <Text style={styles.info}>
        📄 {item.plate}
      </Text>

      <Text
        style={[
          styles.subscription,
          item.subscription === "Actif"
            ? styles.active
            : styles.expired,
        ]}
      >
        {item.subscription}
      </Text>

      <Text style={styles.earnings}>
        💰 {item.earnings}
      </Text>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.activateButton}
        >
          <Text style={styles.buttonText}>
            Activer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.disableButton}
        >
          <Text style={styles.buttonText}>
            Désactiver
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        Gestion Chauffeurs
      </Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Rechercher un chauffeur..."
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filteredDrivers}
        keyExtractor={(item) => item.id}
        renderItem={renderDriver}
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

  name: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },

  info: {
    color: "#555",
    marginBottom: 5,
  },

  subscription: {
    fontWeight: "bold",
    marginTop: 5,
  },

  active: {
    color: "green",
  },

  expired: {
    color: "red",
  },

  earnings: {
    color: "#0B6E4F",
    fontWeight: "bold",
    marginTop: 10,
  },

  buttons: {
    flexDirection: "row",
    marginTop: 15,
  },

  activateButton: {
    flex: 1,
    backgroundColor: "#0B6E4F",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 5,
  },

  disableButton: {
    flex: 1,
    backgroundColor: "#E53935",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginLeft: 5,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});