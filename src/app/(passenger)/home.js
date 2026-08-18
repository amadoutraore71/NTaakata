import {
  router,
} from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomNavigation from "../../components/BottomNavigation";
import DestinationSearch from "../../components/location/DestinationSearch";
import PrimaryButton from "../../components/PrimaryButton";
import {
  getUser,
} from "../../storage/userStorage";

import { getActiveRide } from "../../../services/getActiveRide";

import usePassengerLocation from "../../hooks/usePassengerLocation";
import useRideRequest from "../../hooks/useRideRequest";
import {
  calculateRoute,
} from "../../utils/routeCalculator";
import FareSummary from "./FareSummary";
import PassengerHeader from "./PassengerHeader";
import VehicleSelector from "./VehicleSelector";
export default function PassengerHome() {
  const {
    pickup,
    currentLocation,
    loadingLocation,
    stopLocation,
  } = usePassengerLocation();
  const [estimatedDistance, setEstimatedDistance] = useState(0);
  const [user, setUser] = useState(null);
  const [destination, setDestination] = useState(null);
  const [vehicleType, setVehicleType] =
    useState("moto");
  const { requestRide } =
    useRideRequest();

  useEffect(() => {

    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await getUser();

    if (!currentUser) return;

    setUser(currentUser);

    const activeRide = await getActiveRide(currentUser.userId);

    if (activeRide) {
      router.replace({
        pathname: "/(passenger)/RideStatus",
        params: {
          rideId: activeRide.id,
        },
      });

      return;
    }

  };

  const handleDestinationSelect = async (place) => {
      if (!currentLocation?.coords) {
    console.log("❌ currentLocation =", currentLocation);
    return;
  }
    setDestination(place);

    const route = await calculateRoute(
      {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      },
      {
        latitude: place.latitude,
        longitude: place.longitude,
      }
    );

    if (!route) return;

    setEstimatedDistance(route.distance);
  };

  const handleRideRequest = () =>

    requestRide({

      user,

      pickup,

      destination,

      currentLocation,

      vehicleType,

      stopLocation,

    });

  return (
    <SafeAreaView
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingTop: 60,
          paddingBottom: 30,
        }}
        showsVerticalScrollIndicator={false}
      >
        <PassengerHeader
          user={user}
        />

        <View style={styles.card}>
          <View style={styles.section}>

            <Text style={styles.sectionTitle}>
              🎯 Où allez-vous ?
            </Text>

            <DestinationSearch
              userId={user?.userId}
              currentLocation={
                currentLocation && {
                  latitude: currentLocation.coords.latitude,
                  longitude: currentLocation.coords.longitude,
                }
              }
              onSelect={handleDestinationSelect}
            />

          </View>

          <VehicleSelector
            vehicleType={vehicleType}
            setVehicleType={setVehicleType}
            estimatedDistance={estimatedDistance}
          />
          <FareSummary
            distance={estimatedDistance}
            vehicleType={vehicleType}
          />
          <PrimaryButton
            title="Commander"
            onPress={handleRideRequest}
            disabled={!destination || loadingLocation}
          />

        </View>
      </ScrollView>
      <BottomNavigation active="home" />
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#F5F7FA",
    },
    vehicleContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "stretch",
      marginTop: 10,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#0B6E4F",
    },

    card: {
      backgroundColor:
        "#F8F8F8",
      borderRadius: 15,
      padding: 20,
    },

    profileIcon: {
      fontSize: 28,
      color: "#FFF",
    },

    section: {
      marginBottom: 20,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 10,
    },


    destinationInput: {
      backgroundColor: "#FFF",
      borderRadius: 18,
      height: 58,
      paddingHorizontal: 18,
      fontSize: 17,
      elevation: 4,
    },

  });