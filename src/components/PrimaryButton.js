import { StyleSheet, Text, TouchableOpacity } from "react-native";

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[
        styles.button,
        disabled && styles.disabled,
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      <Text style={styles.text}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#F4C300",
    height: 58,
    borderRadius: 18,

    justifyContent: "center",
    alignItems: "center",

    marginTop: 20,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,

    elevation: 6,
  },

  disabled: {
    opacity: 0.5,
  },

  text: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
});