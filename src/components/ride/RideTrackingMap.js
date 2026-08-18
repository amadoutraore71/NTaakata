import { Asset } from "expo-asset";
import {
    useEffect,
    useMemo,
    useState,
} from "react";

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
}) {
    const [icons, setIcons] =
        useState(null);

    // ======================================================
    // Charger les icônes
    // ======================================================

    useEffect(() => {
        async function loadIcons() {
            try {
                const car =
                    Asset.fromModule(
                        require(
                            "../../../assets/map-icons/car.png"
                        )
                    );

                const moto =
                    Asset.fromModule(
                        require(
                            "../../../assets/map-icons/moto.png"
                        )
                    );

                const passenger =
                    Asset.fromModule(
                        require(
                            "../../../assets/map-icons/passenger.png"
                        )
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

    // ======================================================
    // Générer le HTML
    // ======================================================

    const html = useMemo(() => {
        if (
            !icons ||
            !passengerLocation
        ) {
            return "";
        }

        return generateMapHtml({
            mode,
            passengerLocation,
            driverLocation,
            icons,
        });
    }, [
        icons,
        mode,
        passengerLocation,
        driverLocation,
    ]);

    // ======================================================
    // Conducteurs à afficher
    // ======================================================

    const driversToDisplay =
        mode === "tracking" &&
        driverLocation
            ? [
                  {
                      ...driverLocation,

                      id:
                          driverLocation.docId ||
                          driverLocation.userId,
                  },
              ]
            : drivers;

    // ======================================================
    // Carte pas encore prête
    // ======================================================

    if (!html) {
        return null;
    }

    // ======================================================
    // Carte
    // ======================================================

    return (
        <LeafletMap
            html={html}
            mode={mode}
            drivers={driversToDisplay}
            searchingDriver={
                searchingDriver
            }
            onDriverSelected={
                onDriverSelected
            }
            onRouteInfo={
                onRouteInfo
            }
        />
    );
}