import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "recent_destinations";
const MAX_ITEMS = 3;

/**
 * Retourne les destinations récentes
 */
export async function getRecentDestinations() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.log("Erreur getRecentDestinations :", error);
    return [];
  }
}

/**
 * Sauvegarde une destination
 */
export async function saveRecentDestination(destination) {
  try {
    const recent = await getRecentDestinations();

    // Supprime les doublons (même nom)
    const filtered = recent.filter(
      (item) => item.name !== destination.name
    );

    // Ajoute en première position
    filtered.unshift(destination);

    // Garde uniquement les 5 dernières
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(filtered.slice(0, MAX_ITEMS))
    );
  } catch (error) {
    console.log("Erreur saveRecentDestination :", error);
  }
}

/**
 * Vide l'historique
 */
export async function clearRecentDestinations() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.log("Erreur clearRecentDestinations :", error);
  }
}