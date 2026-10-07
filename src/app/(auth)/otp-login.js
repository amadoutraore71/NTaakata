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
  Keyboard,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { db } from "../../../firebase/config";
import { saveUser } from "../../storage/userStorage";

export default function OtpLogin() {
  const { phone } = useLocalSearchParams();

  const [otp, setOtp] = useState([
    "",
    "",
    "",
    "",
  ]);

  const [verifying, setVerifying] = useState(false);

  const input1 = useRef(null);
  const input2 = useRef(null);
  const input3 = useRef(null);
  const input4 = useRef(null);

  // ============================================================
  // CHANGEMENT D'UN CHIFFRE OTP
  // ============================================================

  const handleChange = async (value, index) => {
    // Garder uniquement le dernier chiffre saisi
    const digit = value.replace(/\D/g, "").slice(-1);

    const newOtp = [...otp];

    newOtp[index] = digit;

    setOtp(newOtp);

    // Passage automatique au champ suivant
    if (digit && index === 0) {
      input2.current?.focus();
    }

    if (digit && index === 1) {
      input3.current?.focus();
    }

    if (digit && index === 2) {
      input4.current?.focus();
    }

    // ==========================================================
    // 4ÈME CHIFFRE → VÉRIFICATION AUTOMATIQUE
    // ==========================================================

    if (digit && index === 3) {
      const enteredCode = newOtp.join("");

      Keyboard.dismiss();

      await verifyCode(enteredCode);
    }
  };

  // ============================================================
  // VÉRIFICATION OTP
  // ============================================================

  const verifyCode = async (enteredCode) => {
    if (verifying) {
      return;
    }

    setVerifying(true);

    // ==========================================================
    // CODE DE TEST
    // ==========================================================

    if (enteredCode !== "1234") {
      setVerifying(false);

      Alert.alert(
        "Code incorrect",
        "Le code OTP saisi est incorrect.",
        [
          {
            text: "OK",
            onPress: () => {
              setOtp([
                "",
                "",
                "",
                "",
              ]);

              input1.current?.focus();
            },
          },
        ]
      );

      return;
    }

    try {
      // ========================================================
      // RECHERCHE DE L'UTILISATEUR
      // ========================================================

      const userQuery = query(
        collection(db, "users"),
        where("phone", "==", phone)
      );

      const snapshot = await getDocs(userQuery);

      if (snapshot.empty) {
        setVerifying(false);

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

      console.log(
        "Utilisateur connecté :",
        user
      );

      // ========================================================
      // SAUVEGARDE LOCALE
      // ========================================================

      await saveUser(user);

      // ========================================================
      // PASSAGER
      // ========================================================

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
            pathname:
              "/(passenger)/RideStatus",
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

      // ========================================================
      // CONDUCTEUR
      // ========================================================

      if (user.role === "driver") {
        router.replace(
          "/(driver)/dashboard"
        );

        return;
      }

      // ========================================================
      // ADMIN
      // ========================================================

      if (user.role === "admin") {
        router.replace(
          "/(admin)/dashboard"
        );

        return;
      }

      // ========================================================
      // RÔLE INCONNU
      // ========================================================

      setVerifying(false);

      Alert.alert(
        "Erreur",
        "Rôle utilisateur inconnu"
      );

    } catch (error) {
      console.log(
        "Erreur connexion OTP :",
        error
      );

      setVerifying(false);

      Alert.alert(
        "Erreur",
        "Impossible de se connecter"
      );
    }
  };

  // ============================================================
  // INTERFACE
  // ============================================================

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

        {/* CHIFFRE 1 */}
        <TextInput
          ref={input1}
          style={styles.input}
          maxLength={1}
          keyboardType="number-pad"
          autoFocus
          value={otp[0]}
          onChangeText={(text) =>
            handleChange(text, 0)
          }
        />

        {/* CHIFFRE 2 */}
        <TextInput
          ref={input2}
          style={styles.input}
          maxLength={1}
          keyboardType="number-pad"
          value={otp[1]}
          onChangeText={(text) =>
            handleChange(text, 1)
          }
        />

        {/* CHIFFRE 3 */}
        <TextInput
          ref={input3}
          style={styles.input}
          maxLength={1}
          keyboardType="number-pad"
          value={otp[2]}
          onChangeText={(text) =>
            handleChange(text, 2)
          }
        />

        {/* CHIFFRE 4 */}
        <TextInput
          ref={input4}
          style={[
            styles.input,
            verifying && styles.inputVerifying,
          ]}
          maxLength={1}
          keyboardType="number-pad"
          value={otp[3]}
          onChangeText={(text) =>
            handleChange(text, 3)
          }
        />

      </View>

      {/* MESSAGE PENDANT LA VÉRIFICATION */}

      {verifying && (
        <Text style={styles.verifyingText}>
          Vérification...
        </Text>
      )}

      {/* CODE DE TEST */}

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
    backgroundColor: "#FAFAFA",
  },

  inputVerifying: {
    borderColor: "#0B6E4F",
  },

  verifyingText: {
    color: "#0B6E4F",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: -20,
  },

  demo: {
    marginTop: 20,
    color: "#666",
  },
});