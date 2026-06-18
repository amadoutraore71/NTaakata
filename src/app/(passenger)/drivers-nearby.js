import {
    useEffect,
    useState,
} from "react";

import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    collection,
    getDocs,
} from "firebase/firestore";

import { db } from "../../../firebase/config";

export default function DriversNearby() {
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

      const availableDrivers = [];

      querySnapshot.forEach(
        (document) => {
          const data =
            document.data();

          if (
            data.role === "driver" &&
            data.subscriptionActive === true &&
            data.isOnline === true
            ) {
            availableDrivers.push({
              id: document.id,
              ...data,
            });
          }
        }
      );

      setDrivers(
        availableDrivers
      );

      setLoading(false);

    } catch (error) {
      console.log(error);
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

  return (
    <SafeAreaView
      style={styles.container}
    >
      <Text style={styles.title}>
        Conducteurs disponibles
      </Text>

      <ScrollView>
        {drivers.length === 0 ? (
          <Text style={styles.empty}>
            Aucun conducteur disponible
          </Text>
        ) : (
          drivers.map(
            (driver) => (
              <View
                key={driver.id}
                style={styles.card}
              >
                <Text
                  style={styles.name}
                >
                  👤 {driver.name}
                </Text>

                <Text
                  style={styles.info}
                >
                  📞 {driver.phone}
                </Text>
                <Text style={styles.info}>
                🟢 Disponible
                </Text>
                <Text
                  style={styles.info}
                >
                  🚗 {
                    driver.vehicleType ||
                    "Non défini"
                  }
                </Text>

                <Text
                  style={styles.info}
                >
                  📍 Latitude :
                  {" "}
                  {driver.latitude ||
                    "N/A"}
                </Text>

                <Text
                  style={styles.info}
                >
                  📍 Longitude :
                  {" "}
                  {driver.longitude ||
                    "N/A"}
                </Text>
              </View>
            )
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#FFFFFF",
      padding: 20,
      marginTop: 80,
    },

    center: {
      flex: 1,
      justifyContent:
        "center",
      alignItems: "center",
    },

    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#0B6E4F",
      marginBottom: 20,
    },

    empty: {
      textAlign: "center",
      marginTop: 50,
      color: "#666",
    },

    card: {
      backgroundColor:
        "#F8F8F8",
      borderRadius: 15,
      padding: 15,
      marginBottom: 15,
    },

    name: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
    },

    info: {
      color: "#555",
      marginBottom: 5,
    },
  });