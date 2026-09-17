import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";

import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { useEffect, useRef, useState } from "react";

import DriverRideMap from "../../components/driver/DriverRideMap";

import { db } from "../../../firebase/config";
import { stopRideRequestSound } from "../../../services/soundService";
import { getUser } from "../../storage/userStorage";

import {
  startDriverMovement,
  stopDriverMovement,
} from "../../../src/services/simulation/driverMovementService";

export default function RideStatus() {
  const router = useRouter();
  const { rideId } = useLocalSearchParams();

  const [ride, setRide] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [passengerLocation, setPassengerLocation] = useState(null);
  const [driver, setDriver] = useState(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const movementRunningRef = useRef(false);
  const movementStartedRef = useRef(false);

  // ============================================================
  // ARRÊTER LA SONNERIE
  // ============================================================

  useEffect(() => {
    stopRideRequestSound();

    console.log("🔇 Sonnerie arrêtée à l'ouverture de RideStatus");

    return () => {
      stopRideRequestSound();
    };
  }, []);

  // ============================================================
  // RÉCUPÉRER LE CONDUCTEUR
  // ============================================================

  useEffect(() => {
    let mounted = true;

    const loadDriver = async () => {
      try {
        const currentDriver = await getUser();

        if (!mounted) return;

        if (!currentDriver?.userId) {
          console.log("❌ Aucun conducteur connecté");
          return;
        }

        console.log("🚗 Conducteur connecté :", currentDriver);

        setDriver(currentDriver);

        const latitude = Number(currentDriver.latitude);
        const longitude = Number(currentDriver.longitude);

        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
          setDriverLocation({
            latitude,
            longitude,
          });
        }
      } catch (error) {
        console.error("❌ Erreur récupération conducteur :", error);
      }
    };

    loadDriver();

    return () => {
      mounted = false;
    };
  }, []);

  // ============================================================
  // ÉCOUTE DE LA COURSE
  // ============================================================

  useEffect(() => {
    if (!rideId) {
      console.log("❌ rideId absent");
      setLoading(false);
      return;
    }

    console.log("👂 Écoute de la course :", rideId);

    const rideRef = doc(db, "rides", rideId);

    const unsubscribe = onSnapshot(
      rideRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          console.log("❌ Course introuvable :", rideId);

          setRide(null);
          setLoading(false);

          return;
        }

        const data = {
          id: snapshot.id,
          ...snapshot.data(),
        };

        console.log("🚗 RIDE REÇUE DANS RIDESTATUS :", data);

        setRide(data);

        // ======================================================
        // POSITION DU PASSAGER
        // ======================================================

        if (
          data.pickup &&
          typeof data.pickup.latitude === "number" &&
          typeof data.pickup.longitude === "number"
        ) {
          setPassengerLocation({
            latitude: data.pickup.latitude,
            longitude: data.pickup.longitude,
          });
        }

        setLoading(false);
      },
      (error) => {
        console.error("❌ Erreur écoute course :", error);

        setLoading(false);
      },
    );

    return () => {
      unsubscribe();

      console.log("🛑 Écoute de la course arrêtée :", rideId);
    };
  }, [rideId]);

  // ============================================================
  // ÉCOUTE POSITION CONDUCTEUR
  // ============================================================

  useEffect(() => {
    if (!driver?.userId) return;

    console.log("📍 Écoute position conducteur :", driver.userId);

    const driverRef = doc(db, "users", driver.userId);

    const unsubscribe = onSnapshot(
      driverRef,
      (snapshot) => {
        if (!snapshot.exists()) return;

        const data = snapshot.data();

        if (
          typeof data.latitude !== "number" ||
          typeof data.longitude !== "number"
        ) {
          return;
        }

        const location = {
          latitude: data.latitude,
          longitude: data.longitude,
        };

        console.log("📍 Position conducteur :", location);

        setDriverLocation(location);
      },
      (error) => {
        console.error("❌ Erreur écoute position conducteur :", error);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [driver?.userId]);

  // ============================================================
  // APPELER LE PASSAGER
  // ============================================================

  const handleCallPassenger = async () => {
    const phone = ride?.passengerPhone;

    if (!phone) {
      console.log("❌ Numéro du passager indisponible");
      return;
    }

    try {
      console.log("📞 Appel du passager :", phone);

      await Linking.openURL(`tel:${phone}`);
    } catch (error) {
      console.error("❌ Impossible de lancer l'appel :", error);
    }
  };
  // ============================================================
  // TERMINER LA COURSE
  // ============================================================

  const handleFinishRide = () => {
    if (!ride?.id) {
      console.log("❌ Impossible de terminer : ride.id absent");
      return;
    }

    if (ride.status !== "started") {
      console.log("⚠️ Impossible de terminer : la course n'est pas en cours");
      return;
    }

    if (actionLoading) return;

    Alert.alert(
      "Terminer la course",
      "Voulez-vous vraiment terminer cette course ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Terminer",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);

              console.log("🏁 Confirmation de fin de course :", ride.id);

              // Arrêter le déplacement
              stopDriverMovement(driver?.userId);

              // Terminer réellement la course
              await updateDoc(doc(db, "rides", ride.id), {
                status: "completed",
                completedAt: serverTimestamp(),
              });

              console.log("✅ Course terminée avec succès");

              router.replace("/(driver)/dashboard");
            } catch (error) {
              console.error("❌ Erreur fin de course :", error);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };
  // ============================================================
  // MESSAGE PASSAGER
  // ============================================================

  const handleMessagePassenger = () => {
    if (!ride?.passengerId) {
      console.log("❌ passengerId indisponible");
      return;
    }

    console.log("💬 Ouverture du chat avec le passager :", ride.passengerId);

    router.push({
      pathname: "/(driver)/ChatScreen",
      params: {
        rideId: ride.id,
        passengerId: ride.passengerId,
        passengerName: ride.passengerName || "Passager",
      },
    });
  };

  // ============================================================
  // DÉMARRER LA COURSE
  // ============================================================

  const handleMainRideAction = async () => {
    if (!ride?.id || !driver?.userId) {
      console.log(
        "⚠️ Impossible d'effectuer l'action : course ou conducteur introuvable",
      );
      return;
    }

    if (actionLoading) {
      return;
    }

    try {
      setActionLoading(true);

      // ==================================================
      // 1. ALLER VERS LE PASSAGER
      // ==================================================

      if (ride.status === "driver_assigned") {
        console.log("🚗 Départ vers le passager");

        const startLocation = {
          latitude: Number(driver.latitude),
          longitude: Number(driver.longitude),
        };

        const pickupLocation = {
          latitude: Number(ride.pickup?.latitude),
          longitude: Number(ride.pickup?.longitude),
        };

        console.log("📍 Position départ conducteur :", startLocation);

        console.log("🎯 Position du passager :", pickupLocation);

        // ------------------------------------------------
        // Vérification des coordonnées
        // ------------------------------------------------

        if (
          !Number.isFinite(startLocation.latitude) ||
          !Number.isFinite(startLocation.longitude) ||
          !Number.isFinite(pickupLocation.latitude) ||
          !Number.isFinite(pickupLocation.longitude)
        ) {
          console.error("❌ Coordonnées invalides pour le déplacement :", {
            startLocation,
            pickupLocation,
          });

          return;
        }

        // ------------------------------------------------
        // Passage en mode "conducteur en route"
        // ------------------------------------------------

        await updateDoc(doc(db, "rides", ride.id), {
          status: "driver_arriving",
        });

        console.log("✅ Statut driver_arriving enregistré");

        // ------------------------------------------------
        // DÉPLACEMENT RÉEL DU CONDUCTEUR
        // ------------------------------------------------

        console.log("🚗 Lancement startDriverMovement()");

       startDriverMovement({ 
          driverId: driver.userId,

          startLocation,

          endLocation: pickupLocation,

          onFinished: async () => {
            try {
              console.log("📍 CONDUCTEUR ARRIVÉ CHEZ LE PASSAGER");

              await updateDoc(doc(db, "rides", ride.id), {
                status: "driver_arrived",
              });

              console.log("✅ Statut driver_arrived enregistré");
            } catch (error) {
              console.error("❌ Erreur changement driver_arrived :", error);
            }
          },
        });

        console.log("🚗 startDriverMovement() terminé");

        return;
      }

      // ==================================================
      // 2. DÉMARRER LA COURSE
      // ==================================================

      if (ride.status === "driver_arrived") {
        console.log("▶️ Démarrage de la course");

        const driverRef = doc(db, "users", driver.userId);

        const driverSnapshot = await getDoc(driverRef);

        if (!driverSnapshot.exists()) {
          throw new Error("Conducteur introuvable dans Firestore");
        }

        const currentDriver = driverSnapshot.data();

        const startLocation = {
          latitude: Number(currentDriver.latitude),
          longitude: Number(currentDriver.longitude),
        };

        const destinationLocation = {
          latitude: Number(ride.destination?.latitude),
          longitude: Number(ride.destination?.longitude),
        };

        console.log(
          "📍 Position actuelle du conducteur pour démarrer la course :",
          startLocation,
        );

        console.log("🎯 Destination de la course :", destinationLocation);

        // ------------------------------------------------
        // Vérification des coordonnées
        // ------------------------------------------------

        if (
          !Number.isFinite(startLocation.latitude) ||
          !Number.isFinite(startLocation.longitude) ||
          !Number.isFinite(destinationLocation.latitude) ||
          !Number.isFinite(destinationLocation.longitude)
        ) {
          console.error("❌ Coordonnées invalides pour la course :", {
            startLocation,
            destinationLocation,
          });

          return;
        }

        // ------------------------------------------------
        // Démarrage officiel de la course
        // ------------------------------------------------

        await updateDoc(doc(db, "rides", ride.id), {
          status: "started",
          startedAt: serverTimestamp(),
        });

        console.log("✅ Statut started enregistré");

        // ------------------------------------------------
        // DÉPLACEMENT CONDUCTEUR → DESTINATION
        // ------------------------------------------------

        console.log("🚗 Lancement déplacement vers destination");

       startDriverMovement({
  driverId: driver.userId,

  startLocation,

  endLocation: destinationLocation,

  onFinished: async () => {
    console.log(
      "📍 CONDUCTEUR ARRIVÉ À DESTINATION"
    );

    console.log(
      "ℹ️ Le statut reste started."
    );

    console.log(
      "ℹ️ Le conducteur doit cliquer sur Terminer la course."
    );
  },
});

        console.log("🚗 Déplacement vers destination terminé");

        return;
      }

      // ==================================================
      // 3. TERMINER LA COURSE
      // ==================================================

      if (ride.status === "started") {
        console.log("🏁 Demande de fin de course");

        // Afficher la confirmation avant de terminer
        handleFinishRide();

        return;
      }

      // ==================================================
      // STATUT INATTENDU
      // ==================================================

      console.log("⚠️ Aucun traitement pour le statut :", ride.status);
    } catch (error) {
      console.error("❌ Erreur action course :", error);
    } finally {
      setActionLoading(false);
    }
  };
  const handleCancelRide = async () => {
    if (!ride?.id) return;
    if (actionLoading) return;

    try {
      setActionLoading(true);

      console.log("❌ Annulation de la course :", ride.id);

      // Arrêter immédiatement le déplacement du conducteur
      stopDriverMovement(driver?.userId);

      // Annuler la course dans Firestore
      await updateDoc(doc(db, "rides", ride.id), {
        status: "cancelled",
        cancelledAt: serverTimestamp(),
      });

      console.log("✅ Course annulée");

      router.back();
    } catch (error) {
      console.error("❌ Erreur annulation course :", error);
    } finally {
      setActionLoading(false);
    }
  };
  // ============================================================
  // TEXTE DU STATUT
  // ============================================================

  let statusText = "";

  if (ride?.status === "driver_arrived") {
    statusText = "Vous êtes arrivé chez le passager";
  }

  // ============================================================
  // TEXTE BOUTON
  // ============================================================

  let actionText = "";

  if (ride?.status === "driver_arrived") {
    actionText = "Démarrer la course";
  }

  // ============================================================
  // CHARGEMENT
  // ============================================================

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement de la course...</Text>
        </View>
      </View>
    );
  }

  // ============================================================
  // COURSE INTROUVABLE
  // ============================================================

  if (!ride) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Course introuvable</Text>
        </View>
      </View>
    );
  }

  // ============================================================
  // AFFICHAGE
  // ============================================================

  return (
    <View style={styles.container}>
      {/* ======================================================
        CARTE PLEIN ÉCRAN
    ====================================================== */}

      <View style={styles.fullScreenMap}>
        {driverLocation && passengerLocation ? (
          <DriverRideMap
            driverLocation={driverLocation}
            passengerLocation={passengerLocation}
            destinationLocation={ride.destination ?? null}
            driverId={driver?.userId}
            tripType={ride.status === "started" ? "destination" : "pickup"}
            showDriverRoute={
              ride.status === "driver_assigned" ||
              ride.status === "driver_arriving"
            }
            startDriverRoute={ride.status === "driver_arriving"}
            startDestinationRoute={ride.status === "started"}
          />
        ) : (
          <View style={styles.mapLoading}>
            <Text style={styles.mapLoadingText}>Chargement de la carte...</Text>
          </View>
        )}
      </View>

      {/* ======================================================
        STATUT AU-DESSUS DE LA CARTE
    ====================================================== */}

      {statusText !== "" && (
        <View style={styles.statusBar}>
          <View style={styles.statusDot} />

          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      )}

      {/* ======================================================
        APPEL / MESSAGE
    ====================================================== */}

      {ride.status !== "started" &&
        ride.status !== "completed" &&
        ride.status !== "cancelled" && (
          <View style={styles.contactButtons}>
            <Pressable
              style={({ pressed }) => [
                styles.contactButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleCallPassenger}
            >
              <Text style={styles.contactIcon}>📞</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.contactButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleMessagePassenger}
            >
              <Text style={styles.contactIcon}>💬</Text>
            </Pressable>
          </View>
        )}

      {/* ======================================================
    BOUTONS DU BAS
====================================================== */}
      {ride.status !== "cancelled" && ride.status !== "completed" && (
        <View style={styles.bottomButtons}>
          {/* BOUTON ANNULER : uniquement avant le démarrage de la course */}
          {ride.status !== "started" && (
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleCancelRide}
              disabled={actionLoading}
            >
              <Text style={styles.cancelButtonText}>Annuler la demande</Text>
            </Pressable>
          )}

          {/* BOUTON PRINCIPAL */}
          <Pressable
            style={({ pressed }) => [
              styles.mainButton,
              ride.status === "driver_arriving" && styles.disabledButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleMainRideAction}
            disabled={actionLoading || ride.status === "driver_arriving"}
          >
            <Text style={styles.mainButtonText}>
              {ride.status === "driver_assigned" && "Aller vers le passager"}

              {ride.status === "driver_arriving" &&
                "En route vers le passager..."}

              {ride.status === "driver_arrived" && "Démarrer la course"}

              {ride.status === "started" && "Terminer la course"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ================================================================
// CALCUL DISTANCE
// ================================================================

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;

  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// ================================================================
// STYLES
// ================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    fontSize: 16,
    color: "#777",
  },

  errorText: {
    fontSize: 17,
    color: "#D32F2F",
    fontWeight: "600",
  },

  statusBar: {
    position: "absolute",
    top: 95,
    left: 16,
    right: 16,

    height: 44,
    borderRadius: 14,

    backgroundColor: "#FFF8DD",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    zIndex: 20,
    elevation: 20,
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F2B600",
    marginRight: 8,
  },

  statusText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#E3A800",
  },
  fullScreenMap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#EDEDED",
  },

  mapLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EDEDED",
  },

  mapLoadingText: {
    color: "#777",
    fontSize: 15,
  },

  passengerMiniCard: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 145,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    elevation: 8,
  },

  passengerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E8F5EF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  passengerAvatarText: {
    fontSize: 21,
  },

  passengerNameContainer: {
    flex: 1,
  },

  passengerLabel: {
    fontSize: 11,
    color: "#888",
  },

  passengerName: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
  },

  bottomButtons: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 35,

    flexDirection: "row",
    gap: 10,

    zIndex: 30,
    elevation: 30,
  },

  cancelButton: {
    flex: 1,

    height: 58,

    borderRadius: 18,

    backgroundColor: "#FFFFFF",

    borderWidth: 2,
    borderColor: "#E53935",

    justifyContent: "center",
    alignItems: "center",

    elevation: 8,
  },

  cancelButtonText: {
    color: "#E53935",

    fontSize: 14,

    fontWeight: "800",

    textAlign: "center",
  },

  arrivingButton: {
    flex: 1,

    height: 58,

    borderRadius: 18,

    backgroundColor: "#087F5B",

    justifyContent: "center",
    alignItems: "center",

    elevation: 8,
  },

  mainButton: {
    flex: 1,

    height: 58,

    borderRadius: 18,

    backgroundColor: "#087F5B",

    justifyContent: "center",
    alignItems: "center",

    elevation: 8,
  },

  mainButtonText: {
    color: "#FFFFFF",

    fontSize: 14,

    fontWeight: "800",

    textAlign: "center",
  },

  disabledButton: {
    opacity: 0.55,
  },

  buttonPressed: {
    opacity: 0.72,
  },

  contactButtons: {
    position: "absolute",

    right: 18,
    bottom: 105,

    flexDirection: "column",

    gap: 12,

    zIndex: 30,
    elevation: 30,
  },

  contactButton: {
    width: 58,
    height: 58,

    borderRadius: 29,

    backgroundColor: "#FFFFFF",

    justifyContent: "center",
    alignItems: "center",

    elevation: 8,
  },

  contactIcon: {
    fontSize: 23,
  },
});
