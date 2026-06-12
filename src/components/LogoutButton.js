import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, TouchableOpacity } from "react-native";

import { removeUser } from "../storage/userStorage";

export default function LogoutButton() {
  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Voulez-vous vous déconnecter ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Oui",
          onPress: async () => {
            await removeUser();

            router.replace("/");
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      onPress={handleLogout}
    >
      <Ionicons
        name="log-out-outline"
        size={30}
        color="#E53935"
      />
    </TouchableOpacity>
  );
}



 