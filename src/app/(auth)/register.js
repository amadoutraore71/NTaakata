import { useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

const { role } = useLocalSearchParams();

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const { role } = useLocalSearchParams();

  const handleRegister = () => {
    if (!fullName.trim()) {
      Alert.alert(
        "Erreur",
        "Veuillez saisir votre nom complet"
      );
      return;
    }

    if (!phone.trim()) {
      Alert.alert(
        "Erreur",
        "Veuillez saisir votre numéro de téléphone"
      );
      return;
    }

    if (phone.length < 8) {
      Alert.alert(
        "Erreur",
        "Numéro de téléphone invalide"
      );
      return;
    }

router.push({
  pathname: "/(auth)/otp",
  params: {
    fullName,
    phone,
    role,
  },
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
          source={require("../../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>
          Créer un compte
        </Text>

        <Text style={styles.subtitle}>
          Rejoignez N'Taakata
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nom complet"
          value={fullName}
          onChangeText={setFullName}
        />

        <TextInput
          style={styles.input}
          placeholder="Numéro de téléphone"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <TouchableOpacity
          style={styles.registerButton}
          onPress={handleRegister}
        >
          <Text style={styles.registerButtonText}>
            Continuer
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Déjà un compte ?
          </Text>

          <TouchableOpacity
            onPress={() =>
              router.replace("/(auth)/login")
            }
          >
            <Text style={styles.loginText}>
              Se connecter
            </Text>
          </TouchableOpacity>
        </View>

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
    width: 120,
    height: 120,
    alignSelf: "center",
    marginTop: 20,
  },

  title: {
    textAlign: "center",
    fontSize: 30,
    fontWeight: "bold",
    color: "#0B6E4F",
  },

  subtitle: {
    textAlign: "center",
    color: "#666",
    marginTop: 8,
    marginBottom: 30,
  },

  input: {
    height: 55,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    marginHorizontal: 25,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: "#FAFAFA",
  },

  registerButton: {
    backgroundColor: "#F4C300",
    height: 55,
    borderRadius: 12,
    marginHorizontal: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  registerButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
    marginBottom: 30,
  },

  footerText: {
    color: "#666",
  },

  loginText: {
    color: "#0B6E4F",
    fontWeight: "bold",
    marginLeft: 5,
  },
});