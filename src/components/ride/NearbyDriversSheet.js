import { useMemo } from "react";

import BottomSheet, {
    BottomSheetFlatList,
} from "@gorhom/bottom-sheet";

import {
    StyleSheet,
    Text,
    View,
} from "react-native";

import DriverCandidateCard from "./DriverCandidateCard";

export default function NearbyDriversSheet({
  visible,
  drivers,
  onSelectDriver,
}) {
  const snapPoints = useMemo(
    () => ["45%", "80%"],
    []
  );

  if (!visible) return null;

  return (
    <BottomSheet
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          Aucun conducteur n'a répondu
        </Text>

        <Text style={styles.subtitle}>
          Choisissez un autre conducteur
        </Text>
      </View>

      <BottomSheetFlatList
        data={drivers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DriverCandidateCard
            driver={item}
            onSelect={onSelectDriver}
          />
        )}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginBottom: 15,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 16,
    color: "#666",
  },
});