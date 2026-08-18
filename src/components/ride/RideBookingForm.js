import {
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

export default function RideBookingForm({
  pickup,
  destination,
  onPickupChange,
  onDestinationChange,
}) {
  return (
    <View style={styles.container}>

      <Text style={styles.label}>
        📍 Départ
      </Text>

      <TextInput
        style={styles.input}
        value={pickup}
        onChangeText={onPickupChange}
        placeholder="Votre position"
      />

      <Text style={styles.label}>
        🎯 Destination
      </Text>

      <TextInput
        style={styles.input}
        value={destination}
        onChangeText={onDestinationChange}
        placeholder="Où allez-vous ?"
      />

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 15,
    marginTop: 15,
    padding: 15,
    borderRadius: 18,

    elevation: 5,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#444",
    marginBottom: 6,
  },

  input: {
    backgroundColor: "#F6F6F6",
    borderRadius: 12,
    padding: 14,
    marginBottom: 15,
    fontSize: 16,
  },

});