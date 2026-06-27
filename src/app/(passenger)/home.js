import * as Location from "expo-location";
import {
  router,
} from "expo-router";
import {
  addDoc,
  collection,
} from "firebase/firestore";
import { getDistance } from "geolib";
import {
  useEffect,
  useState,
} from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { db } from "../../../firebase/config";
import BottomNavigation from "../../components/BottomNavigation";
import LocationCard from "../../components/LocationCard";
import PrimaryButton from "../../components/PrimaryButton";
import {
  getUser,
} from "../../storage/userStorage";
import { getCoordinatesFromAddress } from "../../utils/geocoding";

import VehicleCard from "../../components/VehicleCard";
import {
  calculateFare,
} from "../../utils/fareCalculator";
export default function PassengerHome() {
  const [pickup, setPickup] =
    useState("");
  const [estimatedDistance, setEstimatedDistance] = useState(0);
  const [user, setUser] = useState(null);
  const [
    destination,
    setDestination,
  ] = useState("");
  const [vehicleType, setVehicleType] =
    useState("moto");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  useEffect(() => {
    getCurrentLocation();
    loadUser();
  }, []);
  useEffect(() => {

    calculateEstimate();

  }, [
    destination,
    vehicleType,
    currentLocation,
  ]);
  const loadUser = async () => {
    try {
      const currentUser = await getUser();

      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const getCurrentLocation = async () => {
    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission refusée",
          "Veuillez autoriser l'accès à votre position."
        );
        return;
      }

      const location =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      setCurrentLocation(location);
      const address =
        await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

      if (address.length > 0) {

        const place = address[0];

        setPickup(
          `${place.street || ""} ${place.district || place.subregion || ""}`
        );

      }
      console.log(
        "Position actuelle :",
        location.coords
      );

    } catch (error) {
      console.log(error);

      Alert.alert(
        "Erreur",
        "Impossible de récupérer votre position."
      );
    } finally {
      setLoadingLocation(false);
    }
  };
  const calculateEstimate = async (
    selectedVehicle = vehicleType
  ) => {

    if (!destination || !currentLocation) {
      setEstimatedDistance(0);
      return;
    }

    try {

      const destinationLocation =
        await getCoordinatesFromAddress(
          destination
        );

      if (!destinationLocation) {
        return;
      }

      const distanceInMeters =
        getDistance(
          {
            latitude:
              currentLocation.coords.latitude,
            longitude:
              currentLocation.coords.longitude,
          },
          {
            latitude:
              destinationLocation.latitude,
            longitude:
              destinationLocation.longitude,
          }
        );

      const distance = Number(
        (distanceInMeters / 1000).toFixed(1)
      );

      setEstimatedDistance(distance);



    } catch (error) {

      console.log(error);

    }

  }
  const handleRideRequest =
    async () => {
      try {
        if (
          !pickup ||
          !destination
        ) {
          Alert.alert(
            "Erreur",
            "Veuillez renseigner le départ et la destination"
          );
          return;
        }


        const destinationLocation =
          await getCoordinatesFromAddress(destination);

        if (!destinationLocation) {
          Alert.alert(
            "Erreur",
            "Destination introuvable."
          );
          return;
        }
        if (!currentLocation) {
          Alert.alert(
            "Patientez",
            "La position GPS est en cours de récupération."
          );
          return;
        }
        const distanceInMeters = getDistance(
          {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          },
          {
            latitude: destinationLocation.latitude,
            longitude: destinationLocation.longitude,
          }
        );

        const distance =
          (distanceInMeters / 1000).toFixed(1);
        const price = calculateFare(
          Number(distance),
          vehicleType
        );

        const rideRef = await addDoc(
          collection(db, "rides"),
          {
            pickup,
            destination,
            pickupLatitude: currentLocation.coords.latitude,
            pickupLongitude: currentLocation.coords.longitude,
            destinationLatitude: destinationLocation.latitude,
            destinationLongitude: destinationLocation.longitude,
            vehicleType,
            passengerName: user?.name || "",
            passengerPhone: user?.phone || "",
            distance,
            price,
            status: "pending",
            createdAt: new Date().toISOString(),
          }
        );
        Alert.alert(
          "Succès",
          "Votre demande a été envoyée"
        );

        setDestination("");
        setEstimatedDistance(0);

        // Recharge la position actuelle
        getCurrentLocation();

        router.push({
          pathname: "/(passenger)/ride-status",
          params: {
            rideId: rideRef.id,
          },
        });

      } catch (error) {
        console.log(error);

        Alert.alert(
          "Erreur",
          "Impossible d'envoyer la demande"
        );
      }
    };
  ;
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
        <View style={styles.header}>

          <View>

            <Text style={styles.hello}>
              👋 Bonjour {user?.name || "Passager"}
            </Text>

          </View>

        </View>

        <View style={styles.card}>

          <View style={styles.section}>

            <Text style={styles.sectionTitle}>
              📍 Position actuelle
            </Text>

            <LocationCard location={pickup} />
          </View>

          <View style={styles.section}>

            <Text style={styles.sectionTitle}>
              🎯 Destination
            </Text>

            <TextInput
              style={styles.destinationInput}
              placeholder="Où allez-vous ?"
              value={destination}
              onChangeText={setDestination}
            />

          </View>

          <View style={styles.section}>

            <Text style={styles.sectionTitle}>
              🚕 Choisissez votre véhicule
            </Text>

            <View style={styles.vehicleContainer}>
              <VehicleCard
                icon="🏍️"
                title="Moto"
                badge="Économique"
                vehicleKey="moto"
                selectedVehicle={vehicleType}
                distance={estimatedDistance}
                onPress={() => setVehicleType("moto")}
              />
              <VehicleCard
                icon="🚗"
                title="Standard"
                badge="Populaire"
                vehicleKey="voiture"
                selectedVehicle={vehicleType}
                distance={estimatedDistance}
                onPress={() => setVehicleType("voiture")}
              />

              <VehicleCard
                icon="❄️"
                title="Premium"
                badge="Climatisée"
                vehicleKey="climatisee"
                selectedVehicle={vehicleType}
                distance={estimatedDistance}
                onPress={() => setVehicleType("climatisee")}
              />
            </View>

          </View>
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

    historyButton: {
      backgroundColor:
        "#0B6E4F",
      height: 55,
      borderRadius: 12,
      justifyContent:
        "center",
      alignItems:
        "center",
      marginTop: 15,
    },

    historyText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "bold",
    },


    hello: {
      fontSize: 18,
      color: "#777",
    },

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 25,
    },

    profileButton: {
      width: 55,
      height: 55,
      borderRadius: 30,
      backgroundColor: "#0B6E4F",
      justifyContent: "center",
      alignItems: "center",
    },

    badgeText: {
      fontSize: 12,
      fontWeight: "700",
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