import { useEffect, useState } from "react";

import MapView, {
    Marker,
} from "react-native-maps";

import {
    ActivityIndicator,
    SafeAreaView,
    StyleSheet,
    Text,
} from "react-native";

import {
    collection,
    getDocs,
} from "firebase/firestore";

import { db } from "../../../firebase/config";

export default function DriversMap() {
  const [drivers, setDrivers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadDrivers();
  }, []);

const loadDrivers = async () => {
  try {
    const querySnapshot =
      await getDocs(
        collection(db, "users")
      );

    const driversList = [];

    querySnapshot.forEach(
      (document) => {
        const data =
          document.data();

        console.log(
          "USER =",
          data
        );

        if (
          data.role === "driver" &&
          data.isOnline &&
          data.latitude &&
          data.longitude
        ) {
          driversList.push({
            id: document.id,
            ...data,
          });
        }
      }
    );

    console.log(
      "CONDUCTEURS TROUVES =",
      driversList.length
    );

    setDrivers(driversList);

  } catch (error) {
    console.log(error);
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return (
      <SafeAreaView
        style={styles.center}
      >
        <ActivityIndicator
          size="large"
          color="#0B6E4F"
        />
      </SafeAreaView>
    );
  }
console.log("DRIVERS =", drivers);
  return (
    <SafeAreaView
      style={styles.container}
    >
      <Text style={styles.title}>
        Conducteurs proches
      </Text>

      <MapView
        style={styles.map}
       initialRegion={{
  latitude:
    drivers[0]?.latitude ||
    12.6392,

  longitude:
    drivers[0]?.longitude ||
    -8.0029,

  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
}}
      >
        {drivers.map(
          (driver) => (
            <Marker
              key={driver.id}
              coordinate={{
                latitude:
                  driver.latitude,
                longitude:
                  driver.longitude,
              }}
              title={
                driver.name
              }
              description={
                driver.vehicleType ||
                "Conducteur"
              }
            />
          )
        )}
      </MapView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#FFFFFF",
    },

    center: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#0B6E4F",
      padding: 15,
    },

    map: {
      flex: 1,
    },
  });