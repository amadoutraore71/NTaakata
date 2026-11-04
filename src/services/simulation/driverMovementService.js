import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase/config";

// Durée approximative du déplacement : 30 secondes.
const STEP_COUNT = 30;
const STEP_DELAY = 1000;

// Un seul déplacement actif par conducteur.
const activeMovements = new Map();

export function stopDriverMovement(driverId) {
  if (driverId === undefined || driverId === null || driverId === "") return;

  const key = String(driverId);
  if (activeMovements.has(key)) {
    activeMovements.delete(key);
    console.log("🛑 Déplacement conducteur arrêté :", key);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeLocation(location, label) {
  if (!location) {
    throw new Error(`Position ${label} manquante`);
  }

  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error(`Coordonnées invalides pour la position ${label}`);
  }

  return { latitude, longitude };
}

function getDistanceMeters(latitude1, longitude1, latitude2, longitude2) {
  const earthRadius = 6371000;
  const toRadians = (value) => (value * Math.PI) / 180;

  const lat1 = toRadians(latitude1);
  const lat2 = toRadians(latitude2);
  const deltaLat = toRadians(latitude2 - latitude1);
  const deltaLng = toRadians(longitude2 - longitude1);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) ** 2;

  // Limiter a à [0, 1] pour éviter les erreurs d'arrondi dans sqrt.
  const safeA = Math.min(1, Math.max(0, a));
  return earthRadius * 2 * Math.atan2(Math.sqrt(safeA), Math.sqrt(1 - safeA));
}

/**
 * Demande à OSRM la géométrie complète de la route.
 * OSRM attend les coordonnées dans l'ordre longitude,latitude.
 */
async function getRoadRoute(startLocation, endLocation) {
  const start = normalizeLocation(startLocation, "de départ");
  const end = normalizeLocation(endLocation, "d'arrivée");

  const straightDistance = getDistanceMeters(
    start.latitude,
    start.longitude,
    end.latitude,
    end.longitude
  );

  // Évite une route OSRM de 0 m si le mauvais point d'arrivée est transmis.
  if (straightDistance < 5) {
    throw new Error(
      "Le départ et l'arrivée sont distants de moins de 5 m. Vérifie endLocation : il faut transmettre le véritable point d'arrivée."
    );
  }

  const coordinates =
    `${start.longitude},${start.latitude};${end.longitude},${end.latitude}`;
  const url =
    `https://router.project-osrm.org/route/v1/driving/${coordinates}` +
    "?overview=full&geometries=geojson&steps=false";

  console.log("🌍 Calcul de la route OSRM…");
  console.log("📍 Départ :", start);
  console.log("🎯 Arrivée :", end);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`OSRM HTTP ${response.status}`);
  }

  const data = await response.json();

  if (data.code !== "Ok" || !Array.isArray(data.routes) || !data.routes.length) {
    throw new Error(data.message || "OSRM n'a trouvé aucune route.");
  }

  const route = data.routes[0];
  const coordinatesList = route?.geometry?.coordinates;

  if (!Array.isArray(coordinatesList) || coordinatesList.length < 2) {
    throw new Error("La géométrie de la route OSRM est invalide.");
  }

  if (!Number.isFinite(route.distance) || route.distance <= 0) {
    throw new Error(
      "La distance de la route OSRM est nulle. Vérifie les coordonnées de départ et d'arrivée."
    );
  }

  console.log("✅ Route OSRM obtenue");
  console.log("📏 Distance OSRM :", Math.round(route.distance), "m");
  console.log("⏱️ Durée OSRM :", Math.round(route.duration), "s");
  console.log("📍 Nombre de points OSRM :", coordinatesList.length);

  return route;
}

/**
 * Répartit les étapes le long de la géométrie OSRM.
 * Les points sont interpolés uniquement entre deux points voisins de la route,
 * et non directement entre le départ et l'arrivée.
 */
function createRouteSteps(coordinates, stepCount) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    throw new Error("Pas assez de points pour construire le déplacement.");
  }

  const points = coordinates.map((coordinate, index) => {
    if (!Array.isArray(coordinate) || coordinate.length < 2) {
      throw new Error(`Coordonnée OSRM invalide à l'index ${index}.`);
    }

    // GeoJSON / OSRM : [longitude, latitude].
    const longitude = Number(coordinate[0]);
    const latitude = Number(coordinate[1]);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new Error(`Coordonnées OSRM hors limites à l'index ${index}.`);
    }

    return { latitude, longitude };
  });

  const cumulativeDistances = [0];
  let totalDistance = 0;

  for (let i = 1; i < points.length; i += 1) {
    const previous = points[i - 1];
    const current = points[i];

    totalDistance += getDistanceMeters(
      previous.latitude,
      previous.longitude,
      current.latitude,
      current.longitude
    );

    cumulativeDistances.push(totalDistance);
  }

  if (totalDistance < 1) {
    throw new Error("La distance de la géométrie OSRM est nulle.");
  }

  const steps = [];
  let segmentIndex = 1;

  for (let step = 1; step <= stepCount; step += 1) {
    // La dernière étape reprend exactement le dernier point de la route.
    if (step === stepCount) {
      steps.push({ ...points[points.length - 1] });
      continue;
    }

    const targetDistance = (totalDistance * step) / stepCount;

    while (
      segmentIndex < cumulativeDistances.length - 1 &&
      cumulativeDistances[segmentIndex] < targetDistance
    ) {
      segmentIndex += 1;
    }

    const previousPoint = points[segmentIndex - 1];
    const nextPoint = points[segmentIndex];
    const previousDistance = cumulativeDistances[segmentIndex - 1];
    const segmentDistance =
      cumulativeDistances[segmentIndex] - previousDistance;

    const ratio =
      segmentDistance > 0
        ? Math.min(
            1,
            Math.max(0, (targetDistance - previousDistance) / segmentDistance)
          )
        : 0;

    steps.push({
      latitude:
        previousPoint.latitude +
        (nextPoint.latitude - previousPoint.latitude) * ratio,
      longitude:
        previousPoint.longitude +
        (nextPoint.longitude - previousPoint.longitude) * ratio,
    });
  }

  return { steps, totalDistance };
}

export async function startDriverMovement({
  driverId,
  startLocation,
  endLocation,
  onFinished,
}) {
  if (driverId === undefined || driverId === null || driverId === "") {
    throw new Error("driverId manquant.");
  }

  const start = normalizeLocation(startLocation, "de départ du conducteur");
  const end = normalizeLocation(endLocation, "d'arrivée");

  console.log("========================================");
  console.log("🚗 START DRIVER MOVEMENT");
  console.log("🆔 driverId =", driverId);
  console.log("📍 startLocation =", start);
  console.log("🎯 endLocation =", end);
  console.log("========================================");

  const key = String(driverId);
  const movementToken = Symbol(`driver_${key}`);

  if (activeMovements.has(key)) {
    console.log("🛑 Remplacement de l'ancien déplacement :", key);
  }

  activeMovements.set(key, movementToken);

  const isMovementActive = () => activeMovements.get(key) === movementToken;
  const driverRef = doc(db, "users", key);

  try {
    const route = await getRoadRoute(start, end);

    // Un nouveau déplacement a pu être lancé pendant la requête OSRM.
    if (!isMovementActive()) {
      console.log("🛑 Calcul OSRM ignoré : un déplacement plus récent est actif.");
      return;
    }

    const { steps, totalDistance } = createRouteSteps(
      route.geometry.coordinates,
      STEP_COUNT
    );

    console.log("🛣️ Étapes créées :", steps.length);
    console.log("📏 Distance géométrique :", Math.round(totalDistance), "m");

    // Publier la position de départ avant les étapes.
    await updateDoc(driverRef, {
      latitude: start.latitude,
      longitude: start.longitude,
      lastLocationUpdate: new Date(),
    });

    for (let index = 0; index < steps.length; index += 1) {
      if (!isMovementActive()) {
        console.log("🛑 Déplacement annulé avant l'étape", index + 1);
        return;
      }

      // Garder une cadence régulière et permettre à l'application d'afficher
      // chaque nouvelle position depuis Firestore.
      await sleep(STEP_DELAY);

      if (!isMovementActive()) {
        console.log("🛑 Déplacement annulé pendant l'attente.");
        return;
      }

      const position = steps[index];

      await updateDoc(driverRef, {
        latitude: position.latitude,
        longitude: position.longitude,
        lastLocationUpdate: new Date(),
      });

      if (!isMovementActive()) {
        console.log("🛑 Déplacement remplacé pendant l'écriture Firestore.");
        return;
      }

      console.log(
        `🚗 Déplacement ${index + 1}/${steps.length}`,
        position
      );
    }

    if (!isMovementActive()) return;

    // Retirer le mouvement actif avant d'appeler le callback.
    activeMovements.delete(key);

    console.log("========================================");
    console.log("📍 CONDUCTEUR ARRIVÉ :", steps[steps.length - 1]);
    console.log("========================================");

    if (typeof onFinished === "function") {
      await onFinished();
    }
  } catch (error) {
    if (isMovementActive()) {
      activeMovements.delete(key);
    }

    console.error("❌ Erreur déplacement conducteur :", error);
    throw error;
  }
}
