import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const requests = [
  {
    id: "1",
    passenger: "Amadou Traoré",
    pickup: "Sogoniko",
    destination: "Badalabougou",
    distance: "700 m",
    price: "1 500 FCFA",
  },
  {
    id: "2",
    passenger: "Mariam Coulibaly",
    pickup: "Kalaban Coura",
    destination: "ACI 2000",
    distance: "1.2 km",
    price: "2 500 FCFA",
  },
];

export default function Requests() {
  const acceptRide = (ride) => {
    console.log("Course acceptée", ride);
  };

  const rejectRide = (ride) => {
    console.log("Course refusée", ride);
  };

  const renderRequest = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.passenger}>
        👤 {item.passenger}
      </Text>

      <Text style={styles.info}>
        📍 Départ : {item.pickup}
      </Text>

      <Text style={styles.info}>
        🎯 Destination : {item.destination}
      </Text>

      <Text style={styles.info}>
        🚕 Distance : {item.distance}
      </Text>

      <Text style={styles.price}>
        {item.price}
      </Text>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => acceptRide(item)}
        >
          <Text style={styles.buttonText}>
            Accepter
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => rejectRide(item)}
        >
          <Text style={styles.buttonText}>
            Refuser
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        Demandes de courses
      </Text>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequest}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#F8F8F8",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },

  passenger: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  info: {
    marginBottom: 5,
    color: "#555",
  },

  price: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginTop: 10,
  },

  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },

  acceptButton: {
    backgroundColor: "#0B6E4F",
    flex: 1,
    marginRight: 5,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  rejectButton: {
    backgroundColor: "#E53935",
    flex: 1,
    marginLeft: 5,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});