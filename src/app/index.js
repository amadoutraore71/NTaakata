import { router } from "expo-router";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { db } from "../../firebase/config";
import { getUser } from ".././storage/userStorage";

export default function Index() {

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const user = await getUser();

      console.log("Utilisateur enregistré :", user);

      if (!user) {
        router.replace("/role-selection");
        return;
      }

      if (user.role === "passenger") {

        const rideQuery = query(
          collection(db, "rides"),
          where("passengerPhone", "==", user.phone)
        );

        const snapshot = await getDocs(rideQuery);

        let activeRide = null;

        snapshot.forEach((doc) => {

          const ride = {
            id: doc.id,
            ...doc.data(),
          };

          if (
            ride.status === "pending" ||
            ride.status === "accepted" ||
            ride.status === "started"
          ) {
            activeRide = ride;
          }

        });

        if (activeRide) {

          router.replace({
            pathname: "/(passenger)/ride-status",
            params: {
              rideId: activeRide.id,
            },
          });

        } else {

          router.replace("/(passenger)/home");

        }

        return;
      }

      if (user.role === "driver") {
        router.replace("/(driver)/dashboard");
        return;
      }

      if (user.role === "admin") {
        router.replace("/(admin)/dashboard");
        return;
      }
    } catch (error) {
      console.log(error)
      router.replace("/(auth)/login");
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator
        size="large"
        color="#0B6E4F"
      />
    </View>
  );
}