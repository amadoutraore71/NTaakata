import {

    router,

    useLocalSearchParams,

} from "expo-router";

import {

    useEffect,
    useState,
    useRef,
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

    debugAcceptRide,

    debugCancelRide,

    debugFinishRide,

    debugResetRide,

    debugSimulateRide,

} from "../../../services/debugService";

import {

    cancelRide,

} from "../../../services/rideLifecycleService";

import {

    acceptRideRequest,

    rejectRideRequest,

} from "../../../services/matching/rideRequestService";

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

  const [

    rideRequests,

    setRideRequests,

  ] = useState([]);

  // =====================================================

  // STATUTS QUI UTILISENT LA CARTE DE SUIVI

  // =====================================================

  const trackingStatuses = [

    "driver_assigned",

    "driver_arriving",

    "driver_arrived",

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

        setRide(rideData);

        if (rideData.pickup) {
          const nextLocation = {
            latitude: Number(rideData.pickup.latitude),
            longitude: Number(rideData.pickup.longitude),
          };

          setPassengerLocation((current) => {
            if (
              current &&
              current.latitude === nextLocation.latitude &&
              current.longitude === nextLocation.longitude
            ) {
              return current;
            }
            return nextLocation;
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

        setDriver(driverData);

      }

    );

    return unsubscribe;

  }, [ride?.driverId]);

  // =====================================================

  // CHARGER LES CONDUCTEURS DEPUIS LES DEMANDES DÉJÀ CRÉÉES
  // Ne pas rappeler findAvailableDrivers ici : la recherche et le broadcast
  // sont déjà effectués au moment de la création de la course.
  useEffect(() => {
    const driversFromRequests = (Array.isArray(rideRequests) ? rideRequests : [])
      .map((request) => {
        const latitude = Number(request.driverLatitude);
        const longitude = Number(request.driverLongitude);
        const driverId = request.driverId;

        if (
          !driverId ||
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {
          return null;
        }

        return {
          id: driverId,
          userId: driverId,
          docId: driverId,
          name: request.driverName || "Conducteur",
          phone: request.driverPhone || null,
          latitude,
          longitude,
          vehicleType: request.driverVehicleType || null,
          distance: request.driverDistance ?? null,
        };
      })
      .filter(Boolean);

    setNearbyDrivers((previous) => {
      // Si aucune demande n'est encore arrivée depuis Firestore, conserver
      // les derniers conducteurs affichés au lieu de vider la carte.
      if (driversFromRequests.length === 0) return previous;

      // Éviter les mises à jour d'état inutiles à chaque snapshot identique.
      const previousKey = previous
        .map((d) => `${d.id}|${d.latitude}|${d.longitude}`)
        .join(";");
      const nextKey = driversFromRequests
        .map((d) => `${d.id}|${d.latitude}|${d.longitude}`)
        .join(";");

      return previousKey === nextKey ? previous : driversFromRequests;
    });
  }, [rideRequests]);

  // =====================================================

  // ÉCOUTER LES DEMANDES BROADCAST

  // =====================================================

  useEffect(() => {

    if (!rideId) {

      setRideRequests([]);

      return;

    }

    const requestsQuery = query(

      collection(db, "ride_requests"),

      where("rideId", "==", rideId)

    );

    const unsubscribe = onSnapshot(

      requestsQuery,

      (snapshot) => {

        const requests = snapshot.docs

          .map((item) => ({

            id: item.id,

            ...item.data(),

          }))

          .sort(

            (a, b) =>

              Number(a.driverDistance ?? Infinity) -

              Number(b.driverDistance ?? Infinity)

          );

        setRideRequests(requests);

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

  // TEST : ACCEPTER UNE DEMANDE RÉELLE

  // =====================================================

  const handleDebugAcceptRequest = async (requestId) => {

    try {

      const result =

        await acceptRideRequest(requestId);

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

  // TEST : REFUSER UNE DEMANDE RÉELLE

  // =====================================================

  const handleDebugRejectRequest = async (requestId) => {

    try {

      await rejectRideRequest(requestId);

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

  // COURSE ANNULÉE -> RETOUR ACCUEIL PASSAGER

  // =====================================================

  useEffect(() => {

    if (ride?.status !== "cancelled") return;

    console.log("🛑 Course annulée -> accueil passager");

    const timer = setTimeout(() => {

      router.replace("/(passenger)");

    }, 150);

    return () => clearTimeout(timer);

  }, [ride?.status]);

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

            showDriverRoute={

              ride.status === "driver_assigned" ||

              ride.status === "driver_arriving"

            }

            driverArrived={

              ride.status === "driver_arrived" ||

              ride.status === "started" ||

              ride.status === "completed"

            }

            startDestinationRoute={

              ride.status === "started"

            }

            destinationLocation={

              ride.destination ?? null

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

        {/* ================= ANNULATION À TOUT MOMENT ================= */}

        {ride?.status === "started" && (

          <View style={styles.alwaysCancelContainer}>

            <TouchableOpacity

              style={styles.alwaysCancelButton}

              onPress={handleCancelRide}

            >

              <Text style={styles.alwaysCancelText}>Annuler la course</Text>

            </TouchableOpacity>

          </View>

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

            <View style={styles.developerPanel}>

              <DeveloperPanel

                rideRequests={rideRequests}

                onAcceptRequest={handleDebugAcceptRequest}

                onRejectRequest={handleDebugRejectRequest}

                onSimulateRide={async () => {

                  try {

                    if (!nearbyDrivers.length) {

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

                    console.log(error);

                  }

                }}

                onAcceptRide={async () => {

                  const request =

                    rideRequests.find(

                      (item) =>

                        item.status === "pending"

                    );

                  if (!request) {

                    console.log(

                      "❌ Aucune demande pending."

                    );

                    return;

                  }

                  await handleDebugAcceptRequest(

                    request.id

                  );

                }}

                onMoveDriver={() => {

                  console.log(

                    "📍 Déplacement conducteur : outil à brancher."

                  );

                }}

                onIncomingRide={() => {

                  console.log(

                    "📞 Simulation demande"

                  );

                }}

                onStartRide={() => {

                  console.log(

                    "🚗 Démarrage manuel : outil à brancher."

                  );

                }}

                onFinishRide={async () => {

                  try {

                    await debugFinishRide(ride.id);

                    console.log(

                      "🏁 Course terminée"

                    );

                  } catch (error) {

                    console.log(error);

                  }

                }}

                onCancelRide={async () => {

                  try {

                    await debugCancelRide(ride.id);

                    console.log(

                      "❌ Course annulée"

                    );

                  } catch (error) {

                    console.log(error);

                  }

                }}

                onResetRide={async () => {

                  try {

                    await debugResetRide(ride.id);

                    console.log(

                      "🔄 Course réinitialisée"

                    );

                  } catch (error) {

                    console.log(error);

                  }

                }}

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

    alwaysCancelContainer: {

    position: "absolute",

    left: 16,

    right: 16,

    bottom: 92,

    zIndex: 220,

  },

  alwaysCancelButton: {

    backgroundColor: "#DC2626",

    borderRadius: 14,

    paddingVertical: 13,

    alignItems: "center",

  },

  alwaysCancelText: {

    color: "#FFFFFF",

    fontSize: 15,

    fontWeight: "700",

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