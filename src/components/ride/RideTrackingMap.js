import { Asset } from "expo-asset";
import { useEffect, useMemo, useState } from "react";

import generateMapHtml from "../../utils/generateMapHtml";
import LeafletMap from "../LeafletMap";

export default function RideTrackingMap({
  mode = "drivers",

  passengerLocation,

  driverLocation = null,

  drivers = [],

  searchingDriver = null,

  onDriverSelected,

  onRouteInfo,

  // ==================================================
  // AFFICHER LA LIGNE CONDUCTEUR → PASSAGER
  // ==================================================
  showDriverRoute = false,

  // ==================================================
  // CONTRÔLE MANUEL DU TRAJET CONDUCTEUR → PASSAGER
  // ==================================================
  startDriverRoute = false,

  // ==================================================
  // CONTRÔLE MANUEL DU TRAJET CONDUCTEUR → DESTINATION
  // ==================================================
  startDestinationRoute = false,
}) {
  const [icons, setIcons] = useState(null);

  // ==================================================
  // CHARGEMENT DES ICÔNES
  // ==================================================

  useEffect(() => {
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

        setIcons({
          car: car.uri,
          moto: moto.uri,
          passenger: passenger.uri,
        });
      } catch (error) {
        console.error(
          "❌ Erreur chargement icônes :",
          error
        );
      }
    }

    loadIcons();
  }, []);

  // ==================================================
  // GÉNÉRATION DU HTML LEAFLET
  // ==================================================

  const html = useMemo(() => {
    if (!icons || !passengerLocation) {
      return "";
    }

    return generateMapHtml({
      mode,
      passengerLocation,
      icons,
    });
  }, [
    icons,
    mode,
    passengerLocation,
  ]);

  // ==================================================
  // CONDUCTEURS À AFFICHER
  // ==================================================

  const driversToDisplay = useMemo(() => {
    // --------------------------------------------------
    // MODE TRACKING
    // --------------------------------------------------
    if (mode === "tracking" && driverLocation) {
      return [
        {
          ...driverLocation,

          id:
            driverLocation.docId ??
            driverLocation.userId ??
            driverLocation.id,
        },
      ];
    }

    // --------------------------------------------------
    // MODE CONDUCTEURS PROCHES
    // --------------------------------------------------
    return drivers;
  }, [
    mode,
    driverLocation,
    drivers,
  ]);

  // ==================================================
  // IMPORTANT :
  //
  // AUCUN DÉMARRAGE AUTOMATIQUE ICI
  //
  // Le bouton DeveloperPanel décide quand le trajet
  // conducteur → passager doit commencer.
  // ==================================================

  if (!html) {
    return null;
  }

  return (
    <LeafletMap
      html={html}
      mode={mode}
      drivers={driversToDisplay}
      searchingDriver={searchingDriver}
      onDriverSelected={onDriverSelected}
      onRouteInfo={onRouteInfo}

      // ------------------------------------------------
      // TRAJET CONDUCTEUR → PASSAGER
      // ------------------------------------------------
      startDriverRoute={startDriverRoute}

      // ------------------------------------------------
      // TRAJET CONDUCTEUR → DESTINATION
      // ------------------------------------------------
      startDestinationRoute={startDestinationRoute}
      showDriverRoute={showDriverRoute}
    />
  );
}