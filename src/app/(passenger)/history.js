import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";

const rides = [
  {
    id: "1",
    date: "02 Juin 2026",
    from: "Sogoniko",
    to: "Badalabougou",
    amount: "1500 FCFA",
    status: "Terminée",
  },
  {
    id: "2",
    date: "01 Juin 2026",
    from: "Kalaban Coura",
    to: "ACI 2000",
    amount: "2500 FCFA",
    status: "Terminée",
  },
  {
    id: "3",
    date: "30 Mai 2026",
    from: "Banankabougou",
    to: "Hamdallaye",
    amount: "1800 FCFA",
    status: "Terminée",
  },
];

export default function History() {
  const renderRide = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.date}>
        {item.date}
      </Text>

      <Text style={styles.route}>
        📍 {item.from}
      </Text>

      <Text style={styles.route}>
        🎯 {item.to}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.amount}>
          {item.amount}
        </Text>

        <Text style={styles.status}>
          {item.status}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        Historique des courses
      </Text>

      <FlatList
        data={rides}
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

  card: {
    backgroundColor: "#F8F8F8",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
  },

  date: {
    color: "#666",
    marginBottom: 10,
  },

  route: {
    fontSize: 16,
    marginBottom: 5,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  amount: {
    color: "#0B6E4F",
    fontWeight: "bold",
    fontSize: 16,
  },

  status: {
    color: "green",
    fontWeight: "600",
  },
});