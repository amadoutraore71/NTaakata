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
  TouchableOpacity,
  View,
} from "react-native";

import {
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../../firebase/config";
import { getUser } from "../../storage/userStorage";

export default function MyRides() {
  const [rides, setRides] =
    useState([]);

  const [totalRevenue, setTotalRevenue] =
    useState(0);

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      const driver =
        await getUser();

      if (!driver) return;

      const querySnapshot =
        await getDocs(
          collection(db, "rides")
        );

      const myRides = [];

      let revenue = 0;

      querySnapshot.forEach(
        (document) => {
          const data =
            document.data();

          if (
            data.driverPhone ===
            driver.phone
          ) {
            myRides.push({
              id: document.id,
              ...data,
            });

            if (
              data.status ===
              "completed"
            ) {
              revenue += Number(
                data.price || 0
              );
            }
          }
        }
      );

      setRides(myRides);
      setTotalRevenue(revenue);

    } catch (error) {
      console.log(error);
    }
  };

  const startRide = async (
    rideId
  ) => {
    try {
      await updateDoc(
        doc(db, "rides", rideId),
        {
          status: "in_progress",
        }
      );

      Alert.alert(
        "Succès",
        "Course démarrée"
      );

      loadRides();

    } catch (error) {
      console.log(error);
    }
  };

  const completeRide =
    async (rideId) => {
      try {
        await updateDoc(
          doc(
            db,
            "rides",
            rideId
          ),
          {
            status:
              "completed",
          }
        );

        Alert.alert(
          "Succès",
          "Course terminée"
        );

        loadRides();

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

      <View
        style={styles.revenueCard}
      >
        <Text
          style={
            styles.revenueLabel
          }
        >
          Revenus totaux
        </Text>

        <Text
          style={styles.revenue}
        >
          {totalRevenue}
          {" "}
          FCFA
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
      >
        {rides.length === 0 ? (
          <Text
            style={styles.empty}
          >
            Aucune course
          </Text>
        ) : (
          rides.map((ride) => (
            <View
              key={ride.id}
              style={styles.card}
            >
              <Text style={styles.route}>
                📅 {
                  ride.createdAt
                    ? new Date(
                      ride.createdAt
                    ).toLocaleDateString()
                    : "-"
                }
              </Text>
              <Text
                style={styles.route}
              >
                👤 {
                  ride.passengerName ||
                  "Passager"
                }
              </Text>

              <Text
                style={styles.route}
              >
                📞 {
                  ride.passengerPhone ||
                  "Non disponible"
                }
              </Text>
              <Text
                style={
                  styles.route
                }
              >
                📍{" "}
                {ride.pickup}
              </Text>

              <Text
                style={
                  styles.route
                }
              >
                🎯{" "}
                {
                  ride.destination
                }
              </Text>

              <Text
                style={
                  styles.price
                }
              >
                💰{" "}
                {ride.price}
                {" "}
                FCFA
              </Text>
              <Text
                style={styles.route}
              >
                📅 {
                  ride.createdAt
                    ? new Date(
                      ride.createdAt
                    ).toLocaleDateString()
                    : "-"
                }
              </Text>

              <Text
                style={
                  styles.status
                }
              >
                🚕 Statut :
                {" "}
                {
                  ride.status
                }
              </Text>

              {ride.status ===
                "accepted" && (
                  <TouchableOpacity
                    style={
                      styles.startButton
                    }
                    onPress={() =>
                      startRide(
                        ride.id
                      )
                    }
                  >
                    <Text
                      style={
                        styles.buttonText
                      }
                    >
                      Démarrer la course
                    </Text>
                  </TouchableOpacity>
                )}

              {ride.status ===
                "in_progress" && (
                  <TouchableOpacity
                    style={
                      styles.completeButton
                    }
                    onPress={() =>
                      completeRide(
                        ride.id
                      )
                    }
                  >
                    <Text
                      style={
                        styles.buttonText
                      }
                    >
                      Terminer la course
                    </Text>
                  </TouchableOpacity>
                )}

              {ride.status ===
                "completed" && (
                  <View
                    style={
                      styles.completedBadge
                    }
                  >
                    <Text
                      style={
                        styles.completedText
                      }
                    >
                      ✅ Course
                      terminée
                    </Text>
                  </View>
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

    revenueCard: {
      backgroundColor:
        "#FFF3CD",
      borderRadius: 15,
      padding: 20,
      marginBottom: 20,
    },

    revenueLabel: {
      color: "#666",
    },

    revenue: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#0B6E4F",
      marginTop: 10,
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
      marginTop: 10,
      fontWeight: "bold",
      color: "#0B6E4F",
    },

    status: {
      marginTop: 8,
      color: "#666",
      fontWeight: "600",
    },

    startButton: {
      backgroundColor:
        "#F4C300",
      padding: 12,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 15,
    },

    completeButton: {
      backgroundColor:
        "#0B6E4F",
      padding: 12,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 15,
    },

    buttonText: {
      color: "#FFFFFF",
      fontWeight: "bold",
      fontSize: 16,
    },

    completedBadge: {
      marginTop: 15,
      backgroundColor:
        "#D4EDDA",
      padding: 10,
      borderRadius: 10,
    },

    completedText: {
      color: "#155724",
      fontWeight: "bold",
      textAlign: "center",
    },
  });