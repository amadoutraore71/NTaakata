import { useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity
} from "react-native";

import { LOCATION_CATEGORIES } from "../../../../constants/locationCategories";
import { addLocation } from "../../../../services/locationService";

export default function AddLocationScreen() {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");

  const [category, setCategory] = useState(
    LOCATION_CATEGORIES[0].id
  );

  const handleSave = async () => {
    try {
      await addLocation({
        name,
        aliases: [],
        type: category,
        category,
        city,
        region,
        latitude: 0,
        longitude: 0,
        popularity: 50,
      });

      Alert.alert("Succès", "Lieu ajouté.");

      setName("");
      setCity("");
      setRegion("");

    } catch (e) {
      console.log(e);
      Alert.alert("Erreur", "Impossible d'ajouter le lieu.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>

        <Text style={styles.title}>
          Ajouter un lieu
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nom"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Ville"
          value={city}
          onChangeText={setCity}
        />

        <TextInput
          style={styles.input}
          placeholder="Région"
          value={region}
          onChangeText={setRegion}
        />

        <Text style={styles.section}>
          Catégorie
        </Text>

        {LOCATION_CATEGORIES.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.category,
              category === item.id && styles.selected,
            ]}
            onPress={() => setCategory(item.id)}
          >
            <Text>
              {item.icon} {item.label}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.button}
          onPress={handleSave}
        >
          <Text style={styles.buttonText}>
            Enregistrer
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
  },

  section: {
    marginTop: 15,
    marginBottom: 10,
    fontWeight: "600",
    fontSize: 16,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },

  category: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 8,
  },

  selected: {
    borderColor: "#2E7D32",
    backgroundColor: "#E8F5E9",
  },

  button: {
    marginTop: 25,
    backgroundColor: "#2E7D32",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

});