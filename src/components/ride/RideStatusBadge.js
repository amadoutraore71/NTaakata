import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
export default function RideStatusBadge({ status }) {
  const [dots, setDots] = useState("");

useEffect(() => {
  if (status !== "pending") return;

  const interval = setInterval(() => {
    setDots((prev) => {
      if (prev === "...") return "";
      return prev + ".";
    });
  }, 500);

  return () => clearInterval(interval);
}, [status]);

  const getStatus = () => {
    switch (status) {
      case "pending":
        return {
          icon: "🔍",
          text: "Recherche d'un conducteur...",
          color: "#F57C00",
        };

      case "accepted":
        return {
          icon: "✅",
          text: "Conducteur trouvé",
          color: "#2E7D32",
        };

      case "driver_arriving":
        return {
          icon: "🚕",
          text: "Le conducteur arrive",
          color: "#1565C0",
        };

      case "started":
        return {
          icon: "🚖",
          text: "Course en cours",
          color: "#6A1B9A",
        };

      case "completed":
        return {
          icon: "🏁",
          text: "Course terminée",
          color: "#2E7D32",
        };

      case "cancelled":
        return {
          icon: "❌",
          text: "Course annulée",
          color: "#C62828",
        };

      default:
        return {
          icon: "⌛",
          text: "Chargement...",
          color: "#757575",
        };
    }
  };

  const current = getStatus();

 return (
  <View style={styles.card}>

    {status === "pending" ? (
      <>
        <ActivityIndicator
          size="small"
          color="#F57C00"
        />

        <Text
          style={[
            styles.text,
            { color: "#F57C00" },
          ]}
        >
          Recherche d'un conducteur{dots}
        </Text>
      </>
    ) : (
      <Text
        style={[
          styles.text,
          { color: current.color },
        ]}
      >
        {current.icon} {current.text}
      </Text>
    )}

  </View>
);
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 15,
    elevation: 4,
    alignItems: "center",
  },

text: {
  fontSize: 18,
  fontWeight: "bold",
  marginTop: 8,
  textAlign: "center",
},
});