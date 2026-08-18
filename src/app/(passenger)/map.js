import { Text, View } from "react-native";
import MapView from "react-native-maps";

export default function MapScreen() {
  console.log("MapScreen rendered");

  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          position: "absolute",
          top: 50,
          left: 20,
          zIndex: 999,
          backgroundColor: "white",
          padding: 10,
        }}
      >
        Carte chargée
      </Text>

      <MapView
        style={{ flex: 1 }}
        mapType="satellite"
        initialRegion={{
          latitude: 12.6392,
          longitude: -8.0029,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      />
    </View>
  );
}