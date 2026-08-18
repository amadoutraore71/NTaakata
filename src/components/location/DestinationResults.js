import { FlatList, StyleSheet, Text, View } from "react-native";
import DestinationItem from "./DestinationItem";

export default function DestinationResults({
  results = [],
  loading = false,
  onSelect,
}) {
  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Recherche...</Text>
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <View style={styles.center}>
        <Text>Aucun lieu trouvé.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={results}
      keyExtractor={(item) => item.id || item.name}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => (
        <DestinationItem
          item={item}
          onPress={onSelect}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    padding: 20,
    alignItems: "center",
  },
});