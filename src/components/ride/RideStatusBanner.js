import { StyleSheet, Text, TouchableOpacity, View } from "react-native";


export default function RideStatusBanner({ status, driverName }) {

  const getStatus = () => {

    switch (status) {

      case "searching":
        return {
          color: "#F59E0B",
          text: "🔎 Recherche d'un conducteur...",
        };

      case "accepted":
        return {
          color: "#16A34A",
          text: `✅ ${driverName || "Le conducteur"} a accepté votre demande`,
        };

      case "arriving":
        return {
          color: "#2563EB",
          text: "🚗 Le conducteur arrive...",
        };

      case "in_progress":
        return {
          color: "#7C3AED",
          text: "🛣️ Course en cours...",
        };

      case "completed":
        return {
          color: "#16A34A",
          text: "🏁 Course terminée",
        };

      case "cancelled":
        return {
          color: "#DC2626",
          text: "❌ Course annulée",
        };

      case "search_failed":
        return {
          color: "#DC2626",
          text: "❌ Aucun conducteur disponible",
        };

      default:
        return null;
    }
  };

  const state = getStatus();

  // Rien à afficher tant que le statut n'est pas connu
  if (!state) return null;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: state.color },
      ]}
    >
      <Text style={styles.text}>
        {state.text}
      </Text>
    </View>
  );

  {
    status === "searching" && (
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={onCancel}
      >
        <Text style={styles.cancelText}>
          Annuler la demande
        </Text>
      </TouchableOpacity>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 15,
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    elevation: 6,
  },

  text: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 15,
  },
  cancelButton: {
    marginTop: 12,
    backgroundColor: "#E53935",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  cancelText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
});