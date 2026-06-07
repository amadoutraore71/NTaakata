import {
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";

export default function RoleSelection() {
  const handleRoleSelect = (role) => {
    router.push({
      pathname: "/(auth)/register",
      params: { role },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.appName}>
          N'Taakata
        </Text>

        <Text style={styles.slogan}>
          Votre trajet, en toute confiance
        </Text>

        {/* Titre */}
        <Text style={styles.title}>
          Qui êtes-vous ?
        </Text>

        <Text style={styles.subtitle}>
          Choisissez votre profil pour continuer
        </Text>

        {/* Décor */}
        <View style={styles.decorContainer}>
          <Image
            source={require("../../assets/images/motorbike.png")}
            style={styles.motorbike}
            resizeMode="contain"
          />

          <Image
            source={require("../../assets/images/car.png")}
            style={styles.car}
            resizeMode="contain"
          />
        </View>

        {/* Passager */}
        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            handleRoleSelect("passenger")
          }
        >
          <Image
            source={require("../../assets/images/passenger.png")}
            style={styles.roleImage}
          />

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              Passager
            </Text>

            <Text style={styles.cardDescription}>
              Je cherche un moyen de transport
            </Text>
          </View>

          <Text style={styles.arrow}>
            ›
          </Text>
        </TouchableOpacity>

        {/* Conducteur */}
        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            handleRoleSelect("driver")
          }
        >
          <Image
            source={require("../../assets/images/driver.png")}
            style={styles.roleImage}
          />

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              Conducteur
            </Text>

            <Text style={styles.cardDescription}>
              Je veux offrir mes services de transport
            </Text>
          </View>

          <Text style={styles.arrow}>
            ›
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Vous avez déjà un compte ?
          </Text>

          <TouchableOpacity
            onPress={() =>
              router.push("/(auth)/login")
            }
          >
            <Text style={styles.loginText}>
              Se connecter
            </Text>
          </TouchableOpacity>
        </View>

        {/* Motif bas */}
        <Image
          source={require("../../assets/images/pattern.png")}
          style={styles.pattern}
          resizeMode="stretch"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  logo: {
    width: 110,
    height: 110,
    alignSelf: "center",
    marginTop: 20,
  },

  appName: {
    textAlign: "center",
    fontSize: 36,
    fontWeight: "bold",
    color: "#0B6E4F",
  },

  slogan: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },

  title: {
    textAlign: "center",
    fontSize: 34,
    fontWeight: "bold",
    marginTop: 40,
    color: "#111",
  },

  subtitle: {
    textAlign: "center",
    color: "#666",
    fontSize: 18,
    marginTop: 10,
    marginBottom: 20,
  },

  decorContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  motorbike: {
    width: 110,
    height: 70,
  },

  car: {
    width: 120,
    height: 70,
  },

  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 25,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 5,
  },

  roleImage: {
    width: 110,
    height: 110,
    borderRadius: 20,
  },

  cardContent: {
    flex: 1,
    marginLeft: 15,
  },

  cardTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0B6E4F",
  },

  cardDescription: {
    marginTop: 8,
    fontSize: 16,
    color: "#555",
    lineHeight: 24,
  },

  arrow: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#0B6E4F",
  },

  footer: {
    marginTop: 15,
    alignItems: "center",
  },

  footerText: {
    color: "#666",
    fontSize: 18,
  },

  loginText: {
    marginTop: 10,
    color: "#0B6E4F",
    fontSize: 24,
    fontWeight: "bold",
  },

  pattern: {
    width: "100%",
    height: 60,
    marginTop: 25,
    marginBottom: 20,
  },
});