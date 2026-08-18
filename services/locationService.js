import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase/config";

import {
  createLocation,
  normalizeText,
} from "../models/locationModel";

import { searchLocationIQ } from "./locationIQService";

const COLLECTION = "locations";
const searchCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
/**
 * Recherche locale Firestore
 */
export async function searchFirestoreLocations(searchText) {
  const text = normalizeText(searchText);

  if (text.length < 2) {
    return [];
  }

  try {
    const q = query(
      collection(db, COLLECTION),
      where("searchTokens", "array-contains", text),
      limit(20)
    );

    const snapshot = await getDocs(q);

    const results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Tri par popularité puis nom
    results.sort((a, b) => {
      if ((b.popularity || 0) !== (a.popularity || 0)) {
        return (b.popularity || 0) - (a.popularity || 0);
      }

      return (a.name || "").localeCompare(b.name || "");
    });

    return results;
  } catch (error) {
    console.error(
      "Erreur recherche Firestore :",
      error
    );

    return [];
  }
}

/**
 * Sauvegarde un lieu si inexistant
 */
export async function saveLocation(location) {
  try {
    const locationData = createLocation(location);

    const q = query(
      collection(db, COLLECTION),
      where(
        "normalizedName",
        "==",
        locationData.normalizedName
      ),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return;
    }

    await addDoc(
      collection(db, COLLECTION),
      locationData
    );
  } catch (error) {
    console.error(
      "Erreur sauvegarde lieu :",
      error
    );
  }
}

/**
 * Recherche principale
 *
 * Firestore
 * ↓
 * LocationIQ
 * ↓
 * Sauvegarde automatique
 */
export async function searchLocations(searchText) {

  const text = normalizeText(searchText);

  if (text.length < 2) {
    return [];
  }

  const cached = searchCache.get(text);

  if (
    cached &&
    Date.now() - cached.timestamp < CACHE_DURATION
  ) {
    return cached.results;
  }

  // Recherche locale
  const firestoreResults =
    await searchFirestoreLocations(text);

  if (firestoreResults.length > 0) {
    searchCache.set(text, {
      timestamp: Date.now(),
      results: firestoreResults,
    });
    return firestoreResults;
  }

  // Recherche LocationIQ
  // Recherche LocationIQ
  try {
    const remoteResults =
      await searchLocationIQ(text);

    if (
      !remoteResults ||
      remoteResults.length === 0
    ) {
      searchCache.set(text, {
        timestamp: Date.now(),
        results: [],
      });

      return [];
    }

    // Sauvegarde en arrière-plan
    Promise.all(
      remoteResults.map((location) =>
        saveLocation(location)
      )
    ).catch(console.error);

    // Mise en cache
    searchCache.set(text, {
      timestamp: Date.now(),
      results: remoteResults,
    });

    return remoteResults;
  } catch (error) {
    console.error(
      "Erreur LocationIQ :",
      error
    );

    return [];
  }
}
/**
 * Lieux populaires
 */
export async function getPopularLocations(
  count = 10
) {
  try {
    const q = query(
      collection(db, COLLECTION),
      limit(100)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort(
        (a, b) =>
          (b.popularity || 0) -
          (a.popularity || 0)
      )
      .slice(0, count);
  } catch (error) {
    console.error(error);
    return [];
  }
}