
import { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";

import { createRide } from "../../services/rideService";

export default function useRideRequest() {
  const [requestingRide, setRequestingRide] = useState(false);
  const requestInProgress = useRef(false);

  const requestRide = useCallback(async ({
    user,
    pickup,
    destination,
    currentLocation,
    vehicleType,
    distance,
    duration,
  } = {}) => {
    // Éviter les doubles demandes.
    if (requestInProgress.current) {
      return;
    }

    const coords = currentLocation?.coords;

    // Vérifier les informations du passager.
    if (!user?.userId) {
      Alert.alert(
        "Compte introuvable",
        "Reconnectez-vous avant de commander une course."
      );
      return;
    }

    // Vérifier la position GPS.
    if (
      !coords ||
      !Number.isFinite(coords.latitude) ||
      !Number.isFinite(coords.longitude)
    ) {
      Alert.alert(
        "Position indisponible",
        "Attendez que votre position GPS soit disponible."
      );
      return;
    }

    // Vérifier la destination.
    if (
      !destination ||
      !Number.isFinite(Number(destination.latitude)) ||
      !Number.isFinite(Number(destination.longitude))
    ) {
      Alert.alert(
        "Destination manquante",
        "Sélectionnez une destination valide."
      );
      return;
    }

    // Vérifier la distance calculée en kilomètres.
    const calculatedDistance = Number(distance);

    if (
      !Number.isFinite(calculatedDistance) ||
      calculatedDistance <= 0
    ) {
      Alert.alert(
        "Itinéraire indisponible",
        "Attendez la fin du calcul de la distance avant de commander."
      );
      return;
    }

    if (!["moto", "voiture"].includes(vehicleType)) {
      Alert.alert(
        "Véhicule invalide",
        "Sélectionnez une moto ou une voiture."
      );
      return;
    }

    requestInProgress.current = true;
    setRequestingRide(true);

    try {
      const pickupData = {
        address:
          typeof pickup === "string"
            ? pickup
            : pickup?.address || "Ma position actuelle",
        latitude: coords.latitude,
        longitude: coords.longitude,
      };

      const destinationData = {
        ...destination,
        latitude: Number(destination.latitude),
        longitude: Number(destination.longitude),
      };

      const calculatedDuration = Number(duration);

      console.log("🚕 Création de la demande de course...");
      console.log("📍 Départ :", pickupData);
      console.log("🎯 Destination :", destinationData);
      console.log("🚘 Véhicule :", vehicleType);
      console.log("📏 Distance :", calculatedDistance, "km");

      // createRide calcule le tarif et déclenche
      // le mécanisme de recherche des conducteurs.
      const rideId = await createRide({
        passenger: user,
        pickup: pickupData,
        destination: destinationData,
        distance: calculatedDistance,
        duration:
          Number.isFinite(calculatedDuration) &&
          calculatedDuration >= 0
            ? calculatedDuration
            : 0,
        vehicleType,
      });

      if (typeof rideId !== "string" || !rideId.trim()) {
        throw new Error(
          "La création de la course n'a pas retourné d'identifiant valide."
        );
      }

      console.log("✅ Course créée :", rideId);

      router.replace({
        pathname: "/(passenger)/RideStatus",
        params: { rideId },
      });
    } catch (error) {
      console.error("❌ Erreur de demande de course :", error);

      Alert.alert(
        "Demande impossible",
        error?.message ||
          "Une erreur est survenue pendant la création de la course."
      );
    } finally {
      requestInProgress.current = false;
      setRequestingRide(false);
    }
  }, []);

  return {
    requestRide,
    requestingRide,
  };
}
