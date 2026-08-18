import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

import {
  setCurrentLocation as saveCurrentLocation,
} from "../storage/locationStorage";

export default function usePassengerLocation() {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [pickup, setPickup] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(true);

  const locationSubscription = useRef(null);

  useEffect(() => {
    startLocation();

    return () => {
      stopLocation();
    };
  }, []);

async function startLocation() {
  try {
    const { status } =
      await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission refusée",
        "Veuillez autoriser l'accès à votre position."
      );
      return;
    }

    // Première position immédiate
    const initialLocation =
      await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

    setCurrentLocation(initialLocation);

    saveCurrentLocation(initialLocation);

    console.log(
      "📍 Position initiale :",
      initialLocation.coords.latitude,
      initialLocation.coords.longitude
    );

    setLoadingLocation(false);


    // Puis suivi en temps réel
    locationSubscription.current =
      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5,
          timeInterval: 3000,
        },
        async (location) => {

          setCurrentLocation(location);

          saveCurrentLocation(location);

          console.log(
            "GPS :",
            location.coords.latitude,
            location.coords.longitude
          );

          // ton reverseGeocode reste ici
        }
      );

  } catch (error) {
    console.log(error);

    Alert.alert(
      "Erreur",
      "Impossible d'obtenir votre position."
    );
  }
}
  function stopLocation() {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  }

  return {
    pickup,
    currentLocation,
    loadingLocation,
    stopLocation,
  };
}