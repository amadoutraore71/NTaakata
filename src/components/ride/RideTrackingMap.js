import { Asset } from "expo-asset";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import generateMapHtml from "../../utils/generateMapHtml";
import LeafletMap from "../LeafletMap";

async function loadAsset(moduleRef) {
  const asset = Asset.fromModule(moduleRef);
  await asset.downloadAsync();
  return asset.localUri || asset.uri;
}

export default function RideTrackingMap({
  mode = "drivers",
  passengerLocation,
  driverLocation = null,
  drivers = [],
  searchingDriver = null,
  onDriverSelected,
  onRouteInfo,
  showDriverRoute = false,
  startDestinationRoute = false,
  destinationLocation = null,
}) {
  const [icons, setIcons] = useState(null);
  const [initialDriver, setInitialDriver] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [car, moto, passenger] = await Promise.all([
          loadAsset(require("../../../assets/map-icons/car.png")),
          loadAsset(require("../../../assets/map-icons/moto.png")),
          loadAsset(require("../../../assets/map-icons/passenger.png")),
        ]);
        if (!cancelled) setIcons({ car, moto, passenger });
      } catch (error) {
        console.error("❌ Chargement des icônes Leaflet impossible :", error);
        if (!cancelled) setIcons({ car: "", moto: "", passenger: "" });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const safePassenger = useMemo(() => {
    if (!passengerLocation) return null;
    const latitude = Number(passengerLocation.latitude);
    const longitude = Number(passengerLocation.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { ...passengerLocation, latitude, longitude };
  }, [passengerLocation]);

  const safeDrivers = useMemo(() => (Array.isArray(drivers) ? drivers : [])
    .map((d) => ({
      ...d,
      latitude: Number(d?.latitude),
      longitude: Number(d?.longitude),
      id: d?.id ?? d?.docId ?? d?.userId,
    }))
    .filter((d) => Number.isFinite(d.latitude) && Number.isFinite(d.longitude)), [drivers]);

  const liveDriver = useMemo(() => {
    if (!driverLocation) return safeDrivers[0] || null;
    const latitude = Number(driverLocation.latitude);
    const longitude = Number(driverLocation.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return safeDrivers[0] || null;
    return {
      ...driverLocation,
      latitude,
      longitude,
      id: driverLocation.id ?? driverLocation.docId ?? driverLocation.userId,
    };
  }, [driverLocation, safeDrivers]);

  // Une seule position de départ est utilisée pour fabriquer le HTML.
  // Les nouvelles positions passent ensuite uniquement par le pont WebView.
  useEffect(() => {
    if (mode !== "tracking" || !liveDriver) return;
    if (!initialDriver) {
      setInitialDriver(liveDriver);
    }
  }, [mode, liveDriver, initialDriver]);

  useEffect(() => {
    if (mode !== "tracking") setInitialDriver(null);
  }, [mode]);

  const html = useMemo(() => {
    if (!icons || !safePassenger) return null;
    if (mode === "tracking" && !initialDriver) return null;

    return generateMapHtml({
      mode,
      passengerLocation: safePassenger,
      driverLocation: initialDriver,
      drivers: mode === "tracking" ? [initialDriver] : safeDrivers,
      searchingDriver: mode === "drivers" ? searchingDriver : null,
      icons,
      destinationLocation,
    });
  }, [icons, safePassenger, mode, initialDriver, safeDrivers, searchingDriver, destinationLocation]);

  if (!safePassenger) return <View style={styles.empty} />;

  return (
    <View style={styles.container}>
      <LeafletMap
        html={html}
        mode={mode}
        drivers={mode === "tracking" ? (liveDriver ? [liveDriver] : []) : safeDrivers}
        searchingDriver={mode === "drivers" ? searchingDriver : null}
        onDriverSelected={onDriverSelected}
        onRouteInfo={onRouteInfo}
        showDriverRoute={showDriverRoute}
        startDestinationRoute={startDestinationRoute}
        destinationLocation={destinationLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 220, width: "100%" },
  empty: { flex: 1, minHeight: 220, width: "100%", backgroundColor: "#dfe7e3" },
});
