import { useEffect } from "react";

import * as Location from "expo-location";

import {
  collection,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../../../firebase/config";

import { getUser } from "../../storage/userStorage";

export default function DriverLocation() {
  useEffect(() => {
    startTracking();
  }, []);

  const startTracking = async () => {
    try {
      const user =
        await getUser();

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

      await Location.watchPositionAsync(
        {
          accuracy:
            Location.Accuracy.High,

          timeInterval: 5000,

          distanceInterval: 10,
        },
        async (location) => {
          try {
            const q = query(
              collection(
                db,
                "users"
              ),
              where(
                "phone",
                "==",
                user.phone
              )
            );

            const snapshot =
              await getDocs(q);

            if (
              snapshot.empty
            ) {
              return;
            }

            const driverDoc =
              snapshot.docs[0];
            await updateDoc(
              driverDoc.ref,
              {
                latitude:
                  location.coords.latitude,

                longitude:
                  location.coords.longitude,

                isOnline: true,

                lastLocationUpdate:
                  new Date().toISOString(),
              }
            );
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