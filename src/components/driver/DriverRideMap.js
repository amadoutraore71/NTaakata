import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import LeafletMap from "../LeafletMap";
import generateMapHtml from "../../utils/generateMapHtml";

export default function DriverRideMap({
  driverLocation,
  passengerLocation,
  destinationLocation,
  driverId,
  showDriverRoute = false,
  driverArrived = false,
  startDestinationRoute = false,
  onRouteInfo,
  onDriverSelected,
}) {
  const initialDriverRef = useRef(null);
  const [initialDriver, setInitialDriver] = useState(null);

  const normalizedDriver = useMemo(() => {
    if (!driverLocation) return null;

    const latitude = Number(driverLocation.latitude);
    const longitude = Number(driverLocation.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return {
      ...driverLocation,
      id:
        driverLocation.id ??
        driverLocation.docId ??
        driverLocation.userId ??
        driverId,
      userId: driverLocation.userId ?? driverId,
      latitude,
      longitude,
    };
  }, [driverLocation, driverId]);

  const normalizedPassenger = useMemo(() => {
    if (!passengerLocation) return null;

    const latitude = Number(passengerLocation.latitude);
    const longitude = Number(passengerLocation.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return {
      ...passengerLocation,
      latitude,
      longitude,
    };
  }, [
  passengerLocation?.latitude,
  passengerLocation?.longitude,
  passengerLocation?.address,
]);

  const normalizedDestination = useMemo(() => {
    if (!destinationLocation) return null;

    const latitude = Number(destinationLocation.latitude);
    const longitude = Number(destinationLocation.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return {
      ...destinationLocation,
      latitude,
      longitude,
    };
  }, [
  destinationLocation?.latitude,
  destinationLocation?.longitude,
  destinationLocation?.address,
]);

  useEffect(() => {
    if (!normalizedDriver) return;
    if (initialDriverRef.current) return;

    initialDriverRef.current = normalizedDriver;
    setInitialDriver(normalizedDriver);

    console.log(
      "🧷 Position initiale carte mémorisée :",
      normalizedDriver
    );
  }, [normalizedDriver]);

  /*
   * IMPORTANT :
   * Aucun require de car.png / moto.png / passenger.png ici.
   *
   * generateMapHtml utilise maintenant des icônes SVG transparentes
   * directement dans Leaflet. Cela évite les erreurs de chemin d'assets.
   */
  const html = useMemo(() => {
    if (!initialDriver || !normalizedPassenger) {
      return "";
    }

    console.log(
      "🗺️ Génération HTML DriverRideMap : UNE FOIS POUR LA COURSE"
    );

    return generateMapHtml({
      mode: "tracking",
      passengerLocation: normalizedPassenger,
      driverLocation: initialDriver,
      destinationLocation: normalizedDestination,
      drivers: [initialDriver],
    });
  }, [
    initialDriver,
    normalizedPassenger,
    normalizedDestination,
  ]);

  if (
    !normalizedDriver ||
    !normalizedPassenger ||
    !initialDriver ||
    !html
  ) {
    return <View style={styles.loading} />;
  }

  return (
    <View style={styles.container}>
      <LeafletMap
        html={html}
        mode="tracking"
        drivers={[normalizedDriver]}
        onDriverSelected={onDriverSelected}
        onRouteInfo={onRouteInfo}
        showDriverRoute={showDriverRoute}
        driverArrived={driverArrived}
        startDestinationRoute={startDestinationRoute}
        destinationLocation={normalizedDestination}
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
