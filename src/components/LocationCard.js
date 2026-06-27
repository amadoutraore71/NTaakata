import { StyleSheet, Text, View } from "react-native";

export default function LocationCard({ location }) {
  return (
    <View style={styles.card}>

      <Text style={styles.title}>
        📍 Votre position
      </Text>

      <Text style={styles.location}>
        {location || "Recherche..."}
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,

    elevation: 6,
  },

  title: {
    color: "#888",
    marginBottom: 5,
    fontSize: 15,
  },

  location: {
    color: "#0B6E4F",
    fontWeight: "bold",
    fontSize: 17,
  },

});