import {
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";

const drivers = [
  {
    id: "1",
    name: "Moussa Traoré",
    vehicle: "Moto",
    rating: 4.8,
    distance: "500 m",
    price: "1500 FCFA",
    image:
      "https://randomuser.me/api/portraits/men/1.jpg",
  },
  {
    id: "2",
    name: "Amadou Diallo",
    vehicle: "Voiture",
    rating: 4.9,
    distance: "1 km",
    price: "2500 FCFA",
    image:
      "https://randomuser.me/api/portraits/men/2.jpg",
  },
];

export default function Drivers() {
  const requestRide = (driver) => {
    router.push("/(passenger)/ride-details");
  };

  const renderDriver = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.image }}
        style={styles.avatar}
      />

      <View style={styles.info}>
        <Text style={styles.name}>
          {item.name}
        </Text>

        <Text style={styles.details}>
          {item.vehicle}
        </Text>

        <Text style={styles.details}>
          ⭐ {item.rating}
        </Text>

        <Text style={styles.details}>
          📍 {item.distance}
        </Text>

        <Text style={styles.price}>
          {item.price}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => requestRide(item)}
      >
        <Text style={styles.buttonText}>
          Demander
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        Conducteurs disponibles
      </Text>

      <FlatList
        data={drivers}
        keyExtractor={(item) => item.id}
        renderItem={renderDriver}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginBottom: 20,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },

  info: {
    flex: 1,
    marginLeft: 15,
  },

  name: {
    fontSize: 16,
    fontWeight: "bold",
  },

  details: {
    color: "#666",
    marginTop: 2,
  },

  price: {
    color: "#0B6E4F",
    fontWeight: "bold",
    marginTop: 5,
  },

  button: {
    backgroundColor: "#F4C300",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },

  buttonText: {
    fontWeight: "bold",
  },
});