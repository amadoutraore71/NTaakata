import { StyleSheet, Text, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { TouchableOpacity } from "react-native";
import DebugButton from "./DebugButton";

export default function DeveloperPanel({
  onSimulateRide,
  onMoveDriver,
  onIncomingRide,
  onAcceptRide,
  onStartRide,
  onFinishRide,
  onCancelRide,
  onResetRide,
}) {
  const [expanded, setExpanded] = useState(false);
  if (!__DEV__) return null;

  return (
    <View style={styles.container}>

      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
      >

        <Text style={styles.title}>
          🧪 MODE DÉVELOPPEUR
        </Text>

        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={24}
          color="#D97706"
        />

      </TouchableOpacity>
      

      {expanded && (

        <>
          <Text style={styles.subtitle}>
            Outils de test N'Taakata
          </Text>

          <DebugButton
            title="🚕 Simuler une course"
            color="#1976D2"
            onPress={onSimulateRide}
          />

          <DebugButton
            title="📍 Déplacer le conducteur"
            color="#009688"
            onPress={onMoveDriver}
          />

          <DebugButton
            title="📞 Simuler une demande"
            color="#9C27B0"
            onPress={onIncomingRide}
          />

          <DebugButton
            title="✅ Accepter la course"
            color="#43A047"
            onPress={onAcceptRide}
          />

          <DebugButton
            title="🚗 Démarrer la course"
            color="#FB8C00"
            onPress={onStartRide}
          />

          <DebugButton
            title="🏁 Terminer la course"
            color="#E53935"
            onPress={onFinishRide}
          />

          <DebugButton
            title="❌ Annuler la course"
            color="#757575"
            onPress={onCancelRide}
          />

          <DebugButton
            title="🔄 Réinitialiser"
            color="#5E35B1"
            onPress={onResetRide}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 15,
    padding: 15,
    borderRadius: 18,
    backgroundColor: "#FFF8E1",
    borderWidth: 1,
    borderColor: "#F4B400",
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#D97706",
  },

  subtitle: {
    fontSize: 15,
    color: "#666",
    marginTop: 5,
    marginBottom: 20,
  },
  header: {

    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

  },
});