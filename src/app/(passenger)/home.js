
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
  } = usePassengerLocation();

  const [estimatedDistance, setEstimatedDistance] = useState(0);
  const [user, setUser] = useState(null);
  const [destination, setDestination] = useState(null);
  const [vehicleType, setVehicleType] = useState("moto");
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [estimatedDuration, setEstimatedDuration] = useState(0);
  const [loadingUser, setLoadingUser] = useState(true);

  const {
    requestRide,
    requestingRide,
  } = useRideRequest();

  const routeRequestId = useRef(0);
  const lastRouteKey = useRef(null);
  const mountedRef = useRef(true);

  // Charger l'utilisateur et vérifier une course active.
  useEffect(() => {
    mountedRef.current = true;
    let mounted = true;

    async function loadUser() {
      try {
        const currentUser = await getUser();

        if (!mounted || !currentUser?.userId) {
          if (mounted && !currentUser?.userId) {
            router.replace("/(auth)/login");
          }
          return;
        }

        setUser(currentUser);

        const activeRide = await getActiveRide(currentUser.userId);

        if (!mounted) return;

        if (activeRide?.id) {
          router.replace({
            pathname: "/(passenger)/RideStatus",
            params: { rideId: activeRide.id },
          });
        }
      } catch (error) {
        console.log("Erreur chargement utilisateur :", error);
      } finally {
        if (mounted) {
          setLoadingUser(false);
        }
      }
    }

    loadUser();

    return () => {
      mounted = false;
      mountedRef.current = false;
      routeRequestId.current += 1;
    };
  }, []);

  // Calculer l'itinéraire sans modifier l'interface.
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

    // La clé comprend le départ et l'arrivée.
    // Un changement réel de position peut donc recalculer l'itinéraire.
    const routeKey = [
      coords.latitude.toFixed(5),
      coords.longitude.toFixed(5),
      destination.latitude,
      destination.longitude,
    ].join(",");

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

        if (
          cancelled ||
          !mountedRef.current ||
          requestId !== routeRequestId.current
        ) {
          return;
        }

        const distance = Number(route?.distance);
        const duration = Number(route?.duration);

        if (!Number.isFinite(distance) || distance <= 0) {
          setEstimatedDistance(0);
          setEstimatedDuration(0);
          lastRouteKey.current = null;
          return;
        }

        setEstimatedDistance(distance);
        setEstimatedDuration(
          Number.isFinite(duration) && duration >= 0
            ? duration
            : 0
        );

        console.log("Distance calculée :", distance, "km");
        console.log("Durée calculée :", duration, "minutes");
      } catch (error) {
        if (
          !cancelled &&
          mountedRef.current &&
          requestId === routeRequestId.current
        ) {
          setEstimatedDistance(0);
          setEstimatedDuration(0);
          lastRouteKey.current = null;

          console.log("Erreur calcul itinéraire :", error);
        }
      } finally {
        if (
          !cancelled &&
          mountedRef.current &&
          requestId === routeRequestId.current
        ) {
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

    const latitude = Number(place.latitude);
    const longitude = Number(place.longitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      console.log("Destination invalide :", place);
      return;
    }

    const selectedPlace = {
      ...place,
      latitude,
      longitude,
    };

    console.log("Destination sélectionnée :", selectedPlace);

    // Invalider tout calcul précédent.
    routeRequestId.current += 1;
    lastRouteKey.current = null;

    setCalculatingRoute(false);
    setEstimatedDistance(0);
    setEstimatedDuration(0);
    setDestination(selectedPlace);
  }, []);

  // Envoyer la demande au hook corrigé.
  const handleRideRequest = useCallback(async () => {
    if (requestingRide) return;

    if (!user?.userId) {
      console.log("Demande impossible : utilisateur non chargé.");
      return;
    }

    if (!destination || !currentLocation?.coords) {
      console.log("Demande impossible : destination ou GPS manquant.");
      return;
    }

    if (calculatingRoute || estimatedDistance <= 0) {
      console.log("Demande impossible : itinéraire non prêt.");
      return;
    }

    await requestRide({
      user,
      pickup,
      destination,
      currentLocation,
      vehicleType,
      distance: estimatedDistance,
      duration: estimatedDuration,
    });
  }, [
    requestingRide,
    user,
    destination,
    currentLocation,
    calculatingRoute,
    estimatedDistance,
    estimatedDuration,
    pickup,
    vehicleType,
    requestRide,
  ]);

  const canRequestRide =
    Boolean(user?.userId) &&
    Boolean(destination) &&
    Boolean(currentLocation?.coords) &&
    !loadingLocation &&
    !loadingUser &&
    !calculatingRoute &&
    !requestingRide &&
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
              title={
                requestingRide
                  ? "Envoi en cours..."
                  : "Commander"
              }
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
