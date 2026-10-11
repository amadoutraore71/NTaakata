
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import DestinationSearch from "../../components/location/DestinationSearch";
import PrimaryButton from "../../components/PrimaryButton";

import { getUser } from "../../storage/userStorage";
import { getActiveRide } from "../../../services/getActiveRide";

import usePassengerLocation from "../../hooks/usePassengerLocation";
import useRideRequest from "../../hooks/useRideRequest";

import { calculateRoute } from "../../utils/routeCalculator";

import FareSummary from "./FareSummary";
import VehicleSelector from "./VehicleSelector";

export default function PassengerHome() {
  const {
    pickup,
    currentLocation,
    loadingLocation,
    stopLocation,
  } = usePassengerLocation();

  const [estimatedDistance, setEstimatedDistance] = useState(0);
  const [user, setUser] = useState(null);
  const [destination, setDestination] = useState(null);
  const [vehicleType, setVehicleType] = useState("moto");
  const [calculatingRoute, setCalculatingRoute] = useState(false);

  const { requestRide } = useRideRequest();

  const routeRequestId = useRef(0);
  const lastRouteKey = useRef(null);

  // Charger l'utilisateur et vérifier une course active.
  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const currentUser = await getUser();

        if (!mounted || !currentUser) return;

        setUser(currentUser);

        const activeRide = await getActiveRide(currentUser.userId);

        if (!mounted) return;

        if (activeRide) {
          router.replace({
            pathname: "/(passenger)/RideStatus",
            params: { rideId: activeRide.id },
          });
        }
      } catch (error) {
        console.log("Erreur chargement utilisateur :", error);
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  // Calculer l'itinéraire en arrière-plan.
  // Aucun message de chargement n'est affiché au passager.
  useEffect(() => {
    if (!destination) return;

    const coords = currentLocation?.coords;

    if (
      !coords ||
      typeof coords.latitude !== "number" ||
      typeof coords.longitude !== "number" ||
      typeof destination.latitude !== "number" ||
      typeof destination.longitude !== "number"
    ) {
      return;
    }

    const routeKey = [
      destination.latitude,
      destination.longitude,
    ].join(",");

    // Ne pas recalculer à chaque actualisation du GPS.
    if (lastRouteKey.current === routeKey) return;

    lastRouteKey.current = routeKey;

    const requestId = ++routeRequestId.current;
    let cancelled = false;

    async function calculateSelectedRoute() {
      setCalculatingRoute(true);

      try {
        const route = await calculateRoute(
          {
            latitude: coords.latitude,
            longitude: coords.longitude,
          },
          {
            latitude: destination.latitude,
            longitude: destination.longitude,
          }
        );

        if (cancelled || requestId !== routeRequestId.current) return;

        if (!route || typeof route.distance !== "number") {
          setEstimatedDistance(0);
          lastRouteKey.current = null;
          return;
        }

        // La distance est déjà en kilomètres.
        setEstimatedDistance(route.distance);

        console.log("Distance calculée :", route.distance, "km");
      } catch (error) {
        if (!cancelled) {
          setEstimatedDistance(0);
          lastRouteKey.current = null;
          console.log("Erreur calcul itinéraire :", error);
        }
      } finally {
        if (!cancelled && requestId === routeRequestId.current) {
          setCalculatingRoute(false);
        }
      }
    }

    calculateSelectedRoute();

    return () => {
      cancelled = true;
    };
  }, [
    destination,
    currentLocation?.coords?.latitude,
    currentLocation?.coords?.longitude,
  ]);

  // Conserver la destination même si le GPS n'est pas encore prêt.
  const handleDestinationSelect = useCallback((place) => {
    if (!place) return;

    console.log("Destination sélectionnée :", place);

    routeRequestId.current += 1;
    lastRouteKey.current = null;

    setCalculatingRoute(false);
    setEstimatedDistance(0);
    setDestination(place);
  }, []);

  // Commander uniquement lorsque les informations sont prêtes.
  const handleRideRequest = () => {
    if (!user || !destination || !currentLocation?.coords) {
      console.log("Informations de course incomplètes.");
      return;
    }

    if (calculatingRoute || estimatedDistance <= 0) {
      return;
    }

    requestRide({
      user,
      pickup,
      destination,
      currentLocation,
      vehicleType,
      stopLocation,
    });
  };

  const canRequestRide =
    Boolean(user) &&
    Boolean(destination) &&
    Boolean(currentLocation?.coords) &&
    !loadingLocation &&
    !calculatingRoute &&
    estimatedDistance > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.section}>
            <DestinationSearch
              userId={user?.userId}
              currentLocation={
                currentLocation?.coords
                  ? {
                      latitude: currentLocation.coords.latitude,
                      longitude: currentLocation.coords.longitude,
                    }
                  : undefined
              }
              onSelect={handleDestinationSelect}
            />
          </View>

          <View style={styles.section}>
            <VehicleSelector
              vehicleType={vehicleType}
              setVehicleType={setVehicleType}
              estimatedDistance={estimatedDistance}
            />
          </View>

          {destination && estimatedDistance > 0 && (
            <View style={styles.section}>
              <FareSummary
                distance={estimatedDistance}
                vehicleType={vehicleType}
              />
            </View>
          )}

          <View style={styles.commandSection}>
            <PrimaryButton
              title="Commander"
              onPress={handleRideRequest}
              disabled={!canRequestRide}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  content: {
    width: "100%",
    maxWidth: 520,
    paddingHorizontal: 20,
    alignSelf: "center",
    flexGrow: 1,
    justifyContent: "space-evenly",
  },
  section: {
    width: "100%",
  },
  commandSection: {
    width: "100%",
  },
});
