import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

// ============================================================
// RÉCUPÉRER LA CONFIGURATION DE L'ABONNEMENT
// ============================================================
export const getSubscriptionConfig = async () => {
  try {
    const subscriptionRef = doc(
      db,
      "settings",
      "subscription"
    );

    const snapshot = await getDoc(subscriptionRef);

    if (!snapshot.exists()) {
      console.log(
        "⚠️ Configuration abonnement introuvable."
      );

      // MODE DÉVELOPPEMENT
      return {
        dailyFee: 100,
        durationHours: 24,
        active: true,
      };
    }

    const data = snapshot.data();

    return {
      dailyFee:
        typeof data.dailyFee === "number"
          ? data.dailyFee
          : 100,

      durationHours:
        typeof data.durationHours === "number"
          ? data.durationHours
          : 24,

      // MODE DÉVELOPPEMENT :
      // actif sauf si explicitement désactivé
      active:
        data.active !== false,
    };
  } catch (error) {
    console.log(
      "❌ Erreur récupération configuration abonnement :",
      error
    );

    // MODE DÉVELOPPEMENT
    return {
      dailyFee: 100,
      durationHours: 24,
      active: true,
    };
  }
};


// ============================================================
// VÉRIFIER LA DATE D'EXPIRATION
// ============================================================
export const isSubscriptionValid = (
  subscriptionExpiresAt
) => {
  if (!subscriptionExpiresAt) {
    return false;
  }

  const now = new Date();

  const expirationDate =
    new Date(subscriptionExpiresAt);

  if (isNaN(expirationDate.getTime())) {
    return false;
  }

  return now < expirationDate;
};


// ============================================================
// VÉRIFIER SI L'ABONNEMENT DU CONDUCTEUR EST VALIDE
// ============================================================
export const isDriverSubscriptionValid = async (
  driver
) => {
  try {
    if (!driver) {
      return false;
    }

    // --------------------------------------------------------
    // 1. L'abonnement doit être marqué actif
    // --------------------------------------------------------
    if (driver.subscriptionActive !== true) {
      return false;
    }

    // --------------------------------------------------------
    // 2. La date d'expiration doit être valide
    // --------------------------------------------------------
    if (
      !isSubscriptionValid(
        driver.subscriptionExpiresAt
      )
    ) {
      return false;
    }

    // --------------------------------------------------------
    // 3. Vérifier la configuration générale
    // --------------------------------------------------------
    const config =
      await getSubscriptionConfig();

    if (config.active !== true) {
      return false;
    }

    return true;

  } catch (error) {
    console.log(
      "❌ Erreur vérification abonnement conducteur :",
      error
    );

    return false;
  }
};