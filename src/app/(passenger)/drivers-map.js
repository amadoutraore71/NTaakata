import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
} from "react-native";

import { Asset } from "expo-asset";
import * as Location from "expo-location";

import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../../firebase/config";

import LeafletMap from "../../components/LeafletMap";
import generateLeafletHtml from "../../utils/leafletHtml";

export default function DriversMap() {
  const [loading, setLoading] = useState(true);

  const [drivers, setDrivers] = useState([]);

  const [html, setHtml] = useState("");

  const [currentLocation, setCurrentLocation] =
    useState(null);

  const [icons, setIcons] = useState({
    car: "",
    moto: "",
    passenger: "",
  });

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
                    id: doc.id,
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

  return (
    <SafeAreaView
      style={styles.container}
    >
      <LeafletMap
        html={html}
        drivers={drivers}
      />
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
  });