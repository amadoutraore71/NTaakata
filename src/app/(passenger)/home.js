import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import * as Location from "expo-location";
import { router } from "expo-router";
import MapView, { Marker } from "react-native-maps";

export default function Home() {
  const mapRef = useRef(null);

  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        alert("Permission GPS refusée");
        return;
      }

      const currentLocation =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      setLocation(currentLocation.coords);

      setLoading(false);

      mapRef.current?.animateToRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
        <Text>Chargement du GPS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Ma position"
          />
        )}
      </MapView>

      <View style={styles.bottomCard}>
        <Text style={styles.hello}>
          Bonjour 👋
        </Text>

        <Text style={styles.title}>
          Où allez-vous ?
        </Text>

        <TouchableOpacity
          style={styles.destinationButton}
          onPress={() =>
            router.push("/(passenger)/search-ride")
          }
        >
          <Text style={styles.destinationText}>
            📍 Entrer votre destination
          </Text>
        </TouchableOpacity>

        <View style={styles.transportContainer}>
          <TouchableOpacity style={styles.transportCard}>
            <Text style={styles.icon}>🏍️</Text>
            <Text>Moto</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.transportCard}>
            <Text style={styles.icon}>🚗</Text>
            <Text>Voiture</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  bottomCard: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },

  hello: {
    color: "#666",
    fontSize: 15,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginTop: 5,
  },

  destinationButton: {
    backgroundColor: "#F5F5F5",
    padding: 18,
    borderRadius: 12,
    marginTop: 20,
  },

  destinationText: {
    color: "#666",
    fontSize: 16,
  },

  transportContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
  },

  transportCard: {
    width: "48%",
    backgroundColor: "#F8F8F8",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
  },

  icon: {
    fontSize: 32,
    marginBottom: 8,
  },
});