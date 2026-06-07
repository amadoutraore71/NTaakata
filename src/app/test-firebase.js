import { useEffect } from "react";
import { Text, View } from "react-native";

import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";


export default function TestFirebase() {

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const querySnapshot = await getDocs(
        collection(db, "users")
      );

      querySnapshot.forEach((doc) => {
        console.log(doc.id, doc.data());
      });

      console.log("Connexion Firebase OK");
    } catch (error) {
      console.log("Erreur :", error);
    }
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Test Firebase</Text>
    </View>
  );
}