import {
  useEffect,
  useState,
} from "react";

import {
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
import { getUser } from "../../storage/userStorage";

export default function History() {
  const [rides, setRides] =
    useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const user =
        await getUser();

      if (!user) return;

      const querySnapshot =
        await getDocs(
          collection(db, "rides")
        );

      const history = [];

      querySnapshot.forEach(
        (document) => {
          const data =
            document.data();

          if (
            data.passengerPhone ===
            user.phone
          ) {
            history.push({
              id: document.id,
              ...data,
            });
          }
        }
      );

      setRides(history.reverse());
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
    >
      <Text style={styles.title}>
        Mes Courses
      </Text>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
      >
        {rides.length === 0 ? (
          <Text style={styles.empty}>
            Aucune course
          </Text>
        ) : (
          rides.map((ride) => (
            <View
              key={ride.id}
              style={styles.card}
            >
              <Text style={styles.route}>
                📍 {ride.pickup}
              </Text>

              <Text style={styles.route}>
                🎯 {ride.destination}
              </Text>

              <Text style={styles.price}>
                💰 {ride.price} FCFA
              </Text>

              <Text style={styles.status}>
                🚕 {ride.status}
              </Text>

              {ride.driverPhone && (
                <Text
                  style={
                    styles.driver
                  }
                >
                  📞 Chauffeur :
                  {" "}
                  {ride.driverPhone}
                </Text>
              )}
            </View>
          ))
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

    title: {
      fontSize: 30,
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

    route: {
      fontSize: 16,
      marginBottom: 5,
    },

    price: {
      fontWeight: "bold",
      color: "#0B6E4F",
      marginTop: 10,
    },

    status: {
      marginTop: 5,
      color: "#666",
      fontWeight: "bold",
    },

    driver: {
      marginTop: 8,
      color: "#333",
    },
  });