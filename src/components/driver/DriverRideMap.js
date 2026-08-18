import { Asset } from "expo-asset";
import { useEffect, useState } from "react";

import generateLeafletHtml from "../../utils/generateRideTrackingHtml";
import LeafletMap from "../LeafletMap";

export default function DriverRideMap({
    driverLocation,
    passengerLocation,
    destinationLocation,
    tripType = "pickup",
    onRouteInfo,
}) {
    const [html, setHtml] = useState("");

    const [icons, setIcons] = useState({
        car: "",
        moto: "",
        passenger: "",
        destination: "",
    });

    useEffect(() => {
        loadIcons();
    }, []);

    useEffect(() => {
        const destination =
            tripType === "pickup"
                ? passengerLocation
                : destinationLocation;

        if (
            !driverLocation ||
            !destination ||
            !icons.car ||
            !icons.moto ||
            !icons.passenger ||
            !icons.destination
        ) {
            return;
        }


        const htmlContent = generateLeafletHtml({
            origin: driverLocation,
            destination,
            icons,
            tripType,
        });

        setHtml(htmlContent);
    }, [
        driverLocation,
        passengerLocation,
        destinationLocation,
        tripType,
        icons,
    ]);

    async function loadIcons() {
        const carAsset = Asset.fromModule(
            require("../../../assets/map-icons/car.png")
        );
        const destinationAsset = Asset.fromModule(
            require("../../../assets/map-icons/destination.png")
        );
        const motoAsset = Asset.fromModule(
            require("../../../assets/map-icons/moto.png")
        );

        const passengerAsset = Asset.fromModule(
            require("../../../assets/map-icons/passenger.png")
        );

        await Promise.all([
            carAsset.downloadAsync(),
            motoAsset.downloadAsync(),
            passengerAsset.downloadAsync(),
            destinationAsset.downloadAsync(),
        ]);

        setIcons({
            car: carAsset.uri,
            moto: motoAsset.uri,
            passenger: passengerAsset.uri,
            destination: destinationAsset.uri,
        });
    }

    if (!html) {
        return null;
    }

    return (
        <LeafletMap
            html={html}
            drivers={[
                {
                    ...driverLocation,
                    iconCar: icons.car,
                    iconMoto: icons.moto,
                },
            ]}
            driverLocation={driverLocation}
            onRouteInfo={onRouteInfo}
        />
    );
}