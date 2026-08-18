import { MaterialIcons } from "@expo/vector-icons";
import { Linking, StyleSheet, TouchableOpacity, View } from "react-native";

export default function RideActionButtons({
  phone,
  onChat,
  onCancel,
}) {
  const callDriver = () => {
    if (!phone) return;

    Linking.openURL(`tel:${phone}`);
  };

  return (
    <View style={styles.container}>

      <TouchableOpacity
        style={[styles.button, styles.callButton]}
        onPress={callDriver}
      >
        <MaterialIcons
          name="phone"
          size={24}
          color="#FFF"
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.chatButton]}
        onPress={onChat}
      >
        <MaterialIcons
          name="chat"
          size={24}
          color="#FFF"
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.cancelButton]}
        onPress={onCancel}
      >
        <MaterialIcons
          name="close"
          size={24}
          color="#FFF"
        />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginHorizontal: 15,
    marginBottom: 20,
  },

  button: {
    width: 65,
    height: 65,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  callButton: {
    backgroundColor: "#2E7D32",
  },

  chatButton: {
    backgroundColor: "#1976D2",
  },

  cancelButton: {
    backgroundColor: "#D32F2F",
  },
});