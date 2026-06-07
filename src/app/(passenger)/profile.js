import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";

export default function Profile() {
  const handleLogout = () => {
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Photo profil */}
        <View style={styles.header}>
          <Image
            source={{
              uri: "https://randomuser.me/api/portraits/men/1.jpg",
            }}
            style={styles.avatar}
          />

          <Text style={styles.name}>
            Amadou Traoré
          </Text>

          <Text style={styles.phone}>
            +223 XX XX XX XX
          </Text>
        </View>

        {/* Informations */}
        <View style={styles.card}>
          <Text style={styles.label}>
            Email
          </Text>

          <Text style={styles.value}>
            amadou@email.com
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>
            Courses effectuées
          </Text>

          <Text style={styles.value}>
            24
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>
            Ville
          </Text>

          <Text style={styles.value}>
            Bamako
          </Text>
        </View>

        {/* Modifier profil */}
        <TouchableOpacity
          style={styles.editButton}
        >
          <Text style={styles.editText}>
            Modifier le profil
          </Text>
        </TouchableOpacity>

        {/* Historique */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() =>
            router.push("/(passenger)/history")
          }
        >
          <Text style={styles.secondaryText}>
            Historique des courses
          </Text>
        </TouchableOpacity>

        {/* Déconnexion */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>
            Déconnexion
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

  header: {
    alignItems: "center",
    paddingVertical: 30,
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },

  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 15,
    color: "#0B6E4F",
  },

  phone: {
    color: "#666",
    marginTop: 5,
  },

  card: {
    backgroundColor: "#F8F8F8",
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 15,
    padding: 15,
  },

  label: {
    color: "#666",
    marginBottom: 5,
  },

  value: {
    fontSize: 16,
    fontWeight: "600",
  },

  editButton: {
    backgroundColor: "#F4C300",
    marginHorizontal: 20,
    marginTop: 15,
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  editText: {
    fontWeight: "bold",
    fontSize: 16,
  },

  secondaryButton: {
    backgroundColor: "#0B6E4F",
    marginHorizontal: 20,
    marginTop: 15,
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  secondaryText: {
    color: "#FFF",
    fontWeight: "bold",
  },

  logoutButton: {
    backgroundColor: "#E53935",
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 40,
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  logoutText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});