import {
    addDoc,
    collection,
    endAt,
    getDocs,
    limit,
    orderBy,
    query,
    startAt,
    where,
} from "firebase/firestore";

import { db } from "../../firebase/config";
import { createLocation } from "../models/locationModel";
import { calculateDistance } from "../utils/distance";
import { searchLocationIQ } from "./locationIQService";
const locationsRef = collection(db, "locations");

/**
 * Normalise un texte
 */
function normalize(text = "") {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

/**
 * Enregistre un lieu dans Firestore
 */
async function saveLocationIfNeeded(location) {
    try {
        const normalizedName = normalize(location.name);

        // Vérifie si le lieu existe déjà
        const q = query(
            locationsRef,
            where("normalizedName", "==", normalizedName),
            limit(1)
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            return;
        }

        const data = createLocation({
            name: location.name,
            aliases: location.aliases || [],
            type: location.type || "other",
            category: location.category || "other",
            city: location.city || "",
            region: location.region || "",
            latitude: location.latitude,
            longitude: location.longitude,
            popularity: 1,
        });

        await addDoc(locationsRef, data);
    } catch (error) {
        console.log("Erreur cache :", error);
    }
}

/**
 * Recherche par préfixe
 */
async function searchByName(text) {
    const q = query(
        locationsRef,
        orderBy("normalizedName"),
        startAt(text),
        endAt(text + "\uf8ff"),
        limit(15)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
}

/**
 * Recherche dans searchTokens
 */
async function searchByToken(token) {
    const q = query(
        locationsRef,
        where("searchTokens", "array-contains", token),
        limit(15)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
}

/**
 * Recherche principale
 */
export async function searchLocations(
    text,
    currentLocation,
    onExternalSearch
) {
    const normalizedText = normalize(text);

    if (normalizedText.length < 2) {
        return [];
    }

    // -----------------------
    // 1. Recherche par nom
    // -----------------------

    const firestoreResults = await searchByName(
        normalizedText
    );

    if (firestoreResults.length > 0) {
        return rankLocations(
            firestoreResults,
            normalizedText,
            currentLocation
        );
    }

    // -----------------------
    // 2. Recherche par token
    // -----------------------

    const tokenResults = await searchByToken(
        normalizedText
    );

    if (tokenResults.length > 0) {
        return rankLocations(
            tokenResults,
            normalizedText,
            currentLocation
        );
    }

    // -----------------------
    // 3. Recherche LocationIQ
    // -----------------------

    onExternalSearch?.(true);

    try {
        const onlineResults = await searchLocationIQ(
            normalizedText
        );

        // Sauvegarde automatique
        for (const location of onlineResults) {
            await saveLocationIfNeeded(location);
        }

        return rankLocations(
            onlineResults,
            normalizedText,
            currentLocation
        );
    } catch (error) {
        console.log("Erreur LocationIQ :", error);
        return [];
    } finally {
        onExternalSearch?.(false);
    }
}

function rankLocations(
  locations,
  searchText,
  currentLocation
) {
  return locations
    .map((location) => {
      const distance = currentLocation
        ? calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            Number(location.latitude),
            Number(location.longitude)
          )
        : null;

      const score = calculateScore(
        location,
        searchText,
        distance
      );

      return {
        ...location,
        distance,
        score,
      };
    })
    .sort((a, b) => {
      // D'abord le score
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      // En cas d'égalité, le plus proche
      if (a.distance != null && b.distance != null) {
        return a.distance - b.distance;
      }

      return 0;
    });
}
function calculateScore(location, searchText, distance) {
  let score = 0;

  const normalizedName =
    (location.normalizedName || "").toLowerCase();

  const tokens = location.searchTokens || [];

  // Correspondance exacte
  if (normalizedName === searchText) {
    score += 100;
  }

  // Commence par le texte recherché
  else if (normalizedName.startsWith(searchText)) {
    score += 80;
  }

  // Présent dans les tokens
  else if (tokens.includes(searchText)) {
    score += 50;
  }

  // Popularité (maximum 50 points)
  score += Math.min(location.popularity || 0, 50);

  // Bonus selon la distance
  if (distance !== null) {
    if (distance < 1) score += 100;
    else if (distance < 2) score += 90;
    else if (distance < 5) score += 70;
    else if (distance < 10) score += 50;
    else if (distance < 20) score += 30;
    else score += 10;
  }

  return score;
}