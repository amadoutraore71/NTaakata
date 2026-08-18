import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const DEFAULT_SETTINGS = {
  maxDriverDistance: 5000,
  maxDriversToSend: 5,
  requestTimeout: 30,
  retryDelay: 2,
  enableDynamicRadius: true,
};

export async function getMatchingSettings() {
  try {
    const docRef = doc(db, "settings", "matching");
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log("⚠️ Paramètres introuvables, utilisation des valeurs par défaut.");
      return DEFAULT_SETTINGS;
    }

    const settings = {
      ...DEFAULT_SETTINGS,
      ...docSnap.data(),
    };

    console.log("⚙️ Paramètres de matching :", settings);

    return settings;
  } catch (error) {
    console.log("Erreur chargement paramètres :", error);

    return DEFAULT_SETTINGS;
  }
}