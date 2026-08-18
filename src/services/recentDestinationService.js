import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where
} from "firebase/firestore";

import { db } from "../../firebase/config";


const COLLECTION = "recent_destinations";
const MAX_ITEMS = 3;

/**
 * Retourne les dernières destinations du passager
 */
export async function getRecentDestinations(userId) {
  if (!userId) return [];

  try {
    const q = query(
      collection(db, COLLECTION),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(MAX_ITEMS)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.log("Erreur getRecentDestinations :", error);
    return [];
  }
}

/**
 * Sauvegarde une destination
 */
export async function saveRecentDestination(
  userId,
  destination
) {
  if (!userId || !destination) return;

  try {
    // destinations existantes
    const q = query(
      collection(db, COLLECTION),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);

    // suppression doublon
    for (const item of snapshot.docs) {
      const data = item.data();

      if (
        data.normalizedName ===
        destination.normalizedName
      ) {
        await deleteDoc(item.ref);
      }
    }

    // ajout
    await addDoc(
      collection(db, COLLECTION),
      {
        ...destination,
        userId,
        createdAt: serverTimestamp(),
      }
    );

    // nettoyage
    const q2 = query(
      collection(db, COLLECTION),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const snapshot2 = await getDocs(q2);

    if (snapshot2.docs.length > MAX_ITEMS) {
      const docs = snapshot2.docs.slice(MAX_ITEMS);

      for (const item of docs) {
        await deleteDoc(item.ref);
      }
    }
  } catch (error) {
    console.log(
      "Erreur saveRecentDestination :",
      error
    );
  }
}

/**
 * Vide l'historique
 */
export async function clearRecentDestinations(
  userId
) {
  if (!userId) return;

  try {
    const q = query(
      collection(db, COLLECTION),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);

    for (const item of snapshot.docs) {
      await deleteDoc(item.ref);
    }
  } catch (error) {
    console.log(
      "Erreur clearRecentDestinations :",
      error
    );
  }
}