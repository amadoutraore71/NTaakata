import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function BottomNavigation({ active }) {
  return (
    <View style={styles.container}>

      <NavItem
        icon="home"
        label="Accueil"
        active={active === "home"}
        onPress={() =>
          router.replace("/(passenger)/home")
        }
      />

      <NavItem
        icon="time"
        label="Courses"
        active={active === "history"}
        onPress={() =>
          router.replace("/(passenger)/history")
        }
      />

      <NavItem
        icon="map"
        label="Carte"
        active={active === "map"}
        onPress={() =>
          router.replace("/(passenger)/drivers-map")
        }
      />

      <NavItem
        icon="person"
        label="Profil"
        active={active === "profile"}
        onPress={() =>
          router.replace("/(passenger)/profile")
        }
      />

    </View>
  );
}

function NavItem({
  icon,
  label,
  active,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={styles.item}
      onPress={onPress}
    >
      <Ionicons
        name={active ? icon : `${icon}-outline`}
        size={24}
        color={active ? "#0B6E4F" : "#999"}
      />

      <Text
        style={[
          styles.label,
          active && styles.activeLabel,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({

  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",

    backgroundColor: "#FFF",

    paddingVertical: 12,

    borderTopWidth: 1,
    borderTopColor: "#EEE",

    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,

    elevation: 10,
  },

  item: {
    alignItems: "center",
  },

  label: {
    marginTop: 4,
    color: "#888",
    fontSize: 12,
  },

  activeLabel: {
    color: "#0B6E4F",
    fontWeight: "bold",
  },

});