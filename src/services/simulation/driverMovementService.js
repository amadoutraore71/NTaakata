import {
  doc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../../firebase/config";


// ======================================================
// CONFIGURATION
// ======================================================

// Nombre d'étapes de déplacement.
// Le conducteur se déplacera pendant environ 30 secondes.
const STEP_COUNT = 30;

// Temps entre deux positions Firestore.
const STEP_DELAY = 1000;
// ======================================================
// CONTRÔLE DES DÉPLACEMENTS ACTIFS
// ======================================================

// Un seul déplacement à la fois par conducteur.
const activeMovements = new Map();

export function stopDriverMovement(driverId) {
  if (!driverId) {
    return;
  }

  const key = String(driverId);

  if (activeMovements.has(key)) {
    activeMovements.delete(key);

    console.log(
      "🛑 Déplacement conducteur arrêté :",
      driverId
    );
  }
}

// ======================================================
// PAUSE
// ======================================================

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}


// ======================================================
// DISTANCE ENTRE DEUX COORDONNÉES
// ======================================================

function getDistanceMeters(
  latitude1,
  longitude1,
  latitude2,
  longitude2
) {
  const earthRadius = 6371000;

  const lat1 =
    (latitude1 * Math.PI) / 180;

  const lat2 =
    (latitude2 * Math.PI) / 180;

  const deltaLat =
    ((latitude2 - latitude1) * Math.PI) /
    180;

  const deltaLng =
    ((longitude2 - longitude1) * Math.PI) /
    180;

  const a =
    Math.sin(deltaLat / 2) *
      Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
}


// ======================================================
// OBTENIR LA ROUTE OSRM
// ======================================================

async function getRoadRoute(
  startLocation,
  endLocation
) {
  const startLatitude =
    Number(startLocation.latitude);

  const startLongitude =
    Number(startLocation.longitude);

  const endLatitude =
    Number(endLocation.latitude);

  const endLongitude =
    Number(endLocation.longitude);

  if (
    !Number.isFinite(startLatitude) ||
    !Number.isFinite(startLongitude) ||
    !Number.isFinite(endLatitude) ||
    !Number.isFinite(endLongitude)
  ) {
    throw new Error(
      "Coordonnées invalides pour calculer la route"
    );
  }

  // ====================================================
  // IMPORTANT :
  // OSRM utilise longitude,latitude
  // ====================================================

  const url =
    "https://router.project-osrm.org/route/v1/driving/" +
    `${startLongitude},${startLatitude};` +
    `${endLongitude},${endLatitude}` +
    "?overview=full&geometries=geojson";

  console.log(
    "🌍 Calcul de la route OSRM..."
  );

  console.log(
    "📍 Départ :",
    {
      latitude: startLatitude,
      longitude: startLongitude,
    }
  );

  console.log(
    "🎯 Arrivée :",
    {
      latitude: endLatitude,
      longitude: endLongitude,
    }
  );

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      `OSRM HTTP ${response.status}`
    );
  }

  const data =
    await response.json();

  if (
    !data.routes ||
    !data.routes.length
  ) {
    throw new Error(
      "OSRM n'a trouvé aucune route"
    );
  }

  const route =
    data.routes[0];

  if (
    !route.geometry ||
    !route.geometry.coordinates ||
    route.geometry.coordinates.length < 2
  ) {
    throw new Error(
      "Géométrie OSRM invalide"
    );
  }

  console.log(
    "✅ Route OSRM obtenue"
  );

  console.log(
    "📏 Distance route :",
    route.distance,
    "m"
  );

  console.log(
    "⏱️ Durée route :",
    route.duration,
    "s"
  );

  console.log(
    "📍 Nombre de points OSRM :",
    route.geometry.coordinates.length
  );
console.log(
  "🧪 COORDONNÉES OSRM :",
  route.geometry.coordinates
);

console.log(
  "🧪 DISTANCE OSRM BRUTE :",
  route.distance
);
  return route;
}


// ======================================================
// CRÉER DES ÉTAPES À PARTIR DE LA ROUTE
// ======================================================
//
// Au lieu de prendre directement 30 points arbitraires,
// on répartit les 30 étapes sur toute la longueur de
// la route.
//
// Les points restent donc TOUJOURS sur la route OSRM.
// ======================================================

function createRouteSteps(
  coordinates,
  stepCount
) {
  if (
    !coordinates ||
    coordinates.length < 2
  ) {
    throw new Error(
      "Pas assez de points pour construire le déplacement"
    );
  }

  // ====================================================
  // 1. CONVERSION DES POINTS
  // ====================================================

  const points =
    coordinates.map(
      (coordinate) => ({
        latitude:
          Number(coordinate[1]),

        longitude:
          Number(coordinate[0]),
      })
    );

  // ====================================================
  // 2. CALCUL DES DISTANCES CUMULÉES
  // ====================================================

  const cumulativeDistances =
    [0];

  let totalDistance = 0;

  for (
    let i = 1;
    i < points.length;
    i++
  ) {
    const previous =
      points[i - 1];

    const current =
      points[i];

    const segmentDistance =
      getDistanceMeters(
        previous.latitude,
        previous.longitude,
        current.latitude,
        current.longitude
      );

    totalDistance +=
      segmentDistance;

    cumulativeDistances.push(
      totalDistance
    );
  }

  if (
    totalDistance <= 0
  ) {
    throw new Error(
      "La distance de la route est nulle"
    );
  }

  // ====================================================
  // 3. CRÉATION DES ÉTAPES
  // ====================================================

  const steps = [];

  for (
    let step = 1;
    step <= stepCount;
    step++
  ) {
    const targetDistance =
      (totalDistance * step) /
      stepCount;

    // -----------------------------------------------
    // Trouver le segment contenant cette distance
    // -----------------------------------------------

    let segmentIndex = 1;

    while (
      segmentIndex <
        cumulativeDistances.length &&
      cumulativeDistances[
        segmentIndex
      ] < targetDistance
    ) {
      segmentIndex++;
    }

    if (
      segmentIndex >=
      cumulativeDistances.length
    ) {
      segmentIndex =
        cumulativeDistances.length - 1;
    }

    const previousPoint =
      points[segmentIndex - 1];

    const nextPoint =
      points[segmentIndex];

    const previousDistance =
      cumulativeDistances[
        segmentIndex - 1
      ];

    const segmentDistance =
      cumulativeDistances[
        segmentIndex
      ] -
      previousDistance;

    let ratio = 0;

    if (
      segmentDistance > 0
    ) {
      ratio =
        (targetDistance -
          previousDistance) /
        segmentDistance;
    }

    // -----------------------------------------------
    // Position interpolée SUR LE SEGMENT DE ROUTE
    // -----------------------------------------------

    const latitude =
      previousPoint.latitude +
      (nextPoint.latitude -
        previousPoint.latitude) *
        ratio;

    const longitude =
      previousPoint.longitude +
      (nextPoint.longitude -
        previousPoint.longitude) *
        ratio;

    steps.push({
      latitude,
      longitude,
    });
  }

  return {
    steps,
    totalDistance,
  };
}


// ======================================================
// DÉPLACEMENT DU CONDUCTEUR
// ======================================================


export async function startDriverMovement({
  driverId,
  startLocation,
  endLocation,
  onFinished,
}) {
  console.log("========================================");
  console.log("🚗 START DRIVER MOVEMENT");
  console.log("🆔 driverId =", driverId);
  console.log("📍 startLocation =", startLocation);
  console.log("🎯 endLocation =", endLocation);
  console.log("========================================");

  // ====================================================
  // VALIDATION ID
  // ====================================================

  if (!driverId) {
    throw new Error("driverId manquant");
  }

  // ====================================================
  // VALIDATION DÉPART
  // ====================================================

  if (
    !startLocation ||
    typeof startLocation.latitude !== "number" ||
    typeof startLocation.longitude !== "number"
  ) {
    throw new Error(
      "Position de départ du conducteur invalide",
    );
  }

  // ====================================================
  // VALIDATION ARRIVÉE
  // ====================================================

  if (
    !endLocation ||
    typeof endLocation.latitude !== "number" ||
    typeof endLocation.longitude !== "number"
  ) {
    throw new Error(
      "Position d'arrivée invalide",
    );
  }

  // ====================================================
  // ANNULER L'ANCIEN DÉPLACEMENT
  // ====================================================

  const movementToken = Symbol(`driver_${driverId}`);

  const previousMovement = activeMovements.get(
    String(driverId),
  );

  if (previousMovement) {
    console.log(
      "🛑 Ancien déplacement annulé pour le conducteur :",
      driverId,
    );
  }

  activeMovements.set(
    String(driverId),
    movementToken,
  );

  // Fonction locale permettant de savoir si
  // ce déplacement est toujours le déplacement actif.
  const isMovementActive = () => {
    return (
      activeMovements.get(String(driverId)) ===
      movementToken
    );
  };

  // ====================================================
  // DOCUMENT FIRESTORE
  // ====================================================

  const driverRef = doc(
    db,
    "users",
    String(driverId),
  );

  console.log(
    "🔥 Document conducteur :",
    `users/${driverId}`,
  );

  // ====================================================
  // CALCUL DE LA ROUTE
  // ====================================================

  let route;

  try {
    route = await getRoadRoute(
      startLocation,
      endLocation,
    );
  } catch (error) {
    // Ne pas laisser un ancien mouvement
    // reprendre le contrôle.
    if (isMovementActive()) {
      activeMovements.delete(String(driverId));
    }

    console.error(
      "❌ Impossible de calculer la route OSRM :",
      error,
    );

    throw error;
  }

  // ====================================================
  // VÉRIFIER APRÈS OSRM
  // ====================================================

  if (!isMovementActive()) {
    console.log(
      "🛑 Déplacement remplacé pendant le calcul OSRM.",
    );

    return;
  }

  // ====================================================
  // CONSTRUIRE LES ÉTAPES
  // ====================================================

  let routeSteps;

  try {
    const result = createRouteSteps(
      route.geometry.coordinates,
      STEP_COUNT,
    );

    routeSteps = result.steps;

    console.log(
      "🛣️ Étapes de déplacement créées :",
      routeSteps.length,
    );

    console.log(
      "📏 Distance totale :",
      result.totalDistance,
      "m",
    );
  } catch (error) {
    if (isMovementActive()) {
      activeMovements.delete(String(driverId));
    }

    console.error(
      "❌ Impossible de construire les étapes :",
      error,
    );

    throw error;
  }

  // ====================================================
  // POSITION INITIALE
  // ====================================================

  if (!isMovementActive()) {
    console.log(
      "🛑 Déplacement remplacé avant la position initiale.",
    );

    return;
  }

  try {
    await updateDoc(driverRef, {
      latitude: startLocation.latitude,
      longitude: startLocation.longitude,
      lastLocationUpdate: new Date(),
    });

    console.log(
      "📍 Position initiale enregistrée",
    );
  } catch (error) {
    if (isMovementActive()) {
      activeMovements.delete(String(driverId));
    }

    console.error(
      "❌ Impossible de mettre à jour la position initiale :",
      error,
    );

    throw error;
  }

  // ====================================================
  // DÉPLACEMENT SUR LA ROUTE
  // ====================================================

  for (
    let step = 0;
    step < routeSteps.length;
    step++
  ) {
    // --------------------------------------------------
    // VÉRIFIER AVANT CHAQUE ÉTAPE
    // --------------------------------------------------

    if (!isMovementActive()) {
      console.log(
        "🛑 Déplacement interrompu : un nouveau déplacement est actif.",
      );

      return;
    }

    const position = routeSteps[step];

    console.log(
      `🚗 Déplacement ${step + 1}/${routeSteps.length}`,
      {
        latitude: position.latitude,
        longitude: position.longitude,
      },
    );

    try {
      // ------------------------------------------------
      // VÉRIFIER JUSTE AVANT FIRESTORE
      // ------------------------------------------------

      if (!isMovementActive()) {
        console.log(
          "🛑 Déplacement annulé avant écriture Firestore.",
        );

        return;
      }

      await updateDoc(driverRef, {
        latitude: position.latitude,
        longitude: position.longitude,
        lastLocationUpdate: new Date(),
      });

      console.log(
        "🔥 Firestore mis à jour :",
        position,
      );
    } catch (error) {
      if (isMovementActive()) {
        activeMovements.delete(String(driverId));
      }

      console.error(
        "❌ Erreur mise à jour position conducteur :",
        error,
      );

      throw error;
    }

    // ==================================================
    // ARRIVÉE
    // ==================================================

    if (
      step ===
      routeSteps.length - 1
    ) {
      // ------------------------------------------------
      // VÉRIFIER AVANT onFinished
      // ------------------------------------------------

      if (!isMovementActive()) {
        console.log(
          "🛑 Déplacement remplacé juste avant l'arrivée.",
        );

        return;
      }

      console.log(
        "========================================",
      );

      console.log(
        "📍 CONDUCTEUR ARRIVÉ",
      );

      console.log(
        "📍 Position finale :",
        position,
      );

      console.log(
        "========================================",
      );

      // Le mouvement est terminé.
      activeMovements.delete(
        String(driverId),
      );

      if (
        typeof onFinished ===
        "function"
      ) {
        await onFinished();
      }

      return;
    }

    // ==================================================
    // ATTENTE AVANT LA PROCHAINE POSITION
    // ==================================================

    await sleep(STEP_DELAY);

    // --------------------------------------------------
    // VÉRIFICATION APRÈS L'ATTENTE
    // --------------------------------------------------

    if (!isMovementActive()) {
      console.log(
        "🛑 Déplacement annulé après attente.",
      );

      return;
    }
  }
}
