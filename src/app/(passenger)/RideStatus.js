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
    doc,
    onSnapshot,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";

import { db } from "../../../firebase/config";

import {
    debugAcceptRide,
    debugCancelRide,
    debugFinishRide,
    debugResetRide,
    debugSimulateRide,
} from "../../../services/debugService";

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

        setDriver(driverData);
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
        // Elle ne sera PAS remise à [] lorsque
        // ride.status deviendra search_timeout
        // ou search_failed.
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
        rideId: ride.id,

        driverPhone:
          ride.driverPhone ?? "",

        driverName:
          ride.driverName ?? "",
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
      status: ride?.status,

      nearbyDrivers:
        nearbyDrivers.length,

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
      style={styles.container}
    >
      <SafeAreaView
        style={styles.container}
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
             * On envoie TOUJOURS nearbyDrivers.
             *
             * Même lorsque :
             *
             * search_timeout
             * search_failed
             *
             * Les conducteurs restent donc
             * visibles sur la carte.
             */
            drivers={
              nearbyDrivers
            }

            /*
             * La ligne de recherche est
             * uniquement liée à isSearching.
             *
             * Lorsque la recherche se termine :
             *
             * searchingDriver = null
             *
             * Leaflet doit alors supprimer
             * uniquement la ligne.
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

                      await debugAcceptRide(
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


                onIncomingRide={
                  () => {
                    console.log(
                      "📞 Simulation demande"
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
      backgroundColor: "#FFF",
    },

    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },

    bottomBanner: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 30,
      zIndex: 200,
    },

    developerPanel: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 300,
    },

    searchFinishedContainer: {
      position: "absolute",
      left: 20,
      right: 20,
      bottom: 100,
      zIndex: 250,
    },

    searchFinishedCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 18,
      padding: 20,
      elevation: 8,
      shadowOpacity: 0.15,
      shadowRadius: 10,
      shadowOffset: {
        width: 0,
        height: 4,
      },
    },

    searchFinishedTitle: {
      fontSize: 19,
      fontWeight: "700",
      textAlign: "center",
      marginBottom: 8,
    },

    searchFinishedText: {
      fontSize: 15,
      textAlign: "center",
      color: "#666",
      marginBottom: 18,
    },

    searchFinishedButton: {
      backgroundColor: "#0B6E4F",
      borderRadius: 12,
      paddingVertical: 13,
      alignItems: "center",
    },

    searchFinishedButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },

  });