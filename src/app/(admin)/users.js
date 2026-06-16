import {
  useEffect,
  useState,
} from "react";

import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../../../firebase/config";

export default function Users() {
  const [users, setUsers] =
    useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const querySnapshot =
        await getDocs(
          collection(db, "users")
        );

      const usersList = [];

      querySnapshot.forEach(
        (document) => {
          usersList.push({
            id: document.id,
            ...document.data(),
          });
        }
      );

      setUsers(usersList);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        Utilisateurs
      </Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        {users.length === 0 ? (
          <Text style={styles.empty}>
            Aucun utilisateur
          </Text>
        ) : (
          users.map((user) => (
            <View
              key={user.id}
              style={styles.card}
            >
              <Text style={styles.name}>
                👤 {user.name}
              </Text>

              <Text style={styles.info}>
                📞 {user.phone}
              </Text>

              <Text style={styles.info}>
                🎭 {user.role}
              </Text>

              {user.role ===
                "driver" && (
                <Text
                  style={styles.info}
                >
                  💰 Abonnement :
                  {" "}
                  {user.subscriptionActive
                    ? "Actif"
                    : "Inactif"}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#FFFFFF",
      padding: 20,
      marginTop: 80,
    },

    title: {
      fontSize: 30,
      fontWeight: "bold",
      color: "#0B6E4F",
      marginBottom: 20,
    },

    empty: {
      textAlign: "center",
      marginTop: 50,
      color: "#666",
    },

    card: {
      backgroundColor: "#F8F8F8",
      borderRadius: 15,
      padding: 15,
      marginBottom: 15,
    },

    name: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
    },

    info: {
      color: "#555",
      marginBottom: 5,
    },
  });