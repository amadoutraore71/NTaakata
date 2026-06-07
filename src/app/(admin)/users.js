import { useState } from "react";
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const usersData = [
  {
    id: "1",
    name: "Amadou Traoré",
    phone: "+22370000000",
    status: "Actif",
  },
  {
    id: "2",
    name: "Mariam Coulibaly",
    phone: "+22376000000",
    status: "Actif",
  },
  {
    id: "3",
    name: "Moussa Diallo",
    phone: "+22366000000",
    status: "Suspendu",
  },
];

export default function Users() {
  const [search, setSearch] = useState("");

  const filteredUsers = usersData.filter((user) =>
    user.name.toLowerCase().includes(
      search.toLowerCase()
    )
  );

  const renderUser = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>
        {item.name}
      </Text>

      <Text style={styles.phone}>
        {item.phone}
      </Text>

      <Text
        style={[
          styles.status,
          {
            color:
              item.status === "Actif"
                ? "green"
                : "red",
          },
        ]}
      >
        {item.status}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.suspendButton}
        >
          <Text style={styles.buttonText}>
            Suspendre
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
        >
          <Text style={styles.buttonText}>
            Supprimer
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>

      <Text style={styles.title}>
        Gestion des utilisateurs
      </Text>

      <TextInput
        style={styles.search}
        placeholder="Rechercher un utilisateur"
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
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

  search: {
    height: 50,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#F8F8F8",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
  },

  name: {
    fontSize: 18,
    fontWeight: "bold",
  },

  phone: {
    color: "#666",
    marginTop: 5,
  },

  status: {
    marginTop: 8,
    fontWeight: "bold",
  },

  actions: {
    flexDirection: "row",
    marginTop: 15,
  },

  suspendButton: {
    flex: 1,
    backgroundColor: "#F4C300",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 5,
  },

  deleteButton: {
    flex: 1,
    backgroundColor: "#E53935",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginLeft: 5,
  },

  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
});