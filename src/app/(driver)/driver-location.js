
import * as Location from "expo-location";

import {
  collection,
  getDocs,
  query,
  updateDoc,
  where
} from "firebase/firestore";
import { useEffect, useRef } from "react";
import { db } from "../../../firebase/config";

import { getUser } from "../../storage/userStorage";

export default function DriverLocation() {
  const driverDocRef = useRef(null);
  useEffect(() => {
    let subscription;

    const start = async () => {
      subscription = await startTracking();
    };

    start();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);
  const startTracking = async () => {

    try {
      const user = await getUser();

      if (!user?.phone) {
        return;
      }

      const q = query(
        collection(db, "users"),
        where("phone", "==", user.phone)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return;
      }

      driverDocRef.current = snapshot.docs[0].ref;
      if (!user?.phone) {
        return;
      }

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        console.log(
          "Permission refusée"
        );
        return;
      }

      return await Location.watchPositionAsync(
        {
          accuracy:
            Location.Accuracy.High,

          timeInterval: 5000,

          distanceInterval: 10,
        },
        async (location) => {
          try {
            if (!driverDocRef.current) {
              return;
            }

            await updateDoc(driverDocRef.current, {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              lastLocationUpdate: new Date().toISOString(),
            });


            const rideQuery = query(
              collection(db, "rides"),
              where("driverPhone", "==", user.phone)
            );

            const rideSnapshot = await getDocs(rideQuery);
            rideSnapshot.forEach(async (rideDoc) => {
              const ride = rideDoc.data();

              if (
                ride.status === "accepted" ||
                ride.status === "started"
              ) {
                await updateDoc(rideDoc.ref, {
                  driverLatitude: location.coords.latitude,
                  driverLongitude: location.coords.longitude,
                });
              }
            });
            console.log(
              "Position envoyée :",
              location.coords.latitude,
              location.coords.longitude
            );
          } catch (error) {
            console.log(error);
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  };

  return null;
}