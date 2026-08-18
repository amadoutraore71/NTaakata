import { useLocalSearchParams } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
} from "react-native";

import { db } from "../../../firebase/config";

import DriverActionButtons from "../../components/driver/DriverActionButtons";
import DriverRideInfoCard from "../../components/driver/DriverRideInfoCard";
import DriverRideMap from "../../components/driver/DriverRideMap";
import DriverStatusBadge from "../../components/driver/DriverStatusBadge";

export default function RideStatus() {

    const { rideId } = useLocalSearchParams();

    const [ride, setRide] = useState(null);

    const [distance, setDistance] = useState(null);

    const [duration, setDuration] = useState(null);

    const [driverLocation, setDriverLocation] =
        useState(null);

    const [passengerLocation, setPassengerLocation] =
        useState(null);
    const tripType =
        ride?.status === "started"
            ? "destination"
            : "pickup";
    useEffect(() => {

        if (!rideId) return;

        const unsubscribe = onSnapshot(

            doc(db, "rides", rideId),

            (snapshot) => {

                if (!snapshot.exists()) return;

                const data = snapshot.data();

                setRide(data);

                setPassengerLocation(data.pickup);

            }

        );

        return unsubscribe;

    }, [rideId]);

    const handleRouteInfo = ({
        distance,
        duration,
    }) => {

        setDistance(distance);

        setDuration(duration);

    };

    if (!ride) {

        return null;

    }

    return (

        <SafeAreaView style={styles.container}>

            <DriverStatusBadge
                ride={ride}
                distance={distance}
            />

            <DriverRideMap
                driverLocation={driverLocation}
                passengerLocation={passengerLocation}
                destinationLocation={ride?.destination}
                tripType={tripType}
                onRouteInfo={handleRouteInfo}
            />

            <ScrollView>

                <DriverRideInfoCard
                    ride={ride}
                    distance={distance}
                    duration={duration}
                />

                <DriverActionButtons
                    ride={ride}
                    distance={distance}
                />

            </ScrollView>

        </SafeAreaView>

    );

}

const styles = StyleSheet.create({

    container: {

        flex: 1,

        backgroundColor: "#F7F7F7",

    },

});