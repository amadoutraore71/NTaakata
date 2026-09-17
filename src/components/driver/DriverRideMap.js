import { useEffect, useMemo, useRef, useState } from "react";
import { Asset } from "expo-asset";
import { StyleSheet, View } from "react-native";

import LeafletMap from "../LeafletMap";
import generateMapHtml from "../../utils/generateMapHtml";

export default function DriverRideMap({
  driverLocation,
  passengerLocation,
  destinationLocation,
  driverId,
  showDriverRoute = false,
  startDestinationRoute = false,
  onRouteInfo,
  onDriverSelected,
}) {
  const [icons, setIcons] = useState(null);

  /*
   * ============================================================
   * POSITION INITIALE DU CONDUCTEUR
   * ============================================================
   *
   * Cette position sert uniquement à construire la carte
   * initiale.
   *
   * Elle ne change jamais pendant la course.
   */
  const initialDriverRef = useRef(null);
  const [initialDriver, setInitialDriver] = useState(null);

  /*
   * ============================================================
   * CONDUCTEUR LIVE
   * ============================================================
   *
   * Cette valeur peut changer chaque seconde.
   * Elle ne doit PAS recréer le HTML.
   */
  const normalizedDriver = useMemo(() => {
    if (!driverLocation) return null;

    const latitude = Number(driverLocation.latitude);
    const longitude = Number(driverLocation.longitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return null;
    }

    return {
      ...driverLocation,

      id:
        driverLocation.id ??
        driverLocation.docId ??
        driverLocation.userId ??
        driverId,

      userId:
        driverLocation.userId ??
        driverId,

      latitude,
      longitude,
    };
  }, [
    driverLocation,
    driverId,
  ]);

  /*
   * ============================================================
   * PASSAGER
   * ============================================================
   *
   * On dépend uniquement des coordonnées primitives.
   *
   * Ainsi, un nouveau snapshot Firestore qui recrée
   * l'objet passengerLocation ne recrée PAS inutilement
   * le HTML de la carte.
   */
  const passengerLatitude = Number(
    passengerLocation?.latitude
  );

  const passengerLongitude = Number(
    passengerLocation?.longitude
  );

  const normalizedPassenger = useMemo(() => {
    if (
      !Number.isFinite(passengerLatitude) ||
      !Number.isFinite(passengerLongitude)
    ) {
      return null;
    }

    return {
      latitude: passengerLatitude,
      longitude: passengerLongitude,
    };
  }, [
    passengerLatitude,
    passengerLongitude,
  ]);

  /*
   * ============================================================
   * DESTINATION
   * ============================================================
   *
   * Même principe :
   * uniquement les coordonnées sont utilisées comme dépendances.
   */
  const destinationLatitude = Number(
    destinationLocation?.latitude
  );

  const destinationLongitude = Number(
    destinationLocation?.longitude
  );

  const destinationAddress =
    destinationLocation?.address ?? "";

  const normalizedDestination = useMemo(() => {
    if (
      !Number.isFinite(destinationLatitude) ||
      !Number.isFinite(destinationLongitude)
    ) {
      return null;
    }

    return {
      latitude: destinationLatitude,
      longitude: destinationLongitude,
      address: destinationAddress,
    };
  }, [
    destinationLatitude,
    destinationLongitude,
    destinationAddress,
  ]);

  /*
   * ============================================================
   * MÉMORISER LA POSITION INITIALE
   * ============================================================
   */
  useEffect(() => {
    if (!normalizedDriver) return;

    if (initialDriverRef.current) {
      return;
    }

    initialDriverRef.current = normalizedDriver;

    setInitialDriver(normalizedDriver);

    console.log(
      "🧷 Position initiale carte mémorisée :",
      normalizedDriver
    );
  }, [normalizedDriver]);

  /*
   * ============================================================
   * CHARGEMENT DES ICÔNES
   * ============================================================
   */
  useEffect(() => {
    let cancelled = false;

    async function loadIcons() {
      try {
        const car = Asset.fromModule(
          require("../../../assets/map-icons/car.png")
        );

        const moto = Asset.fromModule(
          require("../../../assets/map-icons/moto.png")
        );

        const passenger = Asset.fromModule(
          require("../../../assets/map-icons/passenger.png")
        );

        await Promise.all([
          car.downloadAsync(),
          moto.downloadAsync(),
          passenger.downloadAsync(),
        ]);

        if (cancelled) return;

        setIcons({
          car: car.uri,
          moto: moto.uri,
          passenger: passenger.uri,
        });

        console.log(
          "✅ Icônes DriverRideMap chargées"
        );
      } catch (error) {
        console.error(
          "❌ Erreur chargement icônes DriverRideMap :",
          error
        );

        if (!cancelled) {
          setIcons({
            car: "",
            moto: "",
            passenger: "",
          });
        }
      }
    }

    loadIcons();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * ============================================================
   * HTML DE LA CARTE
   * ============================================================
   *
   * IMPORTANT :
   *
   * Le conducteur LIVE n'est PAS ici.
   *
   * Le statut de la course n'est PAS ici.
   *
   * showDriverRoute n'est PAS ici.
   *
   * startDestinationRoute n'est PAS ici.
   *
   * Ces éléments sont envoyés à LeafletMap sans recréer
   * la WebView.
   */
  const html = useMemo(() => {
    if (
      !icons ||
      !initialDriver ||
      !normalizedPassenger
    ) {
      return "";
    }

    console.log(
      "🗺️ Génération HTML DriverRideMap : UNE FOIS POUR LA COURSE"
    );

    return generateMapHtml({
      mode: "tracking",

      passengerLocation:
        normalizedPassenger,

      driverLocation:
        initialDriver,

      destinationLocation:
        normalizedDestination,

      drivers: [
        initialDriver,
      ],

      icons,
    });
  }, [
    icons,
    initialDriver,
    normalizedPassenger,
    normalizedDestination,
  ]);

  /*
   * ============================================================
   * CHARGEMENT
   * ============================================================
   */
  if (
    !normalizedDriver ||
    !normalizedPassenger ||
    !initialDriver ||
    !icons ||
    !html
  ) {
    return (
      <View style={styles.loading} />
    );
  }

  /*
   * ============================================================
   * CARTE
   * ============================================================
   */
  return (
    <View style={styles.container}>
      <LeafletMap
        html={html}
        mode="tracking"

        /*
         * Position LIVE du conducteur.
         *
         * LeafletMap déplace le marqueur sans
         * recréer la WebView.
         */
        drivers={[
          normalizedDriver,
        ]}

        onDriverSelected={
          onDriverSelected
        }

        onRouteInfo={
          onRouteInfo
        }

        showDriverRoute={
          showDriverRoute
        }

        startDestinationRoute={
          startDestinationRoute
        }

        destinationLocation={
          normalizedDestination
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loading: {
    flex: 1,
  },
});