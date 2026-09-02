import { useEffect, useState } from "react";

import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { SafeAreaView } from "react-native-safe-area-context";

import { router } from "expo-router";

import Header from "../../components/Header";
import RideTrackingMap from "../../components/ride/RideTrackingMap";

import { db } from "../../../firebase/config";

import { getUser } from "../../storage/userStorage";

import {
  driverArriving,
  driverArrived,
  startRide,
  completeRide,
} from "../../../services/rideLifecycleService";


export default function CurrentRide() {

  // =====================================================
  // ÉTATS
  // =====================================================

  const [driver, setDriver] = useState(null);

  const [ride, setRide] = useState(null);

  const [loading, setLoading] = useState(true);


  // =====================================================
  // ÉCOUTER LA COURSE DU CONDUCTEUR
  // =====================================================

  useEffect(() => {

    let unsubscribeRide = null;

    async function subscribeToRide() {

      try {

        const currentDriver = await getUser();

        console.log(
          "👤 Conducteur connecté :",
          currentDriver
        );

        if (!currentDriver?.userId) {

          console.log(
            "❌ Aucun conducteur connecté"
          );

          setLoading(false);

          return;
        }

        setDriver(currentDriver);


        // -------------------------------------------------
        // Rechercher les courses de ce conducteur
        // -------------------------------------------------

        const q = query(
          collection(db, "rides"),
          where(
            "driverId",
            "==",
            currentDriver.userId
          )
        );


        unsubscribeRide = onSnapshot(
          q,
          (snapshot) => {

            let activeRide = null;


            snapshot.forEach((docSnapshot) => {

              const data = {
                id: docSnapshot.id,
                ...docSnapshot.data(),
              };


              console.log(
                "🚕 Course trouvée :",
                data.id,
                "→ statut :",
                data.status
              );


              // ------------------------------------------------
              // Statuts considérés comme course active
              // ------------------------------------------------

              const activeStatuses = [
                "accepted",
                "driver_arriving",
                "arrived",
                "started",
              ];


              if (
                activeStatuses.includes(
                  data.status
                )
              ) {

                activeRide = data;

              }

            });


            setRide(activeRide);

            setLoading(false);


            if (activeRide) {

              console.log(
                "✅ Course active :",
                activeRide.id
              );

              console.log(
                "📌 Statut :",
                activeRide.status
              );

            } else {

              console.log(
                "ℹ️ Aucune course active"
              );

            }

          },
          (error) => {

            console.error(
              "❌ Erreur écoute course :",
              error
            );

            setLoading(false);

          }
        );

      } catch (error) {

        console.error(
          "❌ Impossible de charger le conducteur :",
          error
        );

        setLoading(false);

      }

    }


    subscribeToRide();


    return () => {

      if (unsubscribeRide) {

        unsubscribeRide();

      }

    };

  }, []);


  // =====================================================
  // CONDUCTEUR → EN ROUTE
  // =====================================================

  async function handleDriverArriving() {

    if (!ride?.id) return;

    try {

      console.log(
        "🚕 Conducteur en route :",
        ride.id
      );

      await driverArriving(
        ride.id
      );

    } catch (error) {

      console.error(
        "❌ driverArriving :",
        error
      );

      Alert.alert(
        "Erreur",
        "Impossible de mettre à jour le statut."
      );

    }

  }


  // =====================================================
  // CONDUCTEUR → ARRIVÉ
  // =====================================================

  async function handleDriverArrived() {

    if (!ride?.id) return;

    try {

      console.log(
        "📍 Conducteur arrivé :",
        ride.id
      );

      await driverArrived(
        ride.id
      );

    } catch (error) {

      console.error(
        "❌ driverArrived :",
        error
      );

      Alert.alert(
        "Erreur",
        "Impossible de mettre à jour le statut."
      );

    }

  }


  // =====================================================
  // DÉMARRER LA COURSE
  // =====================================================

  async function handleStartRide() {

    if (!ride?.id) return;

    try {

      console.log(
        "▶️ Démarrage de la course :",
        ride.id
      );

      await startRide(
        ride.id
      );

    } catch (error) {

      console.error(
        "❌ startRide :",
        error
      );

      Alert.alert(
        "Erreur",
        "Impossible de démarrer la course."
      );

    }

  }


  // =====================================================
  // TERMINER LA COURSE
  // =====================================================

  async function handleCompleteRide() {

    if (!ride?.id) return;

    try {

      console.log(
        "🏁 Fin de la course :",
        ride.id
      );

      await completeRide(
        ride.id
      );


      Alert.alert(
        "Course terminée",
        "La course a été terminée avec succès."
      );


      // -------------------------------------------------
      // Retour au tableau de bord
      // -------------------------------------------------

      router.replace(
        "/(driver)/dashboard"
      );

    } catch (error) {

      console.error(
        "❌ completeRide :",
        error
      );

      Alert.alert(
        "Erreur",
        "Impossible de terminer la course."
      );

    }

  }


  // =====================================================
  // APPELER LE PASSAGER
  // =====================================================

  async function callPassenger() {

    if (!ride?.passengerPhone) {

      Alert.alert(
        "Information",
        "Le numéro du passager est indisponible."
      );

      return;

    }


    try {

      await Linking.openURL(
        `tel:${ride.passengerPhone}`
      );

    } catch (error) {

      console.error(
        "❌ Appel impossible :",
        error
      );

      Alert.alert(
        "Erreur",
        "Impossible d'effectuer l'appel."
      );

    }

  }


  // =====================================================
  // CHARGEMENT
  // =====================================================

  if (loading) {

    return (

      <SafeAreaView
        style={styles.container}
      >

        <Header
          title="Course en cours"
          profileRoute="/(driver)/profile"
        />

        <View
          style={styles.emptyContainer}
        >

          <Text
            style={styles.emptyText}
          >
            Chargement de la course...
          </Text>

        </View>

      </SafeAreaView>

    );

  }


  // =====================================================
  // AUCUNE COURSE
  // =====================================================

  if (!ride) {

    return (

      <SafeAreaView
        style={styles.container}
      >

        <Header
          title="Course en cours"
          profileRoute="/(driver)/profile"
        />

        <View
          style={styles.emptyContainer}
        >

          <Text
            style={styles.emptyIcon}
          >
            🚕
          </Text>

          <Text
            style={styles.emptyText}
          >
            Aucune course en cours.
          </Text>

          <TouchableOpacity
            style={styles.dashboardButton}
            onPress={() =>
              router.replace(
                "/(driver)/dashboard"
              )
            }
          >

            <Text
              style={styles.buttonText}
            >
              Retour au tableau de bord
            </Text>

          </TouchableOpacity>

        </View>

      </SafeAreaView>

    );

  }


  // =====================================================
  // INTERFACE COURSE
  // =====================================================

  return (

    <SafeAreaView
      style={styles.container}
    >

      <Header
        title="Course en cours"
        profileRoute="/(driver)/profile"
      />


      <ScrollView
        showsVerticalScrollIndicator={false}
      >

        {/* ================================================
            CARTE
        ================================================= */}

        <RideTrackingMap
          ride={ride}
          driver={driver}
          passenger={{
            latitude:
              ride.pickup?.latitude,

            longitude:
              ride.pickup?.longitude,
          }}
        />


        {/* ================================================
            INFORMATIONS COURSE
        ================================================= */}

        <View
          style={styles.card}
        >

          <Text
            style={styles.status}
          >

            {ride.status === "accepted" &&
              "🟢 Course acceptée"}

            {ride.status === "driver_arriving" &&
              "🚕 En route vers le passager"}

            {ride.status === "arrived" &&
              "📍 Vous êtes arrivé"}

            {ride.status === "started" &&
              "▶️ Course en cours"}

          </Text>


          <Text
            style={styles.name}
          >
            {ride.passengerName ||
              "Passager"}
          </Text>


          {ride.passengerPhone && (

            <Text
              style={styles.info}
            >
              📞 {ride.passengerPhone}
            </Text>

          )}


          <Text
            style={styles.info}
          >
            📍 Départ
          </Text>

          <Text
            style={styles.value}
          >
            {ride.pickup?.address ||
              "Position du passager"}
          </Text>


          <Text
            style={styles.info}
          >
            🎯 Destination
          </Text>

          <Text
            style={styles.value}
          >
            {ride.destination?.address ||
              "Destination"}
          </Text>


          <Text
            style={styles.price}
          >
            💰 {ride.estimatedPrice || 0} FCFA
          </Text>


          {/* ============================================
              ACCEPTÉE
          ============================================ */}

          {ride.status === "accepted" && (

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={
                handleDriverArriving
              }
            >

              <Text
                style={styles.buttonText}
              >
                🚕 Je suis en route
              </Text>

            </TouchableOpacity>

          )}


          {/* ============================================
              EN ROUTE
          ============================================ */}

          {ride.status === "driver_arriving" && (

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={
                handleDriverArrived
              }
            >

              <Text
                style={styles.buttonText}
              >
                📍 Je suis arrivé
              </Text>

            </TouchableOpacity>

          )}


          {/* ============================================
              ARRIVÉ
          ============================================ */}

          {ride.status === "arrived" && (

            <TouchableOpacity
              style={styles.startButton}
              onPress={
                handleStartRide
              }
            >

              <Text
                style={styles.buttonText}
              >
                ▶️ Démarrer la course
              </Text>

            </TouchableOpacity>

          )}


          {/* ============================================
              COURSE EN COURS
          ============================================ */}

          {ride.status === "started" && (

            <TouchableOpacity
              style={styles.finishButton}
              onPress={
                handleCompleteRide
              }
            >

              <Text
                style={styles.buttonText}
              >
                🏁 Terminer la course
              </Text>

            </TouchableOpacity>

          )}


          {/* ============================================
              APPELER LE PASSAGER
          ============================================ */}

          <TouchableOpacity
            style={styles.callButton}
            onPress={callPassenger}
          >

            <Text
              style={styles.buttonText}
            >
              📞 Appeler le passager
            </Text>

          </TouchableOpacity>

        </View>

      </ScrollView>

    </SafeAreaView>

  );

}


// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },


  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },


  emptyIcon: {
    fontSize: 50,
    marginBottom: 15,
  },


  emptyText: {
    fontSize: 18,
    color: "#777777",
    textAlign: "center",
    marginBottom: 20,
  },


  dashboardButton: {
    backgroundColor: "#0B6E4F",
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 12,
  },


  card: {
    margin: 15,
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    elevation: 3,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },


  status: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginBottom: 15,
  },


  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginBottom: 10,
  },


  info: {
    marginTop: 10,
    fontWeight: "600",
    color: "#666666",
  },


  value: {
    marginTop: 5,
    fontSize: 16,
    color: "#333333",
  },


  price: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 26,
    fontWeight: "bold",
    color: "#0B6E4F",
  },


  primaryButton: {
    marginTop: 12,
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },


  startButton: {
    marginTop: 12,
    backgroundColor: "#F4B400",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },


  finishButton: {
    marginTop: 12,
    backgroundColor: "#0B6E4F",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },


  callButton: {
    marginTop: 12,
    backgroundColor: "#34A853",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },


  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },

});