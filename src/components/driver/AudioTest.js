import React from "react";
import { Alert, Button, View } from "react-native";

import { playRideRequestSound, stopRideRequestSound } from "../../../services/soundService";

export default function AudioTest() {
  const testSound = async () => {
    console.log("🎵 TEST AUDIO : démarrage");

    try {
      await playRideRequestSound();

      console.log("🎵 TEST AUDIO : playRideRequestSound terminé");

      Alert.alert(
        "Test audio",
        "La lecture a été lancée. Écoute maintenant."
      );
    } catch (error) {
      console.log("❌ TEST AUDIO :", error);
    }
  };

  const stopSound = async () => {
    console.log("🛑 TEST AUDIO : arrêt");
    await stopRideRequestSound();
  };

  return (
    <View
      style={{
        padding: 30,
        gap: 20,
      }}
    >
      <Button
        title="🔊 TESTER LA SONNERIE"
        onPress={testSound}
      />

      <Button
        title="🛑 ARRÊTER"
        onPress={stopSound}
      />
    </View>
  );
}