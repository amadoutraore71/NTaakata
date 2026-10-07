import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../firebase/config";
import { isSubscriptionValid } from "../subscriptionService";

// ======================================================
// CONFIGURATION
// ======================================================

export const DRIVER_SEARCH_RADII_KM = [5, 10, 15];

export const MAX_DRIVERS_ON_MAP = 10;

// ======================================================
// DISTANCE HAVERSINE
// ======================================================

export const calculateDistanceMeters = (
  pointA,
  pointB
) => {
  const lat1 = Number(pointA?.latitude);
  const lon1 = Number(pointA?.longitude);
  const lat2 = Number(pointB?.latitude);
  const lon2 = Number(pointB?.longitude);

  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2)
  ) {
    return Infinity;
  }

  const earthRadius = 6371000;

  const dLat =
    ((lat2 - lat1) * Math.PI) / 180;

  const dLon =
    ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
};

// ======================================================
// NORMALISER TYPE VÉHICULE
// ======================================================

const normalizeVehicleType = (value) => {
  if (!value) return null;

  return String(value)
    .trim()
    .toLowerCase();
};

// ======================================================
// DIAGNOSTIC D'UN CONDUCTEUR
// ======================================================

const diagnoseDriver = (
  driver,
  requestedVehicle = null
) => {
  const reasons = [];

  if (!driver) {
    reasons.push("driver absent");
    return reasons;
  }

  // ----------------------------------------------------
  // ROLE
  // ----------------------------------------------------

  if (driver.role !== "driver") {
    reasons.push(
      `role invalide (${String(driver.role)})`
    );
  }

  // ----------------------------------------------------
  // EN LIGNE
  // ----------------------------------------------------

  if (driver.isOnline !== true) {
    reasons.push(
      `isOnline=${String(driver.isOnline)}`
    );
  }

  // ----------------------------------------------------
  // DISPONIBILITÉ
  // ----------------------------------------------------

  if (
    driver.availability &&
    driver.availability !== "available"
  ) {
    reasons.push(
      `availability=${String(
        driver.availability
      )}`
    );
  }

  // ----------------------------------------------------
  // COURSE ACTUELLE
  // ----------------------------------------------------

  if (
    driver.currentRideId !== undefined &&
    driver.currentRideId !== null &&
    driver.currentRideId !== ""
  ) {
    reasons.push(
      `currentRideId=${String(
        driver.currentRideId
      )}`
    );
  }

  // ----------------------------------------------------
  // COORDONNÉES
  // ----------------------------------------------------

  const latitude = Number(
    driver.latitude
  );

  const longitude = Number(
    driver.longitude
  );

  if (!Number.isFinite(latitude)) {
    reasons.push(
      `latitude invalide (${String(
        driver.latitude
      )})`
    );
  }

  if (!Number.isFinite(longitude)) {
    reasons.push(
      `longitude invalide (${String(
        driver.longitude
      )})`
    );
  }

  // ----------------------------------------------------
  // ABONNEMENT
  // ----------------------------------------------------

  if (
    driver.subscriptionActive !== true
  ) {
    reasons.push(
      `subscriptionActive=${String(
        driver.subscriptionActive
      )}`
    );
  }

  if (
    !isSubscriptionValid(
      driver.subscriptionExpiresAt
    )
  ) {
    reasons.push(
      "abonnement expiré ou invalide"
    );
  }

  // ----------------------------------------------------
  // TYPE DE VÉHICULE
  // ----------------------------------------------------

  if (requestedVehicle) {
    const driverVehicle =
      normalizeVehicleType(
        driver.vehicleType
      );

    if (
      driverVehicle !== requestedVehicle
    ) {
      reasons.push(
        `vehicleType=${String(
          driver.vehicleType
        )}, demandé=${requestedVehicle}`
      );
    }
  }

  return reasons;
};

// ======================================================
// TROUVER LES CONDUCTEURS
// ======================================================

export const findAvailableDrivers = async (
  passengerLocation,
  vehicleType = null
) => {
  try {
    console.log(
      "\n=========================================="
    );

    console.log(
      "🚕 RECHERCHE DES CONDUCTEURS"
    );

    console.log(
      "=========================================="
    );

    // --------------------------------------------------
    // POSITION PASSAGER
    // --------------------------------------------------

    if (!passengerLocation) {
      console.log(
        "❌ Position passager absente"
      );

      return [];
    }

    const passengerLatitude =
      Number(
        passengerLocation.latitude
      );

    const passengerLongitude =
      Number(
        passengerLocation.longitude
      );

    console.log(
      "👤 Position passager :",
      {
        latitude:
          passengerLatitude,
        longitude:
          passengerLongitude,
      }
    );

    if (
      !Number.isFinite(
        passengerLatitude
      ) ||
      !Number.isFinite(
        passengerLongitude
      )
    ) {
      console.log(
        "❌ Coordonnées passager invalides"
      );

      return [];
    }

    // --------------------------------------------------
    // VÉHICULE DEMANDÉ
    // --------------------------------------------------

    const requestedVehicle =
      normalizeVehicleType(
        vehicleType
      );

    console.log(
      "🚗 Type de véhicule demandé :",
      requestedVehicle ??
        "TOUS"
    );

    // --------------------------------------------------
    // REQUÊTE FIRESTORE
    // --------------------------------------------------

    const driversQuery = query(
      collection(db, "users"),
      where(
        "role",
        "==",
        "driver"
      ),
      where(
        "isOnline",
        "==",
        true
      )
    );

    const snapshot =
      await getDocs(
        driversQuery
      );

    console.log(
      "📦 Conducteurs Firestore trouvés :",
      snapshot.size
    );

    if (snapshot.empty) {
      console.log(
        "⚠️ Firestore n'a trouvé aucun conducteur avec :"
      );

      console.log(
        '   role == "driver"'
      );

      console.log(
        "   isOnline == true"
      );

      return [];
    }

    // --------------------------------------------------
    // ANALYSE DES CONDUCTEURS
    // --------------------------------------------------

    const candidates = [];

    snapshot.forEach(
      (driverDoc) => {
        const data =
          driverDoc.data();

        const driver = {
          ...data,

          id:
            data.userId ??
            driverDoc.id,

          docId:
            driverDoc.id,

          userId:
            data.userId ??
            driverDoc.id,
        };

        console.log(
          "\n------------------------------------------"
        );

        console.log(
          "🔎 Conducteur trouvé :",
          driver.name ??
            driver.id
        );

        console.log(
          "📄 Données principales :",
          {
            id:
              driver.id,

            role:
              driver.role,

            isOnline:
              driver.isOnline,

            availability:
              driver.availability,

            currentRideId:
              driver.currentRideId,

            latitude:
              driver.latitude,

            longitude:
              driver.longitude,

            vehicleType:
              driver.vehicleType,

            subscriptionActive:
              driver.subscriptionActive,

            subscriptionExpiresAt:
              driver.subscriptionExpiresAt,
          }
        );

        // ------------------------------------------------
        // DIAGNOSTIC
        // ------------------------------------------------

        const rejectionReasons =
          diagnoseDriver(
            driver,
            requestedVehicle
          );

        if (
          rejectionReasons.length > 0
        ) {
          console.log(
            "❌ CONDUCTEUR REJETÉ :",
            rejectionReasons
          );

          return;
        }

        console.log(
          "✅ CONDUCTEUR ACCEPTÉ PAR LES FILTRES"
        );

        // ------------------------------------------------
        // DISTANCE
        // ------------------------------------------------

        const distanceMeters =
          calculateDistanceMeters(
            {
              latitude:
                passengerLatitude,

              longitude:
                passengerLongitude,
            },
            {
              latitude:
                driver.latitude,

              longitude:
                driver.longitude,
            }
          );

        if (
          !Number.isFinite(
            distanceMeters
          )
        ) {
          console.log(
            "❌ Distance invalide"
          );

          return;
        }

        const distanceKm =
          distanceMeters / 1000;

        console.log(
          "📏 Distance conducteur → passager :",
          `${distanceKm.toFixed(2)} km`
        );

        candidates.push({
          ...driver,

          latitude:
            Number(
              driver.latitude
            ),

          longitude:
            Number(
              driver.longitude
            ),

          distance:
            Math.round(
              distanceMeters
            ),

          distanceKm:
            Number(
              distanceKm.toFixed(2)
            ),
        });
      }
    );

    // --------------------------------------------------
    // TRI
    // --------------------------------------------------

    candidates.sort(
      (a, b) =>
        a.distance -
        b.distance
    );

    console.log(
      "\n=========================================="
    );

    console.log(
      "📍 CONDUCTEURS DISPONIBLES AVANT RAYON :",
      candidates.length
    );

    console.log(
      "=========================================="
    );

    candidates.forEach(
      (driver, index) => {
        console.log(
          `${index + 1}. 🚕 ${
            driver.name ??
            driver.id
          } → ${
            driver.distanceKm
          } km`
        );
      }
    );

    // --------------------------------------------------
    // RECHERCHE PROGRESSIVE
    // --------------------------------------------------

    let selected = [];

    for (
      const radiusKm of
      DRIVER_SEARCH_RADII_KM
    ) {
      selected =
        candidates.filter(
          (driver) =>
            driver.distance <=
            radiusKm * 1000
        );

      console.log(
        `📡 Rayon ${radiusKm} km → ${selected.length} conducteur(s)`
      );

      if (
        selected.length > 0
      ) {
        break;
      }
    }

    // --------------------------------------------------
    // AUCUN CONDUCTEUR
    // --------------------------------------------------

    if (
      selected.length === 0
    ) {
      console.log(
        "❌ Aucun conducteur dans un rayon de 15 km"
      );

      return [];
    }

    // --------------------------------------------------
    // LIMITATION
    // --------------------------------------------------

    const result =
      selected.slice(
        0,
        MAX_DRIVERS_ON_MAP
      );

    console.log(
      "\n=========================================="
    );

    console.log(
      "🚕 CONDUCTEURS ENVOYÉS À LA CARTE"
    );

    console.log(
      "=========================================="
    );

    result.forEach(
      (driver, index) => {
        console.log(
          `${index + 1}. ${
            driver.name ??
            driver.id
          }`
        );

        console.log(
          `   📏 ${driver.distanceKm} km`
        );

        console.log(
          `   📍 ${driver.latitude}, ${driver.longitude}`
        );

        console.log(
          `   🚗 ${driver.vehicleType}`
        );
      }
    );

    console.log(
      "==========================================\n"
    );

    return result;
  } catch (error) {
    console.log(
      "❌ ERREUR findAvailableDrivers :",
      error
    );

    return [];
  }
};

export default findAvailableDrivers;