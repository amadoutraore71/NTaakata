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



export default function Register() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] =
    useState("");

  const [vehicleBrand, setVehicleBrand] =
    useState("");

  const [vehicleModel, setVehicleModel] =
    useState("");

  const [vehicleColor, setVehicleColor] =
    useState("");

  const [plateNumber, setPlateNumber] =
    useState("");

  const [seats, setSeats] =
    useState("");
  const { role } = useLocalSearchParams();
  console.log("ROLE REGISTER =", role);

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

 if (
  role === "driver" &&
  !vehicleType
) {
  Alert.alert(
    "Erreur",
    "Choisissez un type de véhicule"
  );
  return;
}

if (
  role === "driver" &&
  !vehicleBrand.trim()
) {
  Alert.alert(
    "Erreur",
    "Veuillez saisir la marque du véhicule"
  );
  return;
}

if (
  role === "driver" &&
  !vehicleColor.trim()
) {
  Alert.alert(
    "Erreur",
    "Veuillez saisir la couleur du véhicule"
  );
  return;
}

if (
  role === "driver" &&
  !plateNumber.trim()
) {
  Alert.alert(
    "Erreur",
    "Veuillez saisir l'immatriculation"
  );
  return;
}

if (
  vehicleType === "voiture" &&
  !vehicleModel.trim()
) {
  Alert.alert(
    "Erreur",
    "Veuillez saisir le modèle"
  );
  return;
}

if (
  vehicleType === "voiture" &&
  !seats.trim()
) {
  Alert.alert(
    "Erreur",
    "Veuillez saisir le nombre de places"
  );
  return;
}
    router.push({
      pathname: "/(auth)/otp",
      params: {
        fullName,
        phone,
        role,
        vehicleType,
        vehicleBrand,
        vehicleModel,
        vehicleColor,
        plateNumber,
        seats,
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
        {role === "driver" && (
          <>
            <Text
              style={{
                marginLeft: 25,
                marginBottom: 10,
                fontWeight: "bold",
              }}
            >
              Type de véhicule
            </Text>

            <View
              style={{
                flexDirection: "row",
                marginHorizontal: 25,
                marginBottom: 15,
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor:
                    vehicleType === "moto"
                      ? "#0B6E4F"
                      : "#E5E5E5",
                  padding: 15,
                  borderRadius: 10,
                  marginRight: 5,
                  alignItems: "center",
                }}
                onPress={() =>
                  setVehicleType("moto")
                }
              >
                <Text
                  style={{
                    color:
                      vehicleType === "moto"
                        ? "#FFF"
                        : "#000",
                  }}
                >
                  🏍️ Moto
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor:
                    vehicleType === "voiture"
                      ? "#0B6E4F"
                      : "#E5E5E5",
                  padding: 15,
                  borderRadius: 10,
                  marginLeft: 5,
                  alignItems: "center",
                }}
                onPress={() =>
                  setVehicleType("voiture")
                }
              >
                <Text
                  style={{
                    color:
                      vehicleType === "voiture"
                        ? "#FFF"
                        : "#000",
                  }}
                >
                  🚗 Voiture
                </Text>
              </TouchableOpacity>
            </View>

            {vehicleType === "moto" && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Marque de la moto"
                  value={vehicleBrand}
                  onChangeText={setVehicleBrand}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Couleur de la moto"
                  value={vehicleColor}
                  onChangeText={setVehicleColor}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Immatriculation"
                  value={plateNumber}
                  onChangeText={setPlateNumber}
                />
              </>
            )}

            {vehicleType === "voiture" && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Marque de la voiture"
                  value={vehicleBrand}
                  onChangeText={setVehicleBrand}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Modèle"
                  value={vehicleModel}
                  onChangeText={setVehicleModel}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Couleur"
                  value={vehicleColor}
                  onChangeText={setVehicleColor}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Nombre de places"
                  keyboardType="numeric"
                  value={seats}
                  onChangeText={setSeats}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Immatriculation"
                  value={plateNumber}
                  onChangeText={setPlateNumber}
                />
              </>
            )}
          </>
        )}
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