import * as Location from "expo-location";

import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { useEffect, useRef } from "react";

import { db } from "../../../firebase/config";
import { getUser } from "../../storage/userStorage";

export default function DriverLocation() {
  const driverDocRef = useRef(null);
  const driverIdRef = useRef(null);

  useEffect(() => {
    let subscription = null;
    let cancelled = false;

    const start = async () => {
      subscription = await startTracking();

      if (cancelled && subscription) {
        subscription.remove();
      }
    };

    start();

    return () => {
      cancelled = true;

      if (subscription) {
        subscription.remove();
      }

      console.log("📍 Suivi GPS conducteur arrêté");
    };
  }, []);

  const startTracking = async () => {
    try {
      // =====================================================
      // 1. RÉCUPÉRER LE CONDUCTEUR CONNECTÉ
      // =====================================================

      const user = await getUser();

      if (!user?.userId) {
        console.log(
          "❌ Aucun userId trouvé pour le conducteur"
        );
        return null;
      }

      driverIdRef.current = user.userId;

      // =====================================================
      // 2. RÉFÉRENCE DIRECTE DU CONDUCTEUR
      // =====================================================

      driverDocRef.current = doc(
        db,
        "users",
        user.userId
      );

      console.log(
        "📍 Suivi GPS pour le conducteur :",
        user.userId
      );

      // =====================================================
      // 3. PERMISSION GPS
      // =====================================================

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        console.log(
          "❌ Permission GPS refusée"
        );

        return null;
      }

      console.log(
        "✅ Permission GPS accordée"
      );

      // =====================================================
      // 4. SURVEILLANCE DE LA POSITION
      // =====================================================

      const locationSubscription =
        await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,

            timeInterval: 5000,

            distanceInterval: 10,
          },

          async (location) => {
            try {
              if (!driverDocRef.current) {
                return;
              }

              const latitude =
                location.coords.latitude;

              const longitude =
                location.coords.longitude;

              // =================================================
              // 5. METTRE À JOUR LA POSITION DU CONDUCTEUR
              // =================================================

              await updateDoc(
                driverDocRef.current,
                {
                  latitude,
                  longitude,
                  lastLocationUpdate:
                    new Date().toISOString(),
                }
              );

              console.log(
                "📍 Position envoyée :",
                latitude,
                longitude
              );

              // =================================================
              // 6. METTRE À JOUR LA COURSE DU CONDUCTEUR
              // =================================================

              const rideQuery = query(
                collection(db, "rides"),
                where(
                  "driverId",
                  "==",
                  user.userId
                )
              );

              const rideSnapshot =
                await getDocs(rideQuery);

              if (rideSnapshot.empty) {
                return;
              }

              const activeStatuses = [
                "driver_assigned",
                "driver_arriving",
                "driver_arrived",
                "started",
              ];

              for (const rideDoc of rideSnapshot.docs) {
                const ride =
                  rideDoc.data();

                if (
                  activeStatuses.includes(
                    ride.status
                  )
                ) {
                  await updateDoc(
                    rideDoc.ref,
                    {
                      driverLatitude:
                        latitude,

                      driverLongitude:
                        longitude,
                    }
                  );

                  console.log(
                    "🚗 Position course mise à jour :",
                    rideDoc.id
                  );
                }
              }
            } catch (error) {
              console.log(
                "❌ Erreur mise à jour position :",
                error
              );
            }
          }
        );

      return locationSubscription;
    } catch (error) {
      console.log(
        "❌ Erreur démarrage suivi GPS :",
        error
      );

      return null;
    }
  };

  return null;
}