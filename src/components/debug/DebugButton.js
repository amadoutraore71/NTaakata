import { StyleSheet, Text, TouchableOpacity } from "react-native";

export default function DebugButton({
  title,
  color = "#1976D2",
  onPress,
}) {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: color }]}
      onPress={onPress}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: "center",
  },

  text: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});