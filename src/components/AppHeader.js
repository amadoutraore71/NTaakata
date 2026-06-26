import { useEffect, useState } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { getUser } from "../storage/userStorage";

export default function AppHeader({
  title,
  profileRoute,
}) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await getUser();
    setUser(currentUser);
  };

  const firstName =
    user?.name?.split(" ")[0] || "Utilisateur";

  return (
    <View style={styles.container}>

      <View>
        <Text style={styles.greeting}>
          👋 Bonjour {firstName}
        </Text>

        <Text style={styles.title}>
          {title}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() =>
          router.push(profileRoute)
        }
      >
        <View style={styles.avatar}>
          <Ionicons
            name="person"
            size={30}
            color="#FFFFFF"
          />
        </View>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },

  greeting: {
    color: "#777",
    fontSize: 16,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginTop: 5,
  },

  avatar: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#0B6E4F",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },

});