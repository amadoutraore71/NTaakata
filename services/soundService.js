import {
  createAudioPlayer,
  setAudioModeAsync,
} from "expo-audio";

let player = null;
let isPlaying = false;
let isPrepared = false;

/**
 * Prépare le lecteur audio dès l'ouverture du dashboard.
 * Cela évite d'attendre le chargement du fichier au moment
 * où une demande de course arrive.
 */
export async function prepareRideRequestSound() {
  try {
    if (player) {
      isPrepared = true;
      console.log("🔊 Sonnerie déjà préparée");
      return;
    }

    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "doNotMix",
      shouldPlayInBackground: false,
    });

    console.log("🔊 Préparation de la sonnerie...");

    player = createAudioPlayer(
      require("../assets/sounds/ride-request.mp3")
    );

    player.volume = 1.0;
    player.loop = true;

    isPrepared = true;

    console.log("✅ Sonnerie préparée");
  } catch (error) {
    console.error("❌ Erreur préparation sonnerie :", error);

    player = null;
    isPrepared = false;
    isPlaying = false;
  }
}

/**
 * Démarre la sonnerie.
 */
export async function playRideRequestSound() {
  try {
    if (!player) {
      await prepareRideRequestSound();
    }

    if (!player) {
      console.log("❌ Impossible de démarrer la sonnerie");
      return;
    }

    if (isPlaying) {
      return;
    }

    player.volume = 1.0;
    player.loop = true;

    player.play();

    isPlaying = true;

    console.log("🔊 Sonnerie demande démarrée");
  } catch (error) {
    console.error("❌ Erreur démarrage sonnerie :", error);
    isPlaying = false;
  }
}

/**
 * Arrête et réinitialise la sonnerie.
 */
export function stopRideRequestSound() {
  try {
    if (!player) {
      isPlaying = false;
      return;
    }

    try {
      player.pause();
    } catch {}

    try {
      player.seekTo(0);
    } catch {}

    isPlaying = false;

    console.log("🔇 Sonnerie demande arrêtée");
  } catch (error) {
    console.error("❌ Erreur arrêt sonnerie :", error);
  }
}