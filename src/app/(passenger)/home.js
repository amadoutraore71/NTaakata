import { router } from "expo-router";
import { useEffect, useState } from "react";

import {
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

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

  const [estimatedDistance, setEstimatedDistance] =
    useState(0);

  const [user, setUser] = useState(null);

  const [destination, setDestination] =
    useState(null);

  const [vehicleType, setVehicleType] =
    useState("moto");

  const { requestRide } = useRideRequest();

  // ============================================================
  // CHARGEMENT UTILISATEUR
  // ============================================================

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await getUser();

      if (!currentUser) {
        return;
      }

      setUser(currentUser);

      const activeRide = await getActiveRide(
        currentUser.userId
      );

      if (activeRide) {
        router.replace({
          pathname: "/(passenger)/RideStatus",
          params: {
            rideId: activeRide.id,
          },
        });

        return;
      }
    } catch (error) {
      console.log(
        "Erreur chargement utilisateur :",
        error
      );
    }
  };

  // ============================================================
  // DESTINATION
  // ============================================================

  const handleDestinationSelect = async (place) => {
    if (!currentLocation?.coords) {
      console.log(
        "❌ currentLocation =",
        currentLocation
      );

      return;
    }

    try {
      setDestination(place);

      const route = await calculateRoute(
        {
          latitude:
            currentLocation.coords.latitude,
          longitude:
            currentLocation.coords.longitude,
        },
        {
          latitude: place.latitude,
          longitude: place.longitude,
        }
      );

      if (!route) {
        return;
      }

      setEstimatedDistance(route.distance);
    } catch (error) {
      console.log(
        "Erreur calcul itinéraire :",
        error
      );
    }
  };

  // ============================================================
  // DEMANDE DE COURSE
  // ============================================================

  const handleRideRequest = () => {
    requestRide({
      user,
      pickup,
      destination,
      currentLocation,
      vehicleType,
      stopLocation,
    });
  };

  // ============================================================
  // AFFICHAGE
  // ============================================================

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>

          {/* ==================================================
              RECHERCHE
          ================================================== */}

          <View style={styles.section}>
            <DestinationSearch
              userId={user?.userId}
              currentLocation={
                currentLocation?.coords
                  ? {
                      latitude:
                        currentLocation.coords.latitude,
                      longitude:
                        currentLocation.coords.longitude,
                    }
                  : undefined
              }
              onSelect={
                handleDestinationSelect
              }
            />
          </View>

          {/* ==================================================
              VÉHICULES
          ================================================== */}

          <View style={styles.section}>
            <VehicleSelector
              vehicleType={vehicleType}
              setVehicleType={
                setVehicleType
              }
              estimatedDistance={
                estimatedDistance
              }
            />
          </View>

          {/* ==================================================
              ESTIMATION
          ================================================== */}

          {destination && (
            <View style={styles.section}>
              <FareSummary
                distance={
                  estimatedDistance
                }
                vehicleType={
                  vehicleType
                }
              />
            </View>
          )}

          {/* ==================================================
              COMMANDER
          ================================================== */}

          <View style={styles.commandSection}>
            <PrimaryButton
              title="Commander"
              onPress={
                handleRideRequest
              }
              disabled={
                !destination ||
                loadingLocation
              }
            />
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  /*
   * Le contenu prend toute la hauteur disponible.
   * Les éléments sont répartis verticalement.
   */
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
  },

  /*
   * Tous les blocs sont répartis de manière équilibrée.
   */
  content: {
    width: "100%",
    maxWidth: 520,
    paddingHorizontal: 20,
    alignSelf: "center",

    flexGrow: 1,
    justifyContent: "space-evenly",
  },

  /*
   * Chaque bloc occupe sa largeur normalement.
   */
  section: {
    width: "100%",
  },

  /*
   * Le bouton est traité comme un bloc normal
   * dans la répartition verticale.
   */
  commandSection: {
    width: "100%",
  },
});