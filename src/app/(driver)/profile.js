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

export default function DriverProfile() {

  const handleLogout = () => {
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profil */}
        <View style={styles.header}>
          <Image
            source={{
              uri: "https://randomuser.me/api/portraits/men/10.jpg",
            }}
            style={styles.avatar}
          />

          <Text style={styles.name}>
            Moussa Traoré
          </Text>

          <Text style={styles.phone}>
            +223 76 00 00 00
          </Text>
        </View>

        {/* Informations */}
        <View style={styles.card}>
          <Text style={styles.label}>
            Type de véhicule
          </Text>

          <Text style={styles.value}>
            🏍️ Moto
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>
            Immatriculation
          </Text>

          <Text style={styles.value}>
            BK-1234-MD
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>
            Note moyenne
          </Text>

          <Text style={styles.value}>
            ⭐ 4.8 / 5
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>
            Courses réalisées
          </Text>

          <Text style={styles.value}>
            126
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
    color: "#0B6E4F",
    marginTop: 15,
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
    marginTop: 10,
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  editText: {
    fontWeight: "bold",
    fontSize: 16,
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
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});