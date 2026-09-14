import {
  createAudioPlayer,
  setAudioModeAsync,
} from "expo-audio";

let player = null;
let isPlaying = false;

const SOUND_FILE = require("../assets/sounds/ride-request.mp3");

const waitForPlayerToLoad = async (audioPlayer) => {
  const maxAttempts = 30;

  for (let i = 0; i < maxAttempts; i++) {
    if (audioPlayer.isLoaded) {
      console.log("✅ Fichier audio chargé");
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("❌ Le fichier audio n'a pas été chargé après 3 secondes");
  return false;
};

export async function playRideRequestSound() {
  try {
    if (player && isPlaying) {
      console.log("🔊 Sonnerie déjà en cours");
      return;
    }

    console.log("🔊 Préparation de la sonnerie...");

    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "mixWithOthers",
      shouldPlayInBackground: false,
    });

    // Nettoyer l'ancien lecteur
    if (player) {
      try {
        player.pause();
      } catch {}

      try {
        player.remove();
      } catch {}

      player = null;
      isPlaying = false;
    }

    console.log("🔊 Création du lecteur...");

    player = createAudioPlayer(SOUND_FILE);

    player.volume = 1.0;
    player.loop = true;

    console.log("🔊 État initial :", {
      loaded: player.isLoaded,
      playing: player.playing,
      paused: player.paused,
      volume: player.volume,
      muted: player.muted,
    });

    // IMPORTANT :
    // attendre que le MP3 soit réellement chargé
    const loaded = await waitForPlayerToLoad(player);

    if (!loaded) {
      console.log("❌ Impossible de démarrer la sonnerie");

      try {
        player.remove();
      } catch {}

      player = null;
      isPlaying = false;
      return;
    }

    console.log("🔊 Lecture de la sonnerie...");

    player.play();

    isPlaying = true;

    console.log("🔊 Sonnerie démarrée :", {
      loaded: player.isLoaded,
      playing: player.playing,
      paused: player.paused,
      volume: player.volume,
    });

  } catch (error) {
    console.log("❌ Erreur démarrage sonnerie :", error);

    player = null;
    isPlaying = false;
  }
}

export async function stopRideRequestSound() {
  try {
    if (!player) {
      isPlaying = false;
      return;
    }

    const currentPlayer = player;

    player = null;
    isPlaying = false;

    try {
      currentPlayer.pause();
    } catch {}

    try {
      currentPlayer.remove();
    } catch {}

    console.log("🔇 Sonnerie demande arrêtée");

  } catch (error) {
    console.log("❌ Erreur arrêt sonnerie :", error);

    player = null;
    isPlaying = false;
  }
}