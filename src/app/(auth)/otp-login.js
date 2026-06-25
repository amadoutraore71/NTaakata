import {
  router,
  useLocalSearchParams,
} from "expo-router";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useRef, useState } from "react";
import {
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { db } from "../../../firebase/config";
import { saveUser } from "../../storage/userStorage";
export default function OtpLogin() {
  const { phone, role } =
    useLocalSearchParams();

  const [otp, setOtp] = useState([
    "",
    "",
    "",
    "",
  ]);

  const input1 = useRef(null);
  const input2 = useRef(null);
  const input3 = useRef(null);
  const input4 = useRef(null);

  const handleChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index === 0)
      input2.current?.focus();

    if (value && index === 1)
      input3.current?.focus();

    if (value && index === 2)
      input4.current?.focus();
  };
  const verifyCode = async () => {
    const enteredCode = otp.join("");

    // Vérification OTP
    if (enteredCode !== "1234") {
      Alert.alert(
        "Erreur",
        "Code OTP incorrect"
      );
      return;
    }

    try {
      // Recherche de l'utilisateur
      const userQuery = query(
        collection(db, "users"),
        where("phone", "==", phone)
      );

      const snapshot = await getDocs(userQuery);

      if (snapshot.empty) {
        Alert.alert(
          "Erreur",
          "Utilisateur introuvable"
        );
        return;
      }

      let user = null;

      snapshot.forEach((doc) => {
        user = {
          userId: doc.id,
          ...doc.data(),
        };
      });

      console.log("Utilisateur connecté :", user);

      // Sauvegarde locale
      await saveUser(user);

      // ===========================
      // PASSAGER
      // ===========================
      if (user.role === "passenger") {
        const rideQuery = query(
          collection(db, "rides"),
          where(
            "passengerPhone",
            "==",
            user.phone
          )
        );

        const rideSnapshot =
          await getDocs(rideQuery);

        let activeRide = null;
        rideSnapshot.forEach((doc) => {
          const ride = {
            id: doc.id,
            ...doc.data(),
          };

          if (
            ride.status === "pending" ||
            ride.status === "accepted" ||
            ride.status === "started"
          ) {
            activeRide = ride;
          }
        });

        if (activeRide) {
          router.replace({
            pathname: "/(passenger)/ride-status",
            params: {
              rideId: activeRide.id,
            },
          });
        } else {
          router.replace(
            "/(passenger)/home"
          );
        }

        return;
      }

      // ===========================
      // CONDUCTEUR
      // ===========================
      if (user.role === "driver") {
        router.replace(
          "/(driver)/dashboard"
        );
        return;
      }

      // ===========================
      // ADMIN
      // ===========================
      if (user.role === "admin") {
        router.replace(
          "/(admin)/dashboard"
        );
        return;
      }

      Alert.alert(
        "Erreur",
        "Rôle utilisateur inconnu"
      );

    } catch (error) {
      console.log(error);

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

      <Text style={styles.title}>
        Vérification
      </Text>

      <Text style={styles.subtitle}>
        Entrez le code reçu par SMS
      </Text>

      <Text style={styles.phone}>
        {phone}
      </Text>

      <View style={styles.otpContainer}>
        <TextInput
          ref={input1}
          style={styles.input}
          maxLength={1}
          keyboardType="number-pad"
          onChangeText={(text) =>
            handleChange(text, 0)
          }
        />

        <TextInput
          ref={input2}
          style={styles.input}
          maxLength={1}
          keyboardType="number-pad"
          onChangeText={(text) =>
            handleChange(text, 1)
          }
        />

        <TextInput
          ref={input3}
          style={styles.input}
          maxLength={1}
          keyboardType="number-pad"
          onChangeText={(text) =>
            handleChange(text, 2)
          }
        />

        <TextInput
          ref={input4}
          style={styles.input}
          maxLength={1}
          keyboardType="number-pad"
          onChangeText={(text) =>
            handleChange(text, 3)
          }
        />
      </View>

      <TouchableOpacity
        style={styles.verifyButton}
        onPress={verifyCode}
      >
        <Text style={styles.verifyText}>
          Vérifier
        </Text>
      </TouchableOpacity>

      <Text style={styles.demo}>
        Code de test : 1234
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#0B6E4F",
  },

  subtitle: {
    color: "#666",
    marginTop: 10,
    textAlign: "center",
  },

  phone: {
    marginTop: 10,
    color: "#0B6E4F",
    fontWeight: "bold",
  },

  otpContainer: {
    flexDirection: "row",
    marginVertical: 40,
  },

  input: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 24,
    marginHorizontal: 6,
  },

  verifyButton: {
    backgroundColor: "#F4C300",
    width: "100%",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  verifyText: {
    fontSize: 18,
    fontWeight: "bold",
  },

  demo: {
    marginTop: 20,
    color: "#666",
  },
});