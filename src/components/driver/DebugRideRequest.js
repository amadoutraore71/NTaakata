import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";

import { db } from "../../../firebase/config";
import { getUser } from "../../storage/userStorage";

export default function DebugRideRequest() {

  const createDebugRequest = async () => {

    try {

      console.log(
        "========================================"
      );

      console.log(
        "🧪 CRÉATION DEMANDE DEBUG CONDUCTEUR"
      );

      // =================================================
      // 1. RÉCUPÉRER LE CONDUCTEUR CONNECTÉ
      // =================================================

      const driver = await getUser();

      if (!driver?.userId) {

        Alert.alert(
          "Erreur",
          "Conducteur connecté introuvable."
        );

        return;
      }

      console.log(
        "🚗 Conducteur debug :",
        driver.userId
      );

      // =================================================
      // 2. COORDONNÉES DEBUG
      // =================================================

 const pickup = {
  latitude: 13.4300,
  longitude: -6.2600,
  address: "Position debug du passager",
};

      const destination = {
        latitude: 13.4322042,
        longitude: -6.2773017,
        address:
          "API Ségou, Avenue de l'An 2000",
      };

      // =================================================
      // 3. CRÉER UNE FAUSSE COURSE
      // =================================================

      const rideRef = await addDoc(
        collection(
          db,
          "rides"
        ),
        {
          passengerId:
            "DEBUG_PASSENGER",

          passengerName:
            "Passager Debug",

          passengerPhone:
            "70000000",

          driverId:
            null,

          driverName:
            null,

          driverPhone:
            null,

          driverVehicleType:
            null,

          driverDistance:
            null,

          pickup,

          destination,

          estimatedDistance:
            2.2,

          estimatedDuration:
            3,

          estimatedPrice:
            500,

          vehicleType:
            driver.vehicleType ??
            "moto",

          status:
            "searching",

          createdAt:
            serverTimestamp(),

          acceptedAt:
            null,

          driverArrivingAt:
            null,

          arrivedAt:
            null,

          startedAt:
            null,

          completedAt:
            null,

          cancelledAt:
            null,

          searchEndedAt:
            null,

          paymentStatus:
            "pending",

          paymentMethod:
            "Espèces",

          ratingSubmitted:
            false,

          attemptedDrivers:
            [driver.userId],

          contactedDrivers:
            [driver.userId],

          searchMode:
            "broadcast",

          debug:
            true,
        }
      );

      console.log(
        "✅ Course debug créée :",
        rideRef.id
      );

      // =================================================
      // 4. CRÉER LA DEMANDE POUR CE CONDUCTEUR
      // =================================================

      const requestRef =
        await addDoc(
          collection(
            db,
            "ride_requests"
          ),
          {
            rideId:
              rideRef.id,

            driverId:
              driver.userId,

            driverName:
              driver.name ??
              "Conducteur Debug",

            driverVehicleType:
              driver.vehicleType ??
              "moto",

            driverDistance:
              500,

            driverLatitude:
              driver.latitude ??
              13.430972,

            driverLongitude:
              driver.longitude ??
              -6.26127,

            driverPhone:
              driver.phone ??
              "70000000",

            passengerId:
              "DEBUG_PASSENGER",

            passengerName:
              "Passager Debug",

            passengerPhone:
              "70000000",

            passengerLocation:
              pickup,

            pickup,

            destination,

            estimatedDistance:
              2.2,

            estimatedDuration:
              3,

            estimatedPrice:
              500,

            vehicleType:
              driver.vehicleType ??
              "moto",

            searchMode:
              "broadcast",

            status:
              "pending",

            createdAt:
              serverTimestamp(),

            acceptedAt:
              null,

            timeoutAt:
              null,

            respondedAt:
              null,

            cancelledAt:
              null,

            debug:
              true,
          }
        );

      console.log(
        "✅ Demande debug créée :",
        requestRef.id
      );

      console.log(
        "⏱️ Le conducteur dispose maintenant de 60 secondes."
      );

      console.log(
        "========================================"
      );

      Alert.alert(
        "Demande de test créée ✅",
        "La demande va apparaître sur le tableau de bord conducteur."
      );

    } catch (error) {

      console.error(
        "❌ Erreur demande debug :",
        error
      );

      Alert.alert(
        "Erreur",
        error?.message ??
        "Impossible de créer la demande debug."
      );

    }

  };

  return (

    <TouchableOpacity
      style={styles.button}
      onPress={createDebugRequest}
      activeOpacity={0.8}
    >

      <Text
        style={styles.text}
      >
        🧪 TESTER UNE DEMANDE CONDUCTEUR
      </Text>

    </TouchableOpacity>

  );

}

const styles =
  StyleSheet.create({

    button: {
      backgroundColor:
        "#FF9800",

      height: 52,

      borderRadius: 12,

      justifyContent:
        "center",

      alignItems:
        "center",

      marginTop: 15,

      paddingHorizontal: 10,
    },

    text: {
      color: "#FFFFFF",

      fontSize: 14,

      fontWeight: "800",

    },

  });