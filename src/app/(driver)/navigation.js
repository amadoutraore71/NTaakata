import { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  Marker,
} from "react-native-maps";
import Header from "../../components/Header";

export default function DriverNavigation() {
  const [rideStatus, setRideStatus] =
    useState("accepted");

  const chauffeurLocation = {
    latitude: 12.6392,
    longitude: -8.0029,
  };

  const clientLocation = {
    latitude: 12.6500,
    longitude: -7.9900,
  };

  return (
    <View style={styles.container}>
      <Header
        title="Accueil"
        profileRoute="/(passenger)/profile"
      />
      {/* Carte */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 12.644,
          longitude: -7.996,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
      >
        {/* Chauffeur */}
        <Marker
          coordinate={chauffeurLocation}
          title="Vous"
          description="Position du chauffeur"
        />

        {/* Client */}
        <Marker
          coordinate={clientLocation}
          title="Client"
          description="Point de départ"
        />
      </MapView>

      {/* Carte d'information */}
      <View style={styles.bottomCard}>
        <Text style={styles.title}>
          Course en cours
        </Text>

        <Text style={styles.info}>
          👤 Amadou Traoré
        </Text>

        <Text style={styles.info}>
          📍 Départ : Sogoniko
        </Text>

        <Text style={styles.info}>
          🎯 Destination : Badalabougou
        </Text>

        <Text style={styles.info}>
          🚕 Distance : 2.5 km
        </Text>

        <Text style={styles.price}>
          1 500 FCFA
        </Text>

        {rideStatus === "accepted" && (
          <TouchableOpacity
            style={styles.arrivedButton}
            onPress={() =>
              setRideStatus("arrived")
            }
          >
            <Text style={styles.buttonText}>
              Arrivé au point de départ
            </Text>
          </TouchableOpacity>
        )}

        {rideStatus === "arrived" && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={() =>
              setRideStatus("started")
            }
          >
            <Text style={styles.buttonText}>
              Démarrer la course
            </Text>
          </TouchableOpacity>
        )}

        {rideStatus === "started" && (
          <TouchableOpacity
            style={styles.finishButton}
            onPress={() =>
              setRideStatus("finished")
            }
          >
            <Text style={styles.buttonText}>
              Terminer la course
            </Text>
          </TouchableOpacity>
        )}

        {rideStatus === "finished" && (
          <View style={styles.successCard}>
            <Text style={styles.successText}>
              ✅ Course terminée
            </Text>
          </View>
        )}
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

  bottomCard: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginBottom: 10,
  },

  info: {
    fontSize: 15,
    color: "#555",
    marginBottom: 5,
  },

  price: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginVertical: 15,
  },

  arrivedButton: {
    backgroundColor: "#F4C300",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  startButton: {
    backgroundColor: "#0B6E4F",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  finishButton: {
    backgroundColor: "#E53935",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  successCard: {
    backgroundColor: "#E8F5E9",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  successText: {
    color: "green",
    fontWeight: "bold",
    fontSize: 16,
  },
});