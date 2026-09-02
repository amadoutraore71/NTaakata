import {
    router,
    useLocalSearchParams,
} from "expo-router";

import {
    useEffect,
    useState,
} from "react";

import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import {
    GestureHandlerRootView,
} from "react-native-gesture-handler";

import {
    SafeAreaView,
} from "react-native-safe-area-context";

import {
    collection,
    doc,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from "firebase/firestore";

import { db } from "../../../firebase/config";

import {
    debugCancelRide,
    debugFinishRide,
    debugResetRide,
    debugSimulateRide,
} from "../../../services/debugService";

import {
    acceptRideRequest,
    rejectRideRequest,
} from "../../../services/matching/rideRequestService";

import {
    findAvailableDrivers,
} from "../../../services/matching/driverSelectionService";

import {
    cancelRide,
} from "../../../services/rideLifecycleService";

import {
    startDriverMovement,
} from "../../../src/services/simulation/driverMovementService";

import DeveloperPanel from "../../components/debug/DeveloperPanel";
import RideStatusBanner from "../../components/ride/RideStatusBanner";
import RideTrackingMap from "../../components/ride/RideTrackingMap";


export default function RideStatus() {

  const { rideId } =
    useLocalSearchParams();


  const [ride, setRide] =
    useState(null);


  const [driver, setDriver] =
    useState(null);


  const [
    passengerLocation,
    setPassengerLocation,
  ] = useState(null);


  const [
    routeInfo,
    setRouteInfo,
  ] = useState({
    distance: null,
    duration: null,
    eta: null,
  });


  // IMPORTANT :
  // Cette liste ne doit jamais être vidée
  // simplement parce que la recherche est terminée.
  const [
    nearbyDrivers,
    setNearbyDrivers,
  ] = useState([]);


  // =====================================================
  // DEMANDES DE COURSE BROADCAST
  // =====================================================

  const [
    rideRequests,
    setRideRequests,
  ] = useState([]);


  // =====================================================
  // STATUTS QUI UTILISENT LA CARTE DE SUIVI
  // =====================================================

  const trackingStatuses = [
    "driver_arriving",
    "arrived",
    "started",
    "completed",
  ];


  // =====================================================
  // ÉCOUTER LA COURSE
  // =====================================================

  useEffect(() => {

    if (!rideId) {
      return;
    }


    const unsubscribe = onSnapshot(
      doc(db, "rides", rideId),
      (snapshot) => {

        if (!snapshot.exists()) {

          console.log(
            "❌ Course introuvable :",
            rideId
          );

          return;
        }


        const rideData = {
          id: snapshot.id,
          ...snapshot.data(),
        };


        console.log(
          "🚕 Ride :",
          rideData
        );


        setRide(rideData);


        if (rideData.pickup) {

          setPassengerLocation({
            latitude:
              rideData.pickup.latitude,

            longitude:
              rideData.pickup.longitude,
          });

        }

      }
    );


    return unsubscribe;

  }, [rideId]);


  // =====================================================
  // ÉCOUTER LES DEMANDES BROADCAST
  // =====================================================

  useEffect(() => {

    if (!rideId) {

      setRideRequests([]);

      return;
    }


    const requestsQuery = query(
      collection(
        db,
        "ride_requests"
      ),

      where(
        "rideId",
        "==",
        rideId
      )
    );


    const unsubscribe = onSnapshot(
      requestsQuery,

      (snapshot) => {

        const requests =
          snapshot.docs
            .map((item) => ({
              id: item.id,
              ...item.data(),
            }))

            .sort(
              (a, b) =>
                Number(
                  a.driverDistance ??
                  Infinity
                ) -
                Number(
                  b.driverDistance ??
                  Infinity
                )
            );


        console.log(
          "🧪 RideStatus - demandes broadcast :",
          requests
        );


        setRideRequests(
          requests
        );

      },

      (error) => {

        console.log(
          "❌ Erreur écoute ride_requests :",
          error
        );

      }
    );


    return unsubscribe;

  }, [rideId]);


  // =====================================================
  // ÉCOUTER LE CONDUCTEUR ACCEPTÉ
  // =====================================================

  useEffect(() => {

    if (!ride?.driverId) {

      setDriver(null);

      return;
    }


    console.log(
      "🔎 Recherche conducteur accepté :",
      ride.driverId
    );


    const unsubscribe = onSnapshot(

      doc(
        db,
        "users",
        ride.driverId
      ),

      (snapshot) => {

        if (!snapshot.exists()) {

          console.log(
            "❌ Conducteur introuvable :",
            ride.driverId
          );

          setDriver(null);

          return;
        }


        const data =
          snapshot.data();


        const driverData = {
          docId: snapshot.id,
          ...data,
        };


        console.log(
          "✅ Conducteur accepté :",
          driverData.name
        );


        setDriver(
          driverData
        );

      }
    );


    return unsubscribe;

  }, [ride?.driverId]);


  // =====================================================
  // CHARGER LES CONDUCTEURS DISPONIBLES
  // =====================================================

  useEffect(() => {

    async function loadDrivers() {

      if (
        !passengerLocation ||
        !ride ||
        ride.status !== "searching"
      ) {
        return;
      }


      try {

        const drivers =
          await findAvailableDrivers(
            passengerLocation,
            ride.vehicleType
          );


        console.log(
          "🚕 Conducteurs disponibles :",
          drivers.length
        );


        console.log(
          "🚕 Liste conducteurs :",
          drivers
        );


        // IMPORTANT :
        // On conserve la liste.
        // Elle ne sera PAS remise à []
        // lorsque la recherche se termine.

        setNearbyDrivers(
          drivers
        );


      } catch (error) {

        console.log(
          "❌ Erreur chargement conducteurs :",
          error
        );

      }

    }


    loadDrivers();

  }, [
    passengerLocation,
    ride?.status,
    ride?.vehicleType,
  ]);


  // =====================================================
  // COURSE TERMINÉE
  // =====================================================

  useEffect(() => {

    if (
      ride?.status !==
      "completed"
    ) {
      return;
    }


    router.replace({

      pathname:
        "/(passenger)/rate-driver",

      params: {

        rideId:
          ride.id,

        driverPhone:
          ride.driverPhone ??
          "",

        driverName:
          ride.driverName ??
          "",

      },

    });

  }, [ride?.status]);


  // =====================================================
  // ANNULER LA COURSE
  // =====================================================

  const handleCancelRide =
    async () => {

      if (!ride?.id) {
        return;
      }


      try {

        await cancelRide(
          ride.id
        );


        router.replace(
          "/(passenger)"
        );


      } catch (error) {

        console.log(
          "❌ Erreur annulation :",
          error
        );

      }

    };


  // =====================================================
  // DEBUG : ACCEPTER UNE DEMANDE
  // =====================================================

  const handleDebugAcceptRequest =
    async (requestId) => {

      try {

        const result =
          await acceptRideRequest(
            requestId
          );


        console.log(
          "🧪 Résultat acceptation :",
          result
        );


      } catch (error) {

        console.log(
          "❌ Erreur test acceptation :",
          error
        );

      }

    };


  // =====================================================
  // DEBUG : REFUSER UNE DEMANDE
  // =====================================================

  const handleDebugRejectRequest =
    async (requestId) => {

      try {

        await rejectRideRequest(
          requestId
        );


        console.log(
          "🧪 Demande refusée :",
          requestId
        );


      } catch (error) {

        console.log(
          "❌ Erreur test refus :",
          error
        );

      }

    };


  // =====================================================
  // RECHERCHE EN COURS
  // =====================================================

  const isSearching =
    ride?.status ===
    "searching";


  // =====================================================
  // CONDUCTEUR ACTUELLEMENT CONTACTÉ
  // =====================================================

  const searchingDriver =
    isSearching &&
    !ride?.driverId &&
    ride?.currentSearchingDriverId
      ? {

          id:
            ride.currentSearchingDriverId,

          name:
            ride.currentSearchingDriverName,

          latitude:
            ride
              .currentSearchingDriverLocation
              ?.latitude,

          longitude:
            ride
              .currentSearchingDriverLocation
              ?.longitude,

          distance:
            ride.currentSearchingDriverDistance,

          vehicleType:
            ride.currentSearchingDriverVehicleType,

        }

      : null;


  // =====================================================
  // CONDUCTEUR ACCEPTÉ
  // =====================================================

  const displayedDriver =
    ride?.driverId
      ? driver
      : null;


  // =====================================================
  // FIN DE RECHERCHE
  // =====================================================

  const searchFinished =
    ride?.status ===
      "search_timeout" ||

    ride?.status ===
      "search_failed";


  // =====================================================
  // DEBUG
  // =====================================================

  console.log(
    "🔎 RideStatus :",
    {

      status:
        ride?.status,

      nearbyDrivers:
        nearbyDrivers.length,

      rideRequests:
        rideRequests.length,

      searchingDriver:
        searchingDriver?.name,

      acceptedDriver:
        displayedDriver?.name,

    }
  );


  // =====================================================
  // CHARGEMENT
  // =====================================================

  if (!ride) {

    return (

      <SafeAreaView
        style={
          styles.container
        }
      >

        <View
          style={
            styles.loadingContainer
          }
        >

          <Text>
            Chargement de la course...
          </Text>

        </View>

      </SafeAreaView>

    );

  }


  // =====================================================
  // AFFICHAGE
  // =====================================================

  return (

    <GestureHandlerRootView
      style={
        styles.container
      }
    >

      <SafeAreaView
        style={
          styles.container
        }
      >

        {/* ================= CARTE ================= */}

        {passengerLocation && (

          <RideTrackingMap

            mode={
              trackingStatuses.includes(
                ride.status
              )
                ? "tracking"
                : "drivers"
            }


            passengerLocation={
              passengerLocation
            }


            driverLocation={

              displayedDriver

                ? {

                    docId:
                      displayedDriver.docId,

                    userId:
                      displayedDriver.userId,

                    name:
                      displayedDriver.name,

                    latitude:
                      displayedDriver.latitude,

                    longitude:
                      displayedDriver.longitude,

                    vehicleType:
                      displayedDriver.vehicleType,

                  }

                : null

            }


            /*
             * IMPORTANT :
             *
             * On envoie TOUJOURS
             * nearbyDrivers.
             *
             * Même lorsque :
             *
             * search_timeout
             * search_failed
             *
             * Les conducteurs restent
             * donc visibles sur la carte.
             */

            drivers={
              nearbyDrivers
            }


            /*
             * La ligne de recherche
             * est uniquement liée
             * à isSearching.
             */

            searchingDriver={

              isSearching
                ? searchingDriver
                : null

            }


            onDriverSelected={
              () => {}
            }


            onRouteInfo={
              (route) => {

                setRouteInfo({

                  distance:
                    route.distance,

                  duration:
                    route.duration,

                  eta:
                    route.eta
                      ? new Date(
                          route.eta
                        )
                      : null,

                });

              }

            }

          />

        )}


        {/* ================= BANNIÈRE ================= */}

        <View
          style={
            styles.bottomBanner
          }
        >

          <RideStatusBanner

            status={
              ride.status
            }


            driverName={

              ride.driverId

                ? driver?.name

                : isSearching

                  ? searchingDriver?.name

                  : null

            }


            onCancel={
              handleCancelRide
            }

          />

        </View>
                


        {/* ============ RECHERCHE TERMINÉE ============ */}

        {searchFinished && (

          <View
            style={
              styles.searchFinishedContainer
            }
          >

            <View
              style={
                styles.searchFinishedCard
              }
            >

              <Text
                style={
                  styles.searchFinishedTitle
                }
              >
                Aucun conducteur trouvé
              </Text>


              <Text
                style={
                  styles.searchFinishedText
                }
              >
                Aucun conducteur n'a accepté votre course.
              </Text>


              <TouchableOpacity
                style={
                  styles.searchFinishedButton
                }

                onPress={() =>
                  router.replace(
                    "/(passenger)"
                  )
                }
              >

                <Text
                  style={
                    styles.searchFinishedButtonText
                  }
                >
                  Retour à l'accueil
                </Text>

              </TouchableOpacity>

            </View>

          </View>

        )}


        {/* ============ PANNEAU DE DÉVELOPPEMENT ============ */}

        {__DEV__ &&
          ride?.id && (

            <View
              style={
                styles.developerPanel
              }
            >

              <DeveloperPanel

                /*
                 * Toutes les demandes broadcast
                 * créées dans ride_requests.
                 *
                 * Elles sont classées par distance.
                 */

                rideRequests={
                  rideRequests
                }


                /*
                 * Lorsqu'on appuie sur
                 * "Accepter" pour une demande.
                 */

                onAcceptRequest={
                  handleDebugAcceptRequest
                }


                /*
                 * Lorsqu'on appuie sur
                 * "Refuser" pour une demande.
                 */

                onRejectRequest={
                  handleDebugRejectRequest
                }


                /*
                 * Ancien bouton :
                 * Simuler une course
                 */

                onSimulateRide={
                  async () => {

                    try {

                      if (
                        ride.status ===
                        "search_failed"
                      ) {

                        console.log(
                          "❌ La recherche a déjà échoué."
                        );

                        return;

                      }


                      if (
                        !nearbyDrivers.length
                      ) {

                        console.log(
                          "❌ Aucun conducteur disponible."
                        );

                        return;

                      }


                      await debugSimulateRide(

                        ride.id,

                        nearbyDrivers[0]

                      );


                    } catch (error) {

                      console.log(
                        error
                      );

                    }

                  }
                }


                /*
                 * Ancien bouton :
                 * Accepter la course
                 *
                 * On conserve ce bouton
                 * pour les anciens tests.
                 */

                onAcceptRide={
                  async () => {

                    try {

                      const selectedDriver =
                        nearbyDrivers.find(

                          (d) =>
                            d.id ===
                            ride.currentSearchingDriverId

                        ) || null;


                      if (
                        !selectedDriver
                      ) {

                        console.log(
                          "❌ Aucun conducteur."
                        );

                        return;

                      }


                      /*
                       * Ancienne simulation
                       * d'acceptation.
                       */

                      await debugSimulateRide(

                        ride.id,

                        selectedDriver

                      );


                      await updateDoc(

                        doc(
                          db,
                          "rides",
                          ride.id
                        ),

                        {

                          status:
                            "driver_arriving",

                          driverArrivingAt:
                            serverTimestamp(),

                        }

                      );


                      console.log(
                        "🚕 Conducteur sélectionné :",
                        selectedDriver
                      );


                      /*
                       * Simulation du déplacement
                       * du conducteur.
                       */

                      await startDriverMovement({

                        driverId:
                          selectedDriver.id,


                        startLocation: {

                          latitude:
                            selectedDriver.latitude,

                          longitude:
                            selectedDriver.longitude,

                        },


                        endLocation: {

                          latitude:
                            ride.pickup.latitude,

                          longitude:
                            ride.pickup.longitude,

                        },


                        onFinished:
                          async () => {

                            await updateDoc(

                              doc(
                                db,
                                "rides",
                                ride.id
                              ),

                              {

                                status:
                                  "started",

                                startedAt:
                                  serverTimestamp(),

                              }

                            );


                            console.log(
                              "🚗 Conducteur arrivé."
                            );

                          },

                      });


                    } catch (error) {

                      console.log(
                        error
                      );

                    }

                  }
                }


                /*
                 * Bouton :
                 * Terminer la course
                 */

                onFinishRide={
                  async () => {

                    try {

                      await debugFinishRide(
                        ride.id
                      );


                      console.log(
                        "🏁 Course terminée"
                      );


                    } catch (error) {

                      console.log(
                        error
                      );

                    }

                  }
                }


                /*
                 * Bouton :
                 * Annuler la course
                 */

                onCancelRide={
                  async () => {

                    try {

                      await debugCancelRide(
                        ride.id
                      );


                      console.log(
                        "❌ Course annulée"
                      );


                    } catch (error) {

                      console.log(
                        error
                      );

                    }

                  }
                }


                /*
                 * Bouton :
                 * Réinitialiser
                 */

                onResetRide={
                  async () => {

                    try {

                      await debugResetRide(
                        ride.id
                      );


                      console.log(
                        "🔄 Course réinitialisée"
                      );


                    } catch (error) {

                      console.log(
                        error
                      );

                    }

                  }
                }


                /*
                 * Simulation d'une demande.
                 */

                onIncomingRide={
                  () => {

                    console.log(
                      "📞 Simulation demande"
                    );

                  }
                }


                /*
                 * Ces deux callbacks sont conservés
                 * pour garder DeveloperPanel
                 * compatible avec sa nouvelle version.
                 */

                onMoveDriver={
                  () => {

                    console.log(
                      "📍 Déplacement conducteur"
                    );

                  }
                }


                onStartRide={
                  () => {

                    console.log(
                      "🚗 Démarrage course"
                    );

                  }
                }

              />

            </View>

          )}

      </SafeAreaView>

    </GestureHandlerRootView>

  );

}


// =====================================================
// STYLES
// =====================================================

const styles =
  StyleSheet.create({

    container: {

      flex: 1,

      backgroundColor:
        "#FFF",

    },


    loadingContainer: {

      flex: 1,

      justifyContent:
        "center",

      alignItems:
        "center",

    },


    bottomBanner: {

      position:
        "absolute",

      left: 16,

      right: 16,

      bottom: 30,

      zIndex: 200,

    },


    developerPanel: {

      position:
        "absolute",

      left: 0,

      right: 0,

      bottom: 0,

      zIndex: 300,

    },


    searchFinishedContainer: {

      position:
        "absolute",

      left: 20,

      right: 20,

      bottom: 100,

      zIndex: 250,

    },


    searchFinishedCard: {

      backgroundColor:
        "#FFFFFF",

      borderRadius:
        18,

      padding:
        20,

      elevation:
        8,

      shadowOpacity:
        0.15,

      shadowRadius:
        10,

      shadowOffset: {

        width: 0,

        height: 4,

      },

    },


    searchFinishedTitle: {

      fontSize:
        19,

      fontWeight:
        "700",

      textAlign:
        "center",

      marginBottom:
        8,

    },


    searchFinishedText: {

      fontSize:
        15,

      textAlign:
        "center",

      color:
        "#666",

      marginBottom:
        18,

    },


    searchFinishedButton: {

      backgroundColor:
        "#0B6E4F",

      borderRadius:
        12,

      paddingVertical:
        13,

      alignItems:
        "center",

    },


    searchFinishedButtonText: {

      color:
        "#FFFFFF",

      fontSize:
        15,

      fontWeight:
        "700",

    },

  });