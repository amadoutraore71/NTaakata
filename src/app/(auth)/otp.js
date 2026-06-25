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

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  doc,
  setDoc,
} from "firebase/firestore";

import { db } from "../../../firebase/config";

import {
  saveUser,
} from "../../storage/userStorage";

export default function Otp() {
  const {
    fullName,
    phone,
    role,
    vehicleType,
    vehicleBrand,
    vehicleModel,
    vehicleColor,
    plateNumber,
    seats,
  } = useLocalSearchParams();

  const [otp, setOtp] =
    useState([
      "",
      "",
      "",
      "",
    ]);

  const input1 =
    useRef(null);

  const input2 =
    useRef(null);

  const input3 =
    useRef(null);

  const input4 =
    useRef(null);

  const handleChange = (
    value,
    index
  ) => {
    const newOtp =
      [...otp];

    newOtp[index] =
      value;

    setOtp(newOtp);

    if (
      value &&
      index === 0
    )
      input2.current?.focus();

    if (
      value &&
      index === 1
    )
      input3.current?.focus();

    if (
      value &&
      index === 2
    )
      input4.current?.focus();
  };

  const verifyCode =
    async () => {
      const enteredCode =
        otp.join("");
      console.log("Code saisi =", enteredCode);
      if (
        enteredCode !==
        "1234"
      ) {
        Alert.alert(
          "Erreur",
          "Code OTP incorrect"
        );
        return;
      }

      try {
        const userId =
          Date.now().toString();

        await setDoc(
          doc(
            db,
            "users",
            userId
          ),
          {

            name: fullName,

            phone: phone,

            role: role,

            vehicleType:
              vehicleType || null,

            vehicleBrand:
              vehicleBrand || null,

            vehicleModel:
              vehicleModel || null,

            vehicleColor:
              vehicleColor || null,

            plateNumber:
              plateNumber || null,

            seats:
              seats || null,
            subscriptionActive:
              role ===
                "driver"
                ? false
                : true,

            subscriptionPaidAt:
              null,

            subscriptionExpiresAt:
              null,

            dailyFee:
              role ===
                "driver"
                ? 100
                : 0,
            averageRating: 0,
            totalRatings: 0,
            createdAt:
              new Date().toISOString(),
          }
        );
        console.log({
          userId,
          name: fullName,
          phone,
          role,
          vehicleType,
          vehicleBrand,
          vehicleModel,
          vehicleColor,
          plateNumber,
          seats,
        });
        await saveUser({
          userId,
          name: fullName,
          phone,
          role,
          vehicleType,
          vehicleBrand,
          vehicleModel,
          vehicleColor,
          plateNumber,
          seats,
        });

        Alert.alert(
          "Succès",
          "Compte créé avec succès"
        );

        if (
          role ===
          "passenger"
        ) {
          router.replace(
            "/(passenger)/home"
          );
          return;
        }

        if (
          role ===
          "driver"
        ) {
          router.replace(
            "/(driver)/dashboard"
          );
          return;
        }

        if (
          role ===
          "admin"
        ) {
          router.replace(
            "/(admin)/dashboard"
          );
        }

      } catch (error) {
        console.log(error);

        Alert.alert(
          "Erreur",
          "Impossible de créer le compte"
        );
      }
    };

  return (
    <SafeAreaView
      style={styles.container}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <Text style={styles.title}>
        Vérification
      </Text>

      <Text
        style={styles.subtitle}
      >
        Entrez le code reçu
        par SMS
      </Text>

      <Text
        style={styles.phone}
      >
        {phone}
      </Text>

      <View
        style={
          styles.otpContainer
        }
      >
        <TextInput
          ref={input1}
          style={styles.input}
          maxLength={1}
          keyboardType="number-pad"
          onChangeText={(
            text
          ) =>
            handleChange(
              text,
              0
            )
          }
        />

        <TextInput
          ref={input2}
          style={styles.input}
          maxLength={1}
          keyboardType="number-pad"
          onChangeText={(
            text
          ) =>
            handleChange(
              text,
              1
            )
          }
        />

        <TextInput
          ref={input3}
          style={styles.input}
          maxLength={1}
          keyboardType="number-pad"
          onChangeText={(
            text
          ) =>
            handleChange(
              text,
              2
            )
          }
        />

        <TextInput
          ref={input4}
          style={styles.input}
          maxLength={1}
          keyboardType="number-pad"
          onChangeText={(
            text
          ) =>
            handleChange(
              text,
              3
            )
          }
        />
      </View>

      <TouchableOpacity
        style={
          styles.verifyButton
        }
        onPress={
          verifyCode
        }
      >
        <Text
          style={
            styles.verifyText
          }
        >
          Vérifier
        </Text>
      </TouchableOpacity>

      <Text style={styles.demo}>
        Code de test : 1234
      </Text>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#FFFFFF",
      justifyContent:
        "center",
      alignItems:
        "center",
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
      borderColor:
        "#E5E5E5",
      borderRadius: 12,
      textAlign: "center",
      fontSize: 24,
      marginHorizontal: 6,
    },

    verifyButton: {
      backgroundColor:
        "#F4C300",
      width: "100%",
      height: 55,
      borderRadius: 12,
      justifyContent:
        "center",
      alignItems:
        "center",
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