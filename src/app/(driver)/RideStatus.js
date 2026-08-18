import { router, useLocalSearchParams } from "expo-router";

import {
    doc,
    onSnapshot,
} from "firebase/firestore";

import * as Linking from "expo-linking";

import { useEffect, useState } from "react";

import {
    Alert,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { db } from "../../../firebase/config";

import { getUser } from "../../storage/userStorage";

import DriverActionButtons from "../../components/driver/DriverActionButtons";
import DriverRideInfoCard from "../../components/driver/DriverRideInfoCard";
import DriverRideMap from "../../components/driver/DriverRideMap";
import DriverStatusBadge from "../../components/driver/DriverStatusBadge";

import AppHeader from "../../components/AppHeader";

import {
    finishRide,
    markDriverArrived,
    startRide,
} from "../../../services/driverRideService";

export default function RideStatus() {

  const { rideId } = useLocalSearchParams();

  const [ride, setRide] = useState(null);

  const [driver, setDriver] = useState(null);

  const [driverLocation, setDriverLocation] =
    useState(null);

  const [passengerLocation, setPassengerLocation] =
    useState(null);

  const [remainingDistance, setRemainingDistance] =
    useState(null);

  const [remainingDuration, setRemainingDuration] =
    useState(null);

  /*
  ------------------------------------
  Charger le conducteur connecté
  ------------------------------------
  */

  useEffect(() => {

    async function loadDriver() {

      const user = await getUser();

      if (!user) return;

      setDriver(user);

    }

    loadDriver();

  }, []);

  /*
  ------------------------------------
  Ecoute de la course
  ------------------------------------
  */

  useEffect(() => {

    if (!rideId) return;

    const unsubscribe = onSnapshot(

      doc(db, "rides", rideId),

      (snapshot) => {

        if (!snapshot.exists()) return;

        const data = {

          id: snapshot.id,

          ...snapshot.data(),

        };

        setRide(data);

        if (data.pickup) {

          setPassengerLocation({

            latitude: data.pickup.latitude,

            longitude: data.pickup.longitude,

            address: data.pickup.address,

          });

        }

      }

    );

    return unsubscribe;

  }, [rideId]);

  /*
  ------------------------------------
  Ecoute position conducteur
  ------------------------------------
  */

  useEffect(() => {

    if (!driver?.userId) return;

    const unsubscribe = onSnapshot(

      doc(db, "users", driver.userId),

      (snapshot) => {

        if (!snapshot.exists()) return;

        const data = snapshot.data();

        setDriverLocation({

          latitude: data.latitude,

          longitude: data.longitude,

          vehicleType: data.vehicleType,

        });

      }

    );

    return unsubscribe;

  }, [driver]);

  /*
  ------------------------------------
  Type de trajet
  ------------------------------------
  */

  const tripType =

    ride?.status === "started"

      ? "destination"

      : "pickup";

  /*
  ------------------------------------
  Route Leaflet
  ------------------------------------
  */

  const handleRouteInfo = (route) => {

    setRemainingDistance(route.distance);

    setRemainingDuration(route.duration);

  };

  /*
  ------------------------------------
  Téléphone
  ------------------------------------
  */

  const handleCallPassenger = async () => {

    if (!ride?.passengerPhone) return;

    await Linking.openURL(

      `tel:${ride.passengerPhone}`

    );

  };

  /*
  ------------------------------------
  Message
  ------------------------------------
  */

  const handleMessagePassenger = () => {

    Alert.alert(

      "Message",

      "Le chat sera ajouté dans la prochaine étape."

    );

  };

  /*
  ------------------------------------
  Arrivé
  ------------------------------------
  */

  const handleArrived = async () => {

    await markDriverArrived(

      ride.id

    );

  };

  /*
  ------------------------------------
  Démarrer
  ------------------------------------
  */

  const handleStartRide = async () => {

    await startRide(

      ride.id

    );

  };

  /*
  ------------------------------------
  Terminer
  ------------------------------------
  */

  const handleFinishRide = async () => {

    await finishRide({

      rideId: ride.id,

      driverId: driver.userId,

    });

    router.replace(

      "/(driver)/dashboard"

    );

  };
    if (
    !ride ||
    !driverLocation ||
    !passengerLocation
  ) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>

      <AppHeader
        title="Course en cours"
        profileRoute="/(driver)/profile"
      />

      <DriverStatusBadge
        ride={ride}
        distance={remainingDistance}
      />

      <View style={styles.mapContainer}>
        <DriverRideMap
          driverLocation={driverLocation}
          passengerLocation={passengerLocation}
          destinationLocation={ride.destination}
          tripType={tripType}
          onRouteInfo={handleRouteInfo}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
      >

        <DriverRideInfoCard
          ride={ride}
          distance={remainingDistance}
          duration={remainingDuration}
        />

        <DriverActionButtons
          ride={ride}
          distance={remainingDistance}
          onCallPassenger={handleCallPassenger}
          onMessagePassenger={
            handleMessagePassenger
          }
          onArrived={handleArrived}
          onStartRide={handleStartRide}
          onFinishRide={handleFinishRide}
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

  mapContainer: {
    height: 330,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 22,
    overflow: "hidden",
    elevation: 8,
    backgroundColor: "#FFF",
  },

});