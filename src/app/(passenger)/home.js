import {
  addDoc,
  collection,
} from "firebase/firestore";

import {
  useState,
} from "react";

import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  router,
} from "expo-router";

import { db } from "../../../firebase/config";

import LogoutButton from "../../components/LogoutButton";

import {
  getUser,
} from "../../storage/userStorage";

import {
  calculateFare,
} from "../../utils/fareCalculator";

export default function PassengerHome() {
  const [pickup, setPickup] =
    useState("");

  const [
    destination,
    setDestination,
  ] = useState("");

  const handleRideRequest =
    async () => {
      try {
        if (
          !pickup ||
          !destination
        ) {
          Alert.alert(
            "Erreur",
            "Veuillez renseigner le départ et la destination"
          );
          return;
        }

        const user =
          await getUser();

        const distance = 7;

        const price =
          calculateFare(
            pickup,
            destination
          );

await addDoc(
  collection(db, "rides"),
  {
    pickup,
    destination,

    passengerName:
      user?.name || "",

    passengerPhone:
      user?.phone || "",

    distance,

    price,

    status: "pending",

    createdAt:
      new Date().toISOString(),
  }
);

        Alert.alert(
          "Succès",
          "Votre demande a été envoyée"
        );

        setPickup("");
        setDestination("");

        router.push(
          "/(passenger)/ride-status"
        );

      } catch (error) {
        console.log(error);

        Alert.alert(
          "Erreur",
          "Impossible d'envoyer la demande"
        );
      }
    };

  return (
    <SafeAreaView
      style={styles.container}
    >
      <View
        style={styles.header}
      >
        <Text
          style={styles.title}
        >
          Commander une course
        </Text>

        <LogoutButton />
      </View>

      <View style={styles.card}>
        <Text
          style={styles.label}
        >
          📍 Point de départ
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex: Sogoniko"
          value={pickup}
          onChangeText={
            setPickup
          }
        />

        <Text
          style={styles.label}
        >
          🎯 Destination
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex: Kalaban Coura"
          value={destination}
          onChangeText={
            setDestination
          }
        />

        <View
          style={
            styles.priceCard
          }
        >
          <Text
            style={
              styles.priceLabel
            }
          >
            Distance estimée
          </Text>

          <Text
            style={styles.price}
          >
            7 km
          </Text>

          <Text
            style={[
              styles.priceLabel,
              {
                marginTop: 10,
              },
            ]}
          >
            Prix estimé
          </Text>

          <Text
            style={styles.price}
          >
            {calculateFare(
              pickup,
              destination
            )} FCFA
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={
            handleRideRequest
          }
        >
          <Text
            style={
              styles.buttonText
            }
          >
            Commander
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.historyButton
          }
          onPress={() =>
            router.push(
              "/(passenger)/history"
            )
          }
        >
          <Text
            style={
              styles.historyText
            }
          >
            Mes Courses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={styles.historyButton}
            onPress={() =>
              router.push(
                "/(passenger)/drivers-nearby"
              )
            }
          >
            <Text
              style={styles.historyText}
            >
              Conducteurs disponibles
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
  style={styles.historyButton}
  onPress={() =>
    router.push(
      "/(passenger)/drivers-map"
    )
  }
>
  <Text
    style={styles.historyText}
  >
    Voir la carte
  </Text>
</TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#FFFFFF",
      padding: 20,
      marginTop: 80,
    },

    header: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      marginBottom: 20,
    },

    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#0B6E4F",
    },

    card: {
      backgroundColor:
        "#F8F8F8",
      borderRadius: 15,
      padding: 20,
    },

    label: {
      fontWeight: "600",
      marginBottom: 8,
      marginTop: 10,
    },

    input: {
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#E5E5E5",
      borderRadius: 12,
      paddingHorizontal: 15,
      height: 55,
    },

    priceCard: {
      backgroundColor:
        "#FFF3CD",
      padding: 15,
      borderRadius: 12,
      marginTop: 20,
    },

    priceLabel: {
      color: "#666",
    },

    price: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#0B6E4F",
      marginTop: 5,
    },

    button: {
      backgroundColor:
        "#F4C300",
      height: 55,
      borderRadius: 12,
      justifyContent:
        "center",
      alignItems:
        "center",
      marginTop: 20,
    },

    buttonText: {
      fontSize: 18,
      fontWeight: "bold",
    },

    historyButton: {
      backgroundColor:
        "#0B6E4F",
      height: 55,
      borderRadius: 12,
      justifyContent:
        "center",
      alignItems:
        "center",
      marginTop: 15,
    },

    historyText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "bold",
    },
  });