import { router, useLocalSearchParams } from "expo-router";

import { useEffect, useRef, useState } from "react";

import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { GestureHandlerRootView } from "react-native-gesture-handler";

import { SafeAreaView } from "react-native-safe-area-context";

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
} from "../../../services/debugService";

import {
  acceptRideRequest,
  rejectRideRequest,
} from "../../../services/matching/rideRequestService";

import { findAvailableDrivers } from "../../../services/matching/driverSelectionService";

import { cancelRide } from "../../../services/rideLifecycleService";

import {
  startDriverMovement,
  stopDriverMovement,
} from "../../../src/services/simulation/driverMovementService";

import DeveloperPanel from "../../components/debug/DeveloperPanel";
import RideStatusBanner from "../../components/ride/RideStatusBanner";
import RideTrackingMap from "../../components/ride/RideTrackingMap";

// =====================================================
// RIDE STATUS
// =====================================================

export default function RideStatus() {
  const { rideId } = useLocalSearchParams();

  // ===================================================
  // COURSE
  // ===================================================

  const [ride, setRide] = useState(null);

  // ===================================================
  // CONDUCTEUR
  // ===================================================

  const [driver, setDriver] = useState(null);

  // ===================================================
  // POSITION PASSAGER
  // ===================================================

  const [passengerLocation, setPassengerLocation] = useState(null);

  // ===================================================
  // INFORMATIONS ROUTE
  // ===================================================

  const [routeInfo, setRouteInfo] = useState({
    distance: null,
    duration: null,
    eta: null,
  });

  // ===================================================
  // CONDUCTEURS DISPONIBLES
  // ===================================================

  const [nearbyDrivers, setNearbyDrivers] = useState([]);

  // ===================================================
  // DEMANDES BROADCAST
  // ===================================================

  const [rideRequests, setRideRequests] = useState([]);
  // ===================================================
  // ÉVITER DOUBLE DÉPLACEMENT
  // ===================================================

  const movementRunningRef = useRef(false);

  // ===================================================
  // DÉMARRAGE MANUEL DE LA COURSE
  // ===================================================

  const [destinationRouteStarted, setDestinationRouteStarted] = useState(false);
  const [driverRouteStarted, setDriverRouteStarted] = useState(false);
  // ===================================================
  // VERROU TRAJET CONDUCTEUR → PASSAGER
  // ===================================================

  const arrivalMovementStartedRef = useRef(false);
  // ===================================================
  // STATUTS TRACKING
  // ===================================================

  const trackingStatuses = [
    "driver_assigned",

    "driver_arriving",

    "arrived",

    "started",

    "completed",
  ];

  // ===================================================
  // ÉCOUTER LA COURSE
  // ===================================================

  useEffect(() => {
    if (!rideId) {
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "rides", rideId),

      (snapshot) => {
        if (!snapshot.exists()) {
          console.log("❌ Course introuvable :", rideId);

          setRide(null);

          return;
        }

        const rideData = {
          id: snapshot.id,

          ...snapshot.data(),
        };

        console.log("🚕 Ride :", rideData);

        setRide(rideData);

        // =========================================
        // POSITION PASSAGER
        // =========================================

        if (
          rideData.pickup &&
          typeof rideData.pickup.latitude === "number" &&
          typeof rideData.pickup.longitude === "number"
        ) {
          setPassengerLocation({
            latitude: rideData.pickup.latitude,

            longitude: rideData.pickup.longitude,
          });
        }
      },

      (error) => {
        console.log("❌ Erreur écoute course :", error);
      },
    );

    return unsubscribe;
  }, [rideId]);
  // ===================================================
  // RÉINITIALISER LE VERROU POUR UNE NOUVELLE COURSE
  // ===================================================

  useEffect(() => {
    arrivalMovementStartedRef.current = false;
    setDriverRouteStarted(false);
    setDestinationRouteStarted(false);
  }, [ride?.id, ride?.driverId]);
  // ===================================================
  // ÉCOUTER LES DEMANDES BROADCAST
  // ===================================================

  useEffect(() => {
    if (!rideId) {
      setRideRequests([]);

      return;
    }

    const requestsQuery = query(
      collection(db, "ride_requests"),

      where("rideId", "==", rideId),
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
              Number(b.driverDistance ?? Infinity),
          );

        console.log("🧪 RideStatus - demandes broadcast :", requests);

        setRideRequests(requests);
      },

      (error) => {
        console.log("❌ Erreur écoute ride_requests :", error);
      },
    );

    return unsubscribe;
  }, [rideId]);

  // ===================================================
  // ÉCOUTER LE CONDUCTEUR ACCEPTÉ
  // ===================================================

  useEffect(() => {
    if (!ride?.driverId) {
      setDriver(null);

      return;
    }

    console.log("🔎 Écoute conducteur accepté :", ride.driverId);

    const unsubscribe = onSnapshot(
      doc(db, "users", ride.driverId),

      (snapshot) => {
        if (!snapshot.exists()) {
          console.log("⚠️ Conducteur non trouvé dans users :", ride.driverId);

          setDriver(null);

          return;
        }

        const data = snapshot.data();

        const driverData = {
          ...data,

          docId: snapshot.id,

          userId: data.userId ?? snapshot.id,

          name: data.name ?? ride.driverName ?? "Conducteur",

          phone: data.phone ?? ride.driverPhone ?? null,

          vehicleType: data.vehicleType ?? ride.driverVehicleType ?? null,

          latitude:
            typeof data.latitude === "number"
              ? data.latitude
              : (ride.driverLatitude ?? null),

          longitude:
            typeof data.longitude === "number"
              ? data.longitude
              : (ride.driverLongitude ?? null),

          distance: data.distance ?? ride.driverDistance ?? null,
        };

        console.log("✅ Conducteur accepté :", driverData.name);

        console.log("📍 Position conducteur :", {
          latitude: driverData.latitude,

          longitude: driverData.longitude,
        });

        setDriver(driverData);
      },

      (error) => {
        console.log("❌ Erreur écoute conducteur :", error);
      },
    );

    return unsubscribe;
  }, [ride?.driverId]);

  // ===================================================
  // CHARGER LES CONDUCTEURS DISPONIBLES
  // ===================================================

  useEffect(() => {
    async function loadDrivers() {
      if (!passengerLocation || !ride || ride.status !== "searching") {
        return;
      }

      try {
        const drivers = await findAvailableDrivers(
          passengerLocation,

          ride.vehicleType,
        );

        console.log("🚕 Conducteurs disponibles :", drivers.length);

        console.log("🚕 Liste conducteurs :", drivers);

        setNearbyDrivers(drivers);
      } catch (error) {
        console.log("❌ Erreur chargement conducteurs :", error);
      }
    }

    loadDrivers();
  }, [passengerLocation, ride?.status, ride?.vehicleType]);

  // ===================================================
  // COURSE TERMINÉE
  // ===================================================

  useEffect(() => {
    if (ride?.status !== "completed") {
      return;
    }

    router.replace({
      pathname: "/(passenger)/rate-driver",

    params: {
  rideId: ride.id,
  driverName: ride.driverName ?? "",
},
    });
  }, [ride?.status]);

  // ===================================================
  // ANNULER
  // ===================================================

  const handleCancelRide = async () => {
    if (!ride?.id) {
      return;
    }

    try {
      await cancelRide(ride.id);

      // Arrêter immédiatement le déplacement du conducteur
      if (ride?.driverId) {
        stopDriverMovement(ride.driverId);
      }

      movementRunningRef.current = false;

      router.replace("/(passenger)");
    } catch (error) {
      console.log("❌ Erreur annulation :", error);
    }
  };
  // ===================================================
  // ACCEPTER UNE DEMANDE
  // ===================================================

  const handleDebugAcceptRequest = async (requestId) => {
    try {
      const result = await acceptRideRequest(requestId);

      console.log("🧪 Résultat acceptation :", result);
    } catch (error) {
      console.log("❌ Erreur acceptation :", error);
    }
  };

  // ===================================================
  // REFUSER UNE DEMANDE
  // ===================================================

  const handleDebugRejectRequest = async (requestId) => {
    try {
      const result = await rejectRideRequest(requestId);

      console.log("🧪 Résultat refus :", result);
    } catch (error) {
      console.log("❌ Erreur refus :", error);
    }
  };

  // ===================================================
  // RECHERCHE
  // ===================================================

  const isSearching = ride?.status === "searching";

  // ===================================================
  // CONDUCTEUR ACTUELLEMENT CONTACTÉ
  // ===================================================

  const searchingDriver =
    isSearching && !ride?.driverId && ride?.currentSearchingDriverId
      ? {
          id: ride.currentSearchingDriverId,

          name: ride.currentSearchingDriverName,

          latitude: ride.currentSearchingDriverLocation?.latitude,

          longitude: ride.currentSearchingDriverLocation?.longitude,

          distance: ride.currentSearchingDriverDistance,

          vehicleType: ride.currentSearchingDriverVehicleType,
        }
      : null;

  // ===================================================
  // CONDUCTEUR ACCEPTÉ
  // ===================================================

  /*
   * IMPORTANT :
   *
   * Le document users peut mettre quelques
   * instants à être disponible.
   *
   * On utilise donc les données du document
   * rides comme fallback.
   */

  const displayedDriver = ride?.driverId
    ? {
        docId: driver?.docId ?? ride.driverId,

        userId: driver?.userId ?? ride.driverId,

        name: driver?.name ?? ride.driverName ?? "Conducteur",

        phone: driver?.phone ?? ride.driverPhone ?? null,

        vehicleType: driver?.vehicleType ?? ride.driverVehicleType ?? null,

        latitude:
          typeof driver?.latitude === "number"
            ? driver.latitude
            : (ride.driverLatitude ?? null),

        longitude:
          typeof driver?.longitude === "number"
            ? driver.longitude
            : (ride.driverLongitude ?? null),

        distance: driver?.distance ?? ride.driverDistance ?? null,
      }
    : null;

  // ===================================================
  // MODE DE LA CARTE
  // ===================================================

  /*
   * La présence de driverId est prioritaire.
   *
   * Même si le statut est encore
   * driver_assigned, on passe directement
   * en tracking.
   */

  const mapMode = ride?.driverId
    ? "tracking"
    : trackingStatuses.includes(ride?.status)
      ? "tracking"
      : "drivers";

  // ===================================================
  // CONDUCTEURS POUR LA CARTE
  // ===================================================

  /*
   * MODE RECHERCHE :
   *
   * plusieurs conducteurs.
   *
   * MODE TRACKING :
   *
   * aucun nearbyDrivers.
   *
   * Le conducteur accepté passe par
   * driverLocation.
   */

  const driversForMap = ride?.driverId ? [] : nearbyDrivers;

  // ===================================================
  // RECHERCHE TERMINÉE
  // ===================================================

  const searchFinished =
    ride?.status === "search_timeout" || ride?.status === "search_failed";

  // ===================================================
  // DÉPLACER LE CONDUCTEUR VERS LA DESTINATION
  // ===================================================

  const handleMoveDriverToDestination = async () => {
    console.log("========================================");

    console.log("🚗 START DRIVER MOVEMENT TO DESTINATION");

    console.log("========================================");

    // ===============================================
    // COURSE
    // ===============================================

    if (!ride?.id) {
      console.log("❌ Course introuvable.");

      return;
    }

    // ===============================================
    // CONDUCTEUR
    // ===============================================

    if (!ride?.driverId) {
      console.log("❌ Aucun conducteur accepté.");

      return;
    }

    // ===============================================
    // EMPÊCHER DOUBLE LANCEMENT
    // ===============================================

    if (movementRunningRef.current) {
      console.log("⏳ Déplacement déjà en cours.");

      return;
    }

    // ===============================================
    // POSITION ACTUELLE DU CONDUCTEUR
    // ===============================================

    const driverLatitude = Number(displayedDriver?.latitude);

    const driverLongitude = Number(displayedDriver?.longitude);

    if (!Number.isFinite(driverLatitude) || !Number.isFinite(driverLongitude)) {
      console.log(
        "❌ Position actuelle du conducteur invalide :",
        displayedDriver,
      );

      return;
    }

    // ===============================================
    // DESTINATION
    // ===============================================

    const destinationLatitude = Number(ride.destination?.latitude);

    const destinationLongitude = Number(ride.destination?.longitude);

    if (
      !Number.isFinite(destinationLatitude) ||
      !Number.isFinite(destinationLongitude)
    ) {
      console.log("❌ Destination invalide :", ride.destination);

      return;
    }

    // ===============================================
    // VERROU
    // ===============================================

    movementRunningRef.current = true;

    console.log("🚗 Conducteur :", displayedDriver?.name);

    console.log("🆔 Driver ID :", ride.driverId);

    console.log("📍 Position actuelle :", {
      latitude: driverLatitude,
      longitude: driverLongitude,
    });

    console.log("🎯 Destination :", {
      latitude: destinationLatitude,
      longitude: destinationLongitude,
    });

    try {
      // =============================================
      // DÉPLACEMENT CONDUCTEUR → DESTINATION
      // =============================================
movementRunningRef.current = true;
      await startDriverMovement({
        driverId: ride.driverId,

        startLocation: {
          latitude: driverLatitude,
          longitude: driverLongitude,
        },

        endLocation: {
          latitude: destinationLatitude,
          longitude: destinationLongitude,
        },

        // =========================================
        // ARRIVÉE À DESTINATION
        // =========================================

onFinished: async () => {
  try {
    console.log("📍 CONDUCTEUR ARRIVÉ À DESTINATION");
    console.log("⏸️ La course reste en cours.");

    // IMPORTANT :
    // L'arrivée à destination NE termine PAS automatiquement la course.
    // Le conducteur devra appuyer sur "Terminer la course".

  } catch (error) {
    console.error(
      "❌ Erreur après arrivée à destination :",
      error
    );
  } finally {
    movementRunningRef.current = false;

    console.log(
      "🔓 movementRunning = false"
    );
  }
},
      });
    } catch (error) {
      console.log("❌ Erreur déplacement vers destination :", error);

      movementRunningRef.current = false;
    }
  };
  // ===================================================
  // DÉPLACER LE CONDUCTEUR ACCEPTÉ
  // ===================================================

  const handleMoveDriver = async () => {
    try {
      console.log("========================================");
      console.log("🚗 START DRIVER MOVEMENT");
      console.log("🆔 driverId =", ride?.driverId);

      // =====================================================
      // VÉRIFICATIONS
      // =====================================================

      if (!ride?.driverId) {
        console.log("❌ Aucun conducteur affecté.");
        return;
      }

      if (!ride?.pickup) {
        console.log("❌ Position passager absente.");
        return;
      }

      if (!displayedDriver) {
        console.log("❌ Position conducteur absente.");
        return;
      }

      const driverLatitude = Number(displayedDriver.latitude);
      const driverLongitude = Number(displayedDriver.longitude);

      const passengerLatitude = Number(ride.pickup.latitude);
      const passengerLongitude = Number(ride.pickup.longitude);

      if (
        !Number.isFinite(driverLatitude) ||
        !Number.isFinite(driverLongitude) ||
        !Number.isFinite(passengerLatitude) ||
        !Number.isFinite(passengerLongitude)
      ) {
        console.log("❌ Coordonnées invalides.");
        return;
      }

      const startLocation = {
        latitude: driverLatitude,
        longitude: driverLongitude,
      };

      const endLocation = {
        latitude: passengerLatitude,
        longitude: passengerLongitude,
      };

      console.log("📍 Départ :", JSON.stringify(startLocation));

      console.log("🎯 Passager :", JSON.stringify(endLocation));

      console.log("🚕 Ride :", JSON.stringify(ride));

      // =====================================================
      // CALCUL DE LA DISTANCE CONDUCTEUR → PASSAGER
      // =====================================================

      const toRadians = (value) => (value * Math.PI) / 180;

      const earthRadius = 6371000;

      const latitudeDifference = toRadians(passengerLatitude - driverLatitude);

      const longitudeDifference = toRadians(
        passengerLongitude - driverLongitude,
      );

      const a =
        Math.sin(latitudeDifference / 2) ** 2 +
        Math.cos(toRadians(driverLatitude)) *
          Math.cos(toRadians(passengerLatitude)) *
          Math.sin(longitudeDifference / 2) ** 2;

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      const distanceToPassenger = earthRadius * c;

      console.log(
        "📏 Distance conducteur → passager :",
        distanceToPassenger.toFixed(2),
        "m",
      );

      // =====================================================
      // CONDUCTEUR DÉJÀ SUR PLACE
      // =====================================================

      const ARRIVAL_THRESHOLD = 20;

      if (distanceToPassenger <= ARRIVAL_THRESHOLD) {
        console.log("✅ Conducteur déjà au point de prise en charge.");

        console.log(
          `📍 Distance ${distanceToPassenger.toFixed(
            2,
          )} m <= ${ARRIVAL_THRESHOLD} m`,
        );

        // Le conducteur n'a pas besoin de se déplacer.
        // On passe directement à "arrived".
        const rideRef = doc(db, "rides", ride.id);

        await updateDoc(rideRef, {
          status: "arrived",
          arrivedAt: serverTimestamp(),
          currentSearchingRequestId: null,
          currentSearchingDriverId: null,
          currentSearchingDriverName: null,
          currentSearchingDriverLocation: null,
          currentSearchingDriverDistance: null,
          currentSearchingDriverVehicleType: null,
        });

        console.log("✅ Arrivée confirmée immédiatement.");

        console.log("📍 Le conducteur était déjà sur place.");

        console.log("========================================");

        return;
      }

   // =====================================================
// LE CONDUCTEUR EST ASSEZ LOIN
// → DÉPLACEMENT MANUEL
// =====================================================

console.log(
  "🚗 Conducteur suffisamment éloigné."
);

console.log(
  "🛣️ Démarrage manuel conducteur → passager..."
);

// Verrou anti-double déplacement
movementRunningRef.current = true;

// Autorise le trajet visuel
setDriverRouteStarted(true);

try {

  await startDriverMovement({
    driverId:
      ride.driverId,

    startLocation,

    endLocation,

    onFinished:
      async () => {

        console.log(
          "🏁 Conducteur arrivé au passager."
        );

        try {

          await updateDoc(
            doc(
              db,
              "rides",
              ride.id
            ),
            {
              status:
                "arrived",

              arrivedAt:
                serverTimestamp(),

              driverLatitude:
                endLocation.latitude,

              driverLongitude:
                endLocation.longitude,
            }
          );

          console.log(
            "✅ Statut course : arrived"
          );

        } catch (error) {

          console.error(
            "❌ Erreur mise à jour arrivée :",
            error
          );

        } finally {

          movementRunningRef.current =
            false;
        }
      },
  });

} catch (error) {

  console.error(
    "❌ Erreur déplacement conducteur :",
    error
  );

  movementRunningRef.current =
    false;

  setDriverRouteStarted(
    false
  );
}
    } catch (error) {
      console.error("❌ Erreur déplacement conducteur :", error);

      movementRunningRef.current = false;
    }
  };
  // ===================================================
  // DÉMARRER LA COURSE — ACTION MANUELLE
  // ===================================================

  const handleStartRide = async () => {
    if (!ride?.id) {
      console.log("❌ Course introuvable.");
      return;
    }

    if (ride.status !== "arrived") {
      console.log(
        "❌ Impossible de démarrer la course. Statut actuel :",
        ride.status,
      );
      return;
    }

    if (movementRunningRef.current) {
      console.log("⏳ Un déplacement est déjà en cours.");
      return;
    }

    try {
      // Autorisation explicite du trajet vers destination
      setDriverRouteStarted(false);
      setDestinationRouteStarted(true);

await updateDoc(
  doc(db, "rides", ride.id),
  {
    status: "started",
    startedAt: serverTimestamp(),
  }
);

console.log(
  "🚗 Course démarrée manuellement"
);

console.log(
  "🗺️ Route conducteur → destination activée"
);
    } catch (error) {
      console.log("❌ Erreur démarrage course :", error);

      setDestinationRouteStarted(false);
      movementRunningRef.current = false;
    }
  };
  // ===================================================
// DÉMARRER LE DÉPLACEMENT VERS LA DESTINATION
// APRÈS QUE LA CARTE SOIT EN MODE ROUTE DESTINATION
// ===================================================

useEffect(() => {
  if (!ride?.id) {
    return;
  }

  if (ride.status !== "started") {
    return;
  }

  if (!destinationRouteStarted) {
    return;
  }

  if (movementRunningRef.current) {
    return;
  }

  console.log(
    "🚦 Démarrage déplacement conducteur → destination"
  );

  handleMoveDriverToDestination();

}, [
  ride?.id,
  ride?.status,
  destinationRouteStarted,
]);
  // ===================================================
  // SIMULATION ACCEPTATION ANCIENNE
  // ===================================================
const handleOldAcceptRide = async () => {
  if (!ride?.id) {
    console.log("⚠️ Impossible de simuler l'acceptation : course introuvable");
    return;
  }

  try {
    console.log("🧪 TEST : simulation de l'acceptation conducteur");
    console.log("🚗 Course :", ride.id);

    // Recherche d'un conducteur disponible
    const availableDrivers = await findAvailableDrivers(
      ride.pickup?.latitude,
      ride.pickup?.longitude
    );

    if (!availableDrivers || availableDrivers.length === 0) {
      console.log("❌ Aucun conducteur disponible pour le test");
      return;
    }

    const selectedDriver = availableDrivers[0];

    console.log("🚗 Conducteur sélectionné :", {
      userId: selectedDriver.userId,
      name: selectedDriver.name,
      latitude: selectedDriver.latitude,
      longitude: selectedDriver.longitude,
    });

    // IMPORTANT :
    // On affecte simplement le conducteur à la course.
    // Aucun déplacement n'est lancé ici.
    await updateDoc(doc(db, "rides", ride.id), {
      driverId: selectedDriver.userId,
      driverName: selectedDriver.name || "",
      driverPhone: selectedDriver.phone || "",
      driverLatitude: Number(selectedDriver.latitude),
      driverLongitude: Number(selectedDriver.longitude),
      driverVehicleType: selectedDriver.vehicleType || "",
      driverVehicleBrand: selectedDriver.vehicleBrand || "",
      driverVehicleModel: selectedDriver.vehicleModel || "",
      driverVehicleColor: selectedDriver.vehicleColor || "",
      driverPlateNumber: selectedDriver.plateNumber || "",
      status: "driver_assigned",
      acceptedAt: serverTimestamp(),
    });

    console.log("✅ TEST : conducteur affecté à la course");
    console.log("📍 Statut :", "driver_assigned");
    console.log("⏸️ Aucun déplacement automatique");
  } catch (error) {
    console.error(
      "❌ Erreur simulation acceptation conducteur :",
      error
    );
  }
};
  // ===================================================
  // TERMINER
  // ===================================================

  const handleFinishRide = async () => {
    try {
      await debugFinishRide(ride.id);

      console.log("🏁 Course terminée");
    } catch (error) {
      console.log("❌ Erreur fin course :", error);
    }
  };

  // ===================================================
  // ANNULER DEBUG
  // ===================================================

  const handleDebugCancelRide = async () => {
    try {
      await debugCancelRide(ride.id);

      // Arrêter immédiatement le déplacement du conducteur
      if (ride?.driverId) {
        stopDriverMovement(ride.driverId);
      }

      movementRunningRef.current = false;

      console.log("❌ Course annulée");
    } catch (error) {
      console.log("❌ Erreur annulation :", error);
    }
  };
  // ===================================================
  // RESET
  // ===================================================

  const handleResetRide = async () => {
    try {
      movementRunningRef.current = false;

      await debugResetRide(ride.id);

      setDriver(null);

      setNearbyDrivers([]);

      setRideRequests([]);

      console.log("🔄 Course réinitialisée");
    } catch (error) {
      console.log("❌ Erreur reset :", error);
    }
  };

  // ===================================================
  // DEBUG
  // ===================================================

  console.log("🔎 RideStatus :", {
    status: ride?.status,

    mapMode: mapMode,

    driverId: ride?.driverId,

    acceptedDriver: displayedDriver?.name,

    acceptedDriverLatitude: displayedDriver?.latitude,

    acceptedDriverLongitude: displayedDriver?.longitude,

    nearbyDrivers: nearbyDrivers.length,

    driversForMap: driversForMap.length,

    rideRequests: rideRequests.length,

    searchingDriver: searchingDriver?.name,

    movementRunning: movementRunningRef.current,
  });

  // ===================================================
  // CHARGEMENT
  // ===================================================

  if (!ride) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Chargement de la course...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ===================================================
  // AFFICHAGE
  // ===================================================

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        {/* ============================================
            CARTE
        ============================================ */}

        {passengerLocation && (
          <RideTrackingMap
  mode={mapMode}

  // ==================================================
  // LIGNE CONDUCTEUR → PASSAGER
  // APPARAÎT DÈS L'ACCEPTATION
  // ==================================================
  showDriverRoute={
    ride?.status === "driver_assigned" ||
    ride?.status === "driver_arriving"
  }

  // ==================================================
  // MOUVEMENT CONDUCTEUR → PASSAGER
  // DÉMARRE SEULEMENT AVEC LE BOUTON DEBUG
  // ==================================================
  startDriverRoute={
    driverRouteStarted &&
    (
      ride?.status === "driver_assigned" ||
      ride?.status === "driver_arriving"
    )
  }

  // ==================================================
  // MOUVEMENT VERS DESTINATION
  // ==================================================
  startDestinationRoute={
    destinationRouteStarted &&
    ride?.status === "started"
  }

  passengerLocation={
    passengerLocation
  }

  driverLocation={
    displayedDriver
      ? {
          id:
            displayedDriver.docId ||
            displayedDriver.userId ||
            displayedDriver.id,

          docId:
            displayedDriver.docId,

          userId:
            displayedDriver.userId,

          name:
            displayedDriver.name,

          phone:
            displayedDriver.phone,

          latitude:
            Number(
              displayedDriver.latitude
            ),

          longitude:
            Number(
              displayedDriver.longitude
            ),

          vehicleType:
            displayedDriver.vehicleType,

          destination:
            ride?.destination
              ? {
                  latitude:
                    Number(
                      ride.destination.latitude
                    ),

                  longitude:
                    Number(
                      ride.destination.longitude
                    ),

                  address:
                    ride.destination.address ||
                    "",
                }
              : null,
        }
      : null
  }

  drivers={driversForMap}

  searchingDriver={
    isSearching
      ? searchingDriver
      : null
  }

  onDriverSelected={() => {}}

  onRouteInfo={(route) => {
    setRouteInfo({
      distance:
        route?.distance ?? null,

      duration:
        route?.duration ?? null,

      eta:
        route?.eta
          ? new Date(
              route.eta
            )
          : null,
    });
  }}
/>
        )}

        {/* ============================================
            BANNIÈRE
        ============================================ */}

        <View style={styles.bottomBanner}>
          <RideStatusBanner
            status={ride.status}
            driverName={
              ride.driverId
                ? displayedDriver?.name
                : isSearching
                  ? searchingDriver?.name
                  : null
            }
            onCancel={handleCancelRide}
          />
        </View>

        {/* ============================================
            RECHERCHE TERMINÉE
        ============================================ */}

        {searchFinished && (
          <View style={styles.searchFinishedContainer}>
            <View style={styles.searchFinishedCard}>
              <Text style={styles.searchFinishedTitle}>
                Aucun conducteur trouvé
              </Text>

              <Text style={styles.searchFinishedText}>
                Aucun conducteur n'a accepté votre course.
              </Text>

              <TouchableOpacity
                style={styles.searchFinishedButton}
                onPress={() => router.replace("/(passenger)")}
              >
                <Text style={styles.searchFinishedButtonText}>
                  Retour à l'accueil
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ============================================
            PANNEAU DÉVELOPPEUR
        ============================================ */}

        {__DEV__ && ride?.id && (
          <View style={styles.developerPanel}>
            <DeveloperPanel
              rideRequests={rideRequests}
              onAcceptRequest={handleDebugAcceptRequest}
              onRejectRequest={handleDebugRejectRequest}
              
              // ======================================
              // ANCIEN BOUTON ACCEPTER
              // ======================================

              onAcceptRide={handleOldAcceptRide}
              // ======================================
              // DÉPLACER CONDUCTEUR
              // ======================================

              onMoveDriver={handleMoveDriver}
              // ======================================
              // DÉMARRER COURSE
              // ======================================

              onStartRide={handleStartRide}
              // ======================================
              // TERMINER
              // ======================================

              onFinishRide={handleFinishRide}
              // ======================================
              // ANNULER
              // ======================================

              onCancelRide={handleDebugCancelRide}
              // ======================================
              // RESET
              // ======================================

              onResetRide={handleResetRide}
              // ======================================
              // DEMANDE SIMULÉE
              // ======================================

              onIncomingRide={() => {
                console.log("📞 Simulation demande");
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

const styles = StyleSheet.create({
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
