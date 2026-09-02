import {
  useEffect,
  useState,
} from "react";

import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { router } from "expo-router";

import {
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../../firebase/config";

import AppHeader from "../../components/AppHeader";

import { getUser } from "../../storage/userStorage";


// ======================================================
// ÉCRAN DES DEMANDES DE COURSES
// ======================================================

export default function Requests() {

  const [requests, setRequests] =
    useState([]);

  const [loading, setLoading] =
    useState(true);


  // ======================================================
  // CHARGEMENT INITIAL
  // ======================================================

  useEffect(() => {

    loadRequests();

  }, []);


  // ======================================================
  // CHARGER LES DEMANDES DU CONDUCTEUR
  // ======================================================

  const loadRequests = async () => {

    try {

      setLoading(true);


      // --------------------------------------------------
      // CONDUCTEUR CONNECTÉ
      // --------------------------------------------------

      const driver =
        await getUser();


      console.log(
        "======================================"
      );

      console.log(
        "👤 CONDUCTEUR CONNECTÉ"
      );

      console.log(
        "USER COMPLET =",
        driver
      );

      console.log(
        "======================================"
      );


      if (!driver) {

        setRequests([]);

        return;

      }


      console.log(
        "Conducteur connecté :",
        driver.name
      );

      console.log(
        "ID conducteur :",
        driver.userId
      );

      console.log(
        "Type véhicule :",
        driver.vehicleType
      );


      // --------------------------------------------------
      // RÉCUPÉRER LES DEMANDES
      // --------------------------------------------------

      const querySnapshot =
        await getDocs(
          collection(
            db,
            "ride_requests"
          )
        );


      const loadedRequests = [];


      // --------------------------------------------------
      // FILTRER LES DEMANDES
      // --------------------------------------------------

      querySnapshot.forEach(
        (docItem) => {

          const data =
            docItem.data();


          if (
            data.driverId ===
              driver.userId &&

            data.status ===
              "pending"
          ) {

            loadedRequests.push({

              id:
                docItem.id,

              ...data,

            });

          }

        }
      );


      // --------------------------------------------------
      // ENREGISTRER
      // --------------------------------------------------

      setRequests(
        loadedRequests
      );


      console.log(
        "======================================"
      );

      console.log(
        "📋 DEMANDES DU CONDUCTEUR"
      );

      console.log(
        "Nombre :",
        loadedRequests.length
      );

      console.log(
        "REQUESTS =",
        loadedRequests
      );

      console.log(
        "======================================"
      );


    } catch (error) {

      console.error(
        "❌ Erreur chargement demandes :",
        error
      );

      Alert.alert(
        "Erreur",
        "Impossible de charger les demandes."
      );

    } finally {

      setLoading(false);

    }

  };


  // ======================================================
  // ACCEPTER UNE COURSE
  // ======================================================

  const acceptRide = async (
    rideRequest
  ) => {

    try {

      // --------------------------------------------------
      // CONDUCTEUR CONNECTÉ
      // --------------------------------------------------

      const driver =
        await getUser();


      if (!driver?.userId) {

        Alert.alert(
          "Erreur",
          "Conducteur introuvable."
        );

        return;

      }


      console.log(
        "======================================"
      );

      console.log(
        "🚕 TENTATIVE ACCEPTATION"
      );

      console.log(
        "Conducteur :",
        driver.name
      );

      console.log(
        "Driver ID :",
        driver.userId
      );

      console.log(
        "Request ID :",
        rideRequest.id
      );

      console.log(
        "Ride ID :",
        rideRequest.rideId
      );

      console.log(
        "======================================"
      );


      // ==================================================
      // TRANSACTION FIRESTORE
      // ==================================================

      await runTransaction(
        db,
        async (transaction) => {

          // ----------------------------------------------
          // RÉFÉRENCES
          // ----------------------------------------------

          const rideRef =
            doc(
              db,
              "rides",
              rideRequest.rideId
            );


          const requestRef =
            doc(
              db,
              "ride_requests",
              rideRequest.id
            );


          const driverRef =
            doc(
              db,
              "users",
              driver.userId
            );


          // ----------------------------------------------
          // LECTURE
          // ----------------------------------------------

          const rideSnapshot =
            await transaction.get(
              rideRef
            );


          const requestSnapshot =
            await transaction.get(
              requestRef
            );


          // ----------------------------------------------
          // VÉRIFIER LA COURSE
          // ----------------------------------------------

          if (
            !rideSnapshot.exists()
          ) {

            throw new Error(
              "RIDE_NOT_FOUND"
            );

          }


          // ----------------------------------------------
          // VÉRIFIER LA DEMANDE
          // ----------------------------------------------

          if (
            !requestSnapshot.exists()
          ) {

            throw new Error(
              "REQUEST_NOT_FOUND"
            );

          }


          const currentRide =
            rideSnapshot.data();


          const currentRequest =
            requestSnapshot.data();


          // ==================================================
          // LA DEMANDE DOIT TOUJOURS ÊTRE PENDING
          // ==================================================

          if (
            currentRequest.status !==
              "pending"
          ) {

            throw new Error(
              "REQUEST_ALREADY_PROCESSED"
            );

          }


          // ==================================================
          // LA COURSE DOIT TOUJOURS ÊTRE EN RECHERCHE
          // ==================================================

          if (
            currentRide.status !==
              "searching"
          ) {

            throw new Error(
              "RIDE_ALREADY_ACCEPTED"
            );

          }


          // ==================================================
          // ACCEPTER LA DEMANDE
          // ==================================================

          transaction.update(
            requestRef,
            {

              status:
                "accepted",

              acceptedAt:
                serverTimestamp(),

              respondedAt:
                serverTimestamp(),

            }
          );


          // ==================================================
          // ATTRIBUER LA COURSE AU CONDUCTEUR
          // ==================================================

          transaction.update(
            rideRef,
            {

              status:
                "accepted",

              driverId:
                driver.userId,

              driverName:
                driver.name,

              driverPhone:
                driver.phone ?? null,

              driverVehicleType:
                driver.vehicleType ?? null,

              driverDistance:
                rideRequest.driverDistance ??
                null,

              acceptedAt:
                serverTimestamp(),

            }
          );


          // ==================================================
          // CONDUCTEUR → OCCUPÉ
          // ==================================================

          transaction.update(
            driverRef,
            {

              availability:
                "busy",

              currentRideId:
                rideRequest.rideId,

              isOnline:
                true,

            }
          );

        }
      );


      // ==================================================
      // ACCEPTATION RÉUSSIE
      // ==================================================

      console.log(
        "======================================"
      );

      console.log(
        "✅ COURSE ACCEPTÉE"
      );

      console.log(
        "Conducteur :",
        driver.name
      );

      console.log(
        "Ride ID :",
        rideRequest.rideId
      );

      console.log(
        "======================================"
      );


      // ==================================================
      // ANNULER LES AUTRES DEMANDES
      // ==================================================

      const querySnapshot =
        await getDocs(
          collection(
            db,
            "ride_requests"
          )
        );


      const cancelPromises = [];


      querySnapshot.forEach(
        (docItem) => {

          const request =
            docItem.data();


          // ------------------------------------------------
          // AUTRES DEMANDES DE LA MÊME COURSE
          // ------------------------------------------------

          if (

            request.rideId ===
              rideRequest.rideId &&

            docItem.id !==
              rideRequest.id &&

            request.status ===
              "pending"

          ) {

            cancelPromises.push(

              updateDoc(
                doc(
                  db,
                  "ride_requests",
                  docItem.id
                ),
                {

                  status:
                    "cancelled",

                  cancelledAt:
                    serverTimestamp(),

                }
              )

            );

          }

        }
      );


      await Promise.all(
        cancelPromises
      );


      console.log(
        "🧹 Autres demandes annulées :",
        cancelPromises.length
      );


      // ==================================================
      // RETIRER LES DEMANDES DE L'ÉCRAN
      // ==================================================

      setRequests(
        (previousRequests) =>
          previousRequests.filter(
            (request) =>
              request.rideId !==
              rideRequest.rideId
          )
      );


      // ==================================================
      // MESSAGE
      // ==================================================

      Alert.alert(
        "Course acceptée",
        `Vous avez accepté la course de ${
          rideRequest.passengerName ||
          "ce passager"
        }.`
      );


      // ==================================================
      // ALLER À RIDE STATUS
      // ==================================================

      router.push({

        pathname:
          "/(driver)/RideStatus",

        params: {

          rideId:
            rideRequest.rideId,

        },

      });


    } catch (error) {

      console.error(
        "❌ Erreur acceptation :",
        error
      );


      // ==================================================
      // COURSE DÉJÀ PRISE
      // ==================================================

      if (
        error.message ===
        "RIDE_ALREADY_ACCEPTED"
      ) {

        Alert.alert(
          "Course déjà prise",
          "Un autre conducteur a accepté cette course."
        );

      }


      // ==================================================
      // DEMANDE DÉJÀ TRAITÉE
      // ==================================================

      else if (
        error.message ===
        "REQUEST_ALREADY_PROCESSED"
      ) {

        Alert.alert(
          "Demande indisponible",
          "Cette demande a déjà été traitée."
        );

      }


      // ==================================================
      // COURSE INTROUVABLE
      // ==================================================

      else if (
        error.message ===
        "RIDE_NOT_FOUND"
      ) {

        Alert.alert(
          "Course introuvable",
          "Cette course n'existe plus."
        );

      }


      // ==================================================
      // DEMANDE INTROUVABLE
      // ==================================================

      else if (
        error.message ===
        "REQUEST_NOT_FOUND"
      ) {

        Alert.alert(
          "Demande introuvable",
          "Cette demande n'existe plus."
        );

      }


      // ==================================================
      // AUTRE ERREUR
      // ==================================================

      else {

        Alert.alert(
          "Erreur",
          "Impossible d'accepter la course."
        );

      }


      // --------------------------------------------------
      // ACTUALISER LES DEMANDES
      // --------------------------------------------------

      await loadRequests();

    }

  };


  // ======================================================
  // REFUSER UNE COURSE
  // ======================================================

  const rejectRide = async (
    rideRequest
  ) => {

    try {

      console.log(
        "❌ REFUS COURSE :",
        rideRequest.id
      );


      await updateDoc(
        doc(
          db,
          "ride_requests",
          rideRequest.id
        ),
        {

          status:
            "rejected",

          rejectedAt:
            serverTimestamp(),

          respondedAt:
            serverTimestamp(),

        }
      );


      // --------------------------------------------------
      // RETIRER DE L'ÉCRAN
      // --------------------------------------------------

      setRequests(
        (previousRequests) =>
          previousRequests.filter(
            (request) =>
              request.id !==
              rideRequest.id
          )
      );


      Alert.alert(
        "Course refusée",
        "La demande a été refusée."
      );


    } catch (error) {

      console.error(
        "❌ Erreur refus course :",
        error
      );


      Alert.alert(
        "Erreur",
        "Impossible de refuser la course."
      );

    }

  };


  // ======================================================
  // CHARGEMENT
  // ======================================================

  if (loading) {

    return (

      <SafeAreaView
        style={styles.container}
      >

        <AppHeader
          title="Demandes de courses"
          profileRoute="/(driver)/profile"
        />

        <View
          style={styles.center}
        >

          <Text
            style={styles.emptyText}
          >
            Chargement...
          </Text>

        </View>

      </SafeAreaView>

    );

  }


  // ======================================================
  // AUCUNE DEMANDE
  // ======================================================

  if (
    requests.length === 0
  ) {

    return (

      <SafeAreaView
        style={styles.container}
      >

        <AppHeader
          title="Demandes de courses"
          profileRoute="/(driver)/profile"
        />

        <View
          style={styles.center}
        >

          <Text
            style={styles.emptyText}
          >
            Aucune demande disponible
          </Text>

        </View>

      </SafeAreaView>

    );

  }


  // ======================================================
  // AFFICHAGE
  // ======================================================

  return (

    <SafeAreaView
      style={styles.container}
    >

      <AppHeader
        title="Demandes de courses"
        profileRoute="/(driver)/profile"
      />


      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
      >

        {requests.map(
          (ride) => (

            <View
              key={ride.id}
              style={styles.card}
            >

              {/* -------------------------------------- */}
              {/* PASSAGER */}
              {/* -------------------------------------- */}

              <Text
                style={
                  styles.passenger
                }
              >

                👤{" "}

                {ride.passengerName ||
                  ride.passengerPhone ||
                  "Passager"}

              </Text>


              {/* -------------------------------------- */}
              {/* DÉPART */}
              {/* -------------------------------------- */}

              <Text
                style={styles.info}
              >

                📍 Départ :{" "}

                {ride.pickup?.address ||
                  "Position actuelle"}

              </Text>


              {/* -------------------------------------- */}
              {/* DESTINATION */}
              {/* -------------------------------------- */}

              <Text
                style={styles.info}
              >

                🎯 Destination :{" "}

                {ride.destination?.address ||
                  "Destination"}

              </Text>


              {/* -------------------------------------- */}
              {/* TYPE VÉHICULE */}
              {/* -------------------------------------- */}

              <Text
                style={styles.info}
              >

                {ride.vehicleType ===
                "moto"

                  ? "🏍️ Moto"

                  : "🚗 Voiture"}

              </Text>


              {/* -------------------------------------- */}
              {/* DISTANCE */}
              {/* -------------------------------------- */}

              {ride.estimatedDistance !=
                null && (

                <Text
                  style={styles.info}
                >

                  📏 Distance :{" "}

                  {ride.estimatedDistance}
                  {" m"}

                </Text>

              )}


              {/* -------------------------------------- */}
              {/* DURÉE */}
              {/* -------------------------------------- */}

              {ride.estimatedDuration !=
                null && (

                <Text
                  style={styles.info}
                >

                  ⏱️ Durée :{" "}

                  {ride.estimatedDuration}
                  {" min"}

                </Text>

              )}


              {/* -------------------------------------- */}
              {/* PRIX */}
              {/* -------------------------------------- */}

              <Text
                style={styles.price}
              >

                💰{" "}

                {ride.estimatedPrice ??
                  0}

                {" FCFA"}

              </Text>


              {/* -------------------------------------- */}
              {/* BOUTONS */}
              {/* -------------------------------------- */}

              <View
                style={styles.buttons}
              >

                {/* ACCEPTER */}

                <TouchableOpacity
                  style={
                    styles.acceptButton
                  }
                  onPress={() =>
                    acceptRide(
                      ride
                    )
                  }
                >

                  <Text
                    style={
                      styles.buttonText
                    }
                  >
                    Accepter
                  </Text>

                </TouchableOpacity>


                {/* REFUSER */}

                <TouchableOpacity
                  style={
                    styles.rejectButton
                  }
                  onPress={() =>
                    rejectRide(
                      ride
                    )
                  }
                >

                  <Text
                    style={
                      styles.buttonText
                    }
                  >
                    Refuser
                  </Text>

                </TouchableOpacity>

              </View>

            </View>

          )
        )}

      </ScrollView>

    </SafeAreaView>

  );

}


// ======================================================
// STYLES
// ======================================================

const styles =
  StyleSheet.create({

    container: {

      flex: 1,

      backgroundColor:
        "#FFFFFF",

      padding:
        20,

    },


    center: {

      flex: 1,

      justifyContent:
        "center",

      alignItems:
        "center",

    },


    emptyText: {

      textAlign:
        "center",

      marginTop:
        30,

      fontSize:
        16,

      color:
        "#666",

    },


    card: {

      backgroundColor:
        "#F8F8F8",

      borderRadius:
        15,

      padding:
        15,

      marginBottom:
        15,

    },


    passenger: {

      fontSize:
        18,

      fontWeight:
        "bold",

      marginBottom:
        10,

    },


    info: {

      color:
        "#555",

      marginBottom:
        5,

    },


    price: {

      marginTop:
        10,

      fontSize:
        18,

      fontWeight:
        "bold",

      color:
        "#0B6E4F",

    },


    buttons: {

      flexDirection:
        "row",

      marginTop:
        15,

      justifyContent:
        "space-between",

    },


    acceptButton: {

      flex: 1,

      backgroundColor:
        "#0B6E4F",

      padding:
        12,

      borderRadius:
        10,

      marginRight:
        5,

      alignItems:
        "center",

    },


    rejectButton: {

      flex: 1,

      backgroundColor:
        "#E53935",

      padding:
        12,

      borderRadius:
        10,

      marginLeft:
        5,

      alignItems:
        "center",

    },


    buttonText: {

      color:
        "#FFFFFF",

      fontWeight:
        "bold",

    },

  });