import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";

import { useEffect } from "react";
import { getUser } from "../storage/userStorage";

export default function Index() {

  useEffect(() => {
  checkUser();
}, []);

const checkUser = async () => {
  const user = await getUser();

  if (!user) return;

  if (user.role === "passenger") {
    router.replace("/(passenger)/home");
    return;
  }

  if (user.role === "driver") {
    router.replace("/(driver)/dashboard");
    return;
  }
};
  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8F6F1"
      />

      {/* Logo */}
      <Image
        source={require("../../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Nom application */}
      <Text style={styles.title}>
        <Text style={styles.green}>N'</Text>Taakata
      </Text>

      {/* Slogan */}
      <Text style={styles.slogan}>
        On te rapproche !
      </Text>

      {/* Trait jaune */}
      <View style={styles.line} />

      {/* Description */}
      <Text style={styles.description}>
        Déplace-toi facilement au Mali avec
        des conducteurs de confiance.
      </Text>

      {/* Illustration */}
      <Image
        source={require("../../assets/images/logo.png")}
        style={styles.vehicleImage}
        resizeMode="contain"
      />

      {/* Indicateurs */}
      <View style={styles.dots}>
        <View style={[styles.dot, styles.activeDot]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      {/* Bouton commencer */}
      <TouchableOpacity
        style={styles.button}
          onPress={() => router.push("/role-selection")}
        
        >  
        <Text style={styles.buttonText}>
          Commencer
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F6F1",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingTop: 80,
  },

  logo: {
    width: 130,
    height: 130,
  },

  title: {
    fontSize: 42,
    fontWeight: "bold",
    marginTop: 10,
  },

  green: {
    color: "#0B6E4F",
  },

  slogan: {
    fontSize: 22,
    fontWeight: "600",
    marginTop: 8,
  },

  line: {
    width: 90,
    height: 4,
    backgroundColor: "#F4C300",
    marginTop: 15,
    borderRadius: 20,
  },

  description: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginTop: 20,
    lineHeight: 24,
  },

  vehicleImage: {
    width: 340,
    height: 280,
    marginTop: 30,
  },

  dots: {
    flexDirection: "row",
    marginTop: 10,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#D0D0D0",
    marginHorizontal: 5,
  },

  activeDot: {
    backgroundColor: "#F4C300",
  },

  button: {
    width: "100%",
    backgroundColor: "#F4C300",
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 30,
  },

  buttonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
});