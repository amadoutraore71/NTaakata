import { StyleSheet, Text, View } from "react-native";

export default function DriverStatusBadge({
  ride,
  distance,
}) {
  let text = "🟡 En route vers le passager";
  let backgroundColor = "#FFF8E1";
  let textColor = "#F4B400";

  if (
    distance !== null &&
    distance <= 30 &&
    ride?.status === "accepted"
  ) {
    text = "🟢 Vous êtes arrivé";
    backgroundColor = "#E8F5E9";
    textColor = "#2E7D32";
  }

  if (ride?.status === "started") {
    text = "🔵 Course en cours";
    backgroundColor = "#E3F2FD";
    textColor = "#1565C0";
  }
 
  if (ride?.status === "completed") {
    text = "✅ Course terminée";
    backgroundColor = "#E8F5E9";
    textColor = "#2E7D32";
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: textColor,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 15,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },

  text: {
    fontSize: 17,
    fontWeight: "bold",
  },
});