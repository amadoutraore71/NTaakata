import { useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function RateDriver() {
  const [rating, setRating] =
    useState(0);

  const submitRating = async () => {
    if (rating === 0) {
      Alert.alert(
        "Erreur",
        "Choisissez une note"
      );
      return;
    }

    Alert.alert(
      "Merci",
      `Vous avez donné ${rating} étoile(s)`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        Noter le conducteur
      </Text>

      <Text style={styles.subtitle}>
        Comment s'est passée votre course ?
      </Text>

      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map(
          (star) => (
            <TouchableOpacity
              key={star}
              onPress={() =>
                setRating(star)
              }
            >
              <Text
                style={{
                  fontSize: 45,
                }}
              >
                {star <= rating
                  ? "⭐"
                  : "☆"}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={submitRating}
      >
        <Text style={styles.buttonText}>
          Envoyer
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0B6E4F",
  },

  subtitle: {
    marginTop: 10,
    color: "#666",
  },

  stars: {
    flexDirection: "row",
    marginVertical: 40,
  },

  button: {
    backgroundColor: "#0B6E4F",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },

  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});