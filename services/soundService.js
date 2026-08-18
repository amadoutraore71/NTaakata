import { Audio } from "expo-av";

let sound = null;

export async function playRideRequestSound() {
  try {
    if (sound) {
      await sound.unloadAsync();
    }

    const { sound: newSound } =
      await Audio.Sound.createAsync(
        require("../assets/sounds/ride-request.mp3"),
        {
          shouldPlay: true,
          isLooping: true,
        }
      );

    sound = newSound;

  } catch (error) {
    console.log(error);
  }
}

export async function stopRideRequestSound() {
  try {
    if (!sound) return;

    await sound.stopAsync();
    await sound.unloadAsync();

    sound = null;

  } catch (error) {
    console.log(error);
  }
}