import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { router } from "expo-router";

export default function AdminDashboard() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>

        <Text style={styles.title}>
          Administration
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>
            Utilisateurs
          </Text>

          <Text style={styles.value}>
            2 540
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>
            Chauffeurs
          </Text>

          <Text style={styles.value}>
            385
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>
            Courses aujourd'hui
          </Text>

          <Text style={styles.value}>
            1 240
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>
            Revenus N'Taakata
          </Text>

          <Text style={styles.value}>
            325 000 FCFA
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.push("/(admin)/users")
          }
        >
          <Text style={styles.buttonText}>
            Gérer les utilisateurs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.push("/(admin)/drivers")
          }
        >
          <Text style={styles.buttonText}>
            Gérer les chauffeurs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.push("/(admin)/rides")
          }
        >
          <Text style={styles.buttonText}>
            Voir les courses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.push("/(admin)/subscriptions")
          }
        >
          <Text style={styles.buttonText}>
            Gérer les abonnements
          </Text>
        </TouchableOpacity>

      </ScrollView>
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
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#F8F8F8",
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },

  label: {
    color: "#666",
  },

  value: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginTop: 5,
  },

  button: {
    backgroundColor: "#F4C300",
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
  },

  buttonText: {
    fontWeight: "bold",
  },
});