import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Asset } from "expo-asset";
import * as Location from "expo-location";
import { router } from "expo-router";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../../firebase/config";

import { createRide } from "../../../services/rideService";
import LeafletMap from "../../components/LeafletMap";
import { getUser } from "../../storage/userStorage";
import { calculateFare } from "../../utils/fareCalculator";
import generateLeafletHtml from "../../utils/leafletHtml";
export default function DriversMap() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [drivers, setDrivers] = useState([]);

  const [html, setHtml] = useState("");

  const [currentLocation, setCurrentLocation] =
    useState(null);

  const [selectedDriver, setSelectedDriver] = useState(null);

  const [routeInfo, setRouteInfo] = useState(null);
  const [icons, setIcons] = useState({
    car: "",
    moto: "",
    passenger: "",
  });

  useEffect(() => {

    const loadUser = async () => {

      const user = await getUser();

      setCurrentUser(user);

    };

    loadUser();

  }, []);
  useEffect(() => {
    let unsubscribe;

    const init = async () => {
      unsubscribe = await loadMap();
    };

    init();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (
      !currentLocation ||
      !icons.car ||
      !icons.moto ||
      !icons.passenger
    ) {
      return;
    }

    const htmlContent =
      generateLeafletHtml(
        currentLocation,
        icons
      );

    setHtml(htmlContent);
  }, [

    currentLocation,
    icons,
  ]);

  const loadMap = async () => {
    try {
      // Chargement des icônes

      const carAsset = Asset.fromModule(
        require("../../../assets/map-icons/car.png")
      );

      const motoAsset = Asset.fromModule(
        require("../../../assets/map-icons/moto.png")
      );

      const passengerAsset =
        Asset.fromModule(
          require("../../../assets/map-icons/passenger.png")
        );

      await Promise.all([
        carAsset.downloadAsync(),
        motoAsset.downloadAsync(),
        passengerAsset.downloadAsync(),
      ]);

      setIcons({
        car: carAsset.uri,
        moto: motoAsset.uri,
        passenger: passengerAsset.uri,
      });

      // Permission GPS

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLoading(false);
        return;
      }

      // Position actuelle

      const location =
        await Location.getCurrentPositionAsync(
          {}
        );

      setCurrentLocation({
        latitude:
          location.coords.latitude,

        longitude:
          location.coords.longitude,
      });

      // Conducteurs disponibles

      const q = query(
        collection(db, "users"),
        where("role", "==", "driver"),
        where("isOnline", "==", true)
      );

      const unsubscribe =
        onSnapshot(
          q,
          (snapshot) => {
            const list = [];

            snapshot.forEach(
              (doc) => {
                const data =
                  doc.data();

                if (
                  data.latitude &&
                  data.longitude
                ) {
                  list.push({
                    docId: doc.id,
                    ...data,
                    iconCar: carAsset.uri,
                    iconMoto: motoAsset.uri,
                  });
                }
              }
            );

            setDrivers(list);
          }
        );

      return unsubscribe;
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.loading}
      >
        <ActivityIndicator
          size="large"
          color="#0B6E4F"
        />
      </SafeAreaView>
    );
  }

  const handleOrderRide = async () => {

    if (!currentUser) {
      console.log("Utilisateur non connecté");
      return;
    }

    if (!selectedDriver || !routeInfo) {
      return;
    }

    try {

      const price = calculateFare(
        routeInfo.distance
      );
console.log("Conducteur sélectionné :", selectedDriver);
console.log("Passager :", currentUser);
      const rideId = await createRide({

        passenger: currentUser,

        driver: selectedDriver,

        pickup: currentLocation,

        // Destination à ajouter plus tard
        destination: null,

        distance: routeInfo.distance,

        duration: routeInfo.duration,

        price,

      });

      console.log("Course créée :", rideId);
      router.push({
        pathname: "/(passenger)/ride-status",
        params: {
          rideId,
        },
      });

    } catch (error) {

      console.log("Erreur :", error);

    }

  };
  return (
    <SafeAreaView
      style={styles.container}
    >
      <LeafletMap
        html={html}
        drivers={drivers}
        onDriverSelected={setSelectedDriver}
        onRouteInfo={setRouteInfo}
      />
      {selectedDriver && routeInfo && (

        <View style={styles.driverCard}>

          <Text style={styles.driverName}>
            {selectedDriver.name}
          </Text>

          <Text>
            ⭐ {selectedDriver.averageRating || 5}/5
          </Text>

          <Text>
            🚗 {selectedDriver.vehicleBrand}
          </Text>

          <Text>
            🎨 {selectedDriver.vehicleColor}
          </Text>

          <Text>
            📍 {(routeInfo.distance / 1000).toFixed(1)} km
          </Text>

          <Text>
            ⏱ {Math.ceil(routeInfo.duration / 60)} min
          </Text>

          <TouchableOpacity
            style={styles.orderButton}
            onPress={handleOrderRide}
          >

            <Text style={styles.orderText}>
              COMMANDER
            </Text>

          </TouchableOpacity>

        </View>

      )}
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#FFF",
    },

    loading: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#FFF",
    },
    driverCard: {

      position: "absolute",

      bottom: 20,

      left: 15,

      right: 15,

      backgroundColor: "#FFF",

      borderRadius: 18,

      padding: 18,

      elevation: 8,

    },

    name: {

      fontSize: 18,

      fontWeight: "bold",

      marginBottom: 10,

    },
    driverCard: {

      position: "absolute",

      left: 15,

      right: 15,

      bottom: 20,

      backgroundColor: "#FFF",

      borderRadius: 20,

      padding: 18,

      elevation: 8,

    },

    driverName: {

      fontSize: 20,

      fontWeight: "bold",

      marginBottom: 10,

    },

    orderButton: {

      marginTop: 20,

      backgroundColor: "#0B6E4F",

      borderRadius: 12,

      paddingVertical: 14,

      alignItems: "center",

    },

    orderText: {

      color: "#FFF",

      fontWeight: "bold",

      fontSize: 17,

    },
  });