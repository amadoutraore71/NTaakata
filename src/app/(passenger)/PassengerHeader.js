import {
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function PassengerHeader({
  user,
}) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.hello}>
          👋 Bonjour {user?.name || "Passager"}
        </Text>

        <Text style={styles.subtitle}>
          Où souhaitez-vous aller aujourd'hui ?
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },

  hello: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0B6E4F",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 15,
    color: "#777",
  },

});