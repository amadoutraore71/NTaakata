import { useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../../firebase/config";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim()) {
      Alert.alert(
        "Erreur",
        "Veuillez saisir votre numéro de téléphone"
      );
      return;
    }

    try {
      setLoading(true);

      const q = query(
        collection(db, "users"),
        where("phone", "==", phone)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert(
          "Compte introuvable",
          "Veuillez créer un compte"
        );

        setLoading(false);
        return;
      }

      let userData = null;

      querySnapshot.forEach((doc) => {
        userData = {
          id: doc.id,
          ...doc.data(),
        };
      });

      setLoading(false);

      router.push({
        pathname: "/(auth)/otp-login",
        params: {
          phone: userData.phone,
          role: userData.role,
          userId: userData.id,
        },
      });

    } catch (error) {
      console.log(error);

      setLoading(false);

      Alert.alert(
        "Erreur",
        "Impossible de se connecter"
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <Image
        source={require("../../../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>
        Connexion
      </Text>

      <Text style={styles.subtitle}>
        Entrez votre numéro de téléphone
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Numéro de téléphone"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <TouchableOpacity
        style={styles.loginButton}
        onPress={handleLogin}
      >
        <Text style={styles.loginButtonText}>
          {loading
            ? "Chargement..."
            : "Continuer"}
        </Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Pas encore de compte ?
        </Text>

        <TouchableOpacity
          onPress={() =>
            router.push("/(auth)/register")
          }
        >
          <Text style={styles.registerText}>
            Créer un compte
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  logo: {
    width: 140,
    height: 140,
    alignSelf: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#0B6E4F",
    textAlign: "center",
  },

  subtitle: {
    textAlign: "center",
    color: "#666",
    marginTop: 10,
    marginBottom: 30,
  },

  input: {
    height: 55,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: "#FAFAFA",
    fontSize: 16,
  },

  loginButton: {
    backgroundColor: "#F4C300",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  loginButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },

  footerText: {
    color: "#666",
  },

  registerText: {
    color: "#0B6E4F",
    fontWeight: "bold",
    marginLeft: 5,
  },
});