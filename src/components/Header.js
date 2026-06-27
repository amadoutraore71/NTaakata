import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Header({
  title,
  profileRoute,
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>
        {title}
      </Text>

      <TouchableOpacity
        onPress={() =>
          router.push(profileRoute)
        }
      >
        <Ionicons
          name="person-circle-outline"
          size={38}
          color="#0B6E4F"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#0B6E4F",
  },
});