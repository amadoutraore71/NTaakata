import { useEffect, useState } from "react";

import { router, useLocalSearchParams } from "expo-router";
import {
    Alert,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { findAvailableDrivers } from "../../../services/matching/driverSelectionService";
import AppHeader from "../../components/AppHeader";
import DriverInfoCard from "../../components/ride/DriverInfoCard";
import RideTrackingMap from "../../components/ride/RideTrackingMap";

import { getUser } from "../../storage/userStorage";

import { createRide } from "../../../services/rideService";
export default function DriversMap() {
    const {
        pickup,
        destination,
        vehicleType,
        distance,
        price,
        pickupLat,
        pickupLng,
        destinationLat,
        destinationLng,
    } = useLocalSearchParams();
    console.log("📦 Params :", {
        pickup,
        destination,
        vehicleType,
        distance,
        price,
        pickupLat,
        pickupLng,
        destinationLat,
        destinationLng,
    });
    console.log("🗺 DRIVERS MAP OUVERT");
    const [passengerLocation, setPassengerLocation] = useState(null);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [drivers, setDrivers] = useState([]);
    useEffect(() => {

        async function initialize() {

            try {

                const user = await getUser();
// On utilise en priorité les coordonnées reçues depuis l'écran précédent
if (pickupLat && pickupLng) {
    const location = {
        latitude: Number(pickupLat),
        longitude: Number(pickupLng),
    };

    setPassengerLocation(location);

    console.log("📍 Position depuis les paramètres :", location);
    return;
}

// Sinon on tente la position enregistrée
const storedLocation = getCurrentLocation();

if (storedLocation?.coords) {
    const location = {
        latitude: storedLocation.coords.latitude,
        longitude: storedLocation.coords.longitude,
    };

    setPassengerLocation(location);

    console.log("📍 Position depuis le stockage :", location);
    return;
}

Alert.alert(
    "Position",
    "Impossible de récupérer votre position actuelle."
);
            } catch (error) {

                console.log("❌ DriversMap GPS ERROR");

                console.log(error);

                console.log(error?.message);

                console.log(error?.stack);

            }

        }

        initialize();

    }, []);

    useEffect(() => {
        async function loadDrivers() {

            if (!passengerLocation) {
                return;
            }

            try {
                const list = await findAvailableDrivers(
                    passengerLocation,
                    vehicleType
                );

                setDrivers(list);

                console.log(
                    "🚕 Conducteurs trouvés :",
                    list.length
                );

            } catch (error) {
                console.log(error);
            }
        }

        loadDrivers();

    }, [passengerLocation, vehicleType]);
    const handleOrder = async () => {
        try {
            if (!selectedDriver) {
                Alert.alert(
                    "Conducteur",
                    "Veuillez sélectionner un conducteur."
                );
                return;
            }

            const passenger = await getUser();

            if (!passenger) {
                Alert.alert(
                    "Erreur",
                    "Impossible de récupérer les informations du passager."
                );
                return;
            }

            const rideId = await createRide({
                passenger,
                driver: selectedDriver,

                pickup: {
                    latitude: Number(pickupLat),
                    longitude: Number(pickupLng),
                    address: pickup,
                },

                destination: {
                    latitude: Number(destinationLat),
                    longitude: Number(destinationLng),
                    address: destination,
                },

                distance: Number(distance),
                duration: Math.round((Number(distance) / 40) * 60),
                price: Number(price),
                vehicleType,
            });

            router.replace({
                pathname: "/(passenger)/RideStatus",
                params: { rideId },
            });

        } catch (error) {
            console.log(error);

            Alert.alert(
                "Erreur",
                "Impossible d'envoyer la demande."
            );
        }
    };
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.tripCard}>

                <Text style={styles.tripTitle}>
                    Votre trajet
                </Text>

                <Text style={styles.tripText}>
                    📍 {pickup}
                </Text>

                <Text style={styles.tripText}>
                    🎯 {destination}
                </Text>

                <Text style={styles.tripText}>
                    🚕 {vehicleType}
                </Text>

                <Text style={styles.tripText}>
                    📏 {distance} km
                </Text>

                <Text style={styles.tripPrice}>
                    💰 {price} FCFA
                </Text>

            </View>
            {passengerLocation && (

                <RideTrackingMap
                    mode="drivers"
                    passengerLocation={passengerLocation}
                    drivers={drivers}
                    onDriverSelected={setSelectedDriver}
                />

            )}

            <View style={styles.overlay}>
                <AppHeader
                    title="Conducteurs autour de vous"
                    profileRoute="/(passenger)/profile"
                />
            </View>
            {selectedDriver && (
                <View style={styles.bottomPanel}>
                    <DriverInfoCard
                        driver={selectedDriver}
                        price={price}
                        onOrder={handleOrder}
                    />
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#FFF",
    },
    bottomPanel: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
    },
    overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    tripCard: {
        backgroundColor: "#fff",
        margin: 12,
        padding: 15,
        borderRadius: 16,
        elevation: 3,
    },

    tripTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },

    tripText: {
        fontSize: 15,
        marginBottom: 5,
    },

    tripPrice: {
        fontSize: 18,
        color: "#0B6E4F",
        fontWeight: "bold",
        marginTop: 8,
    },

});