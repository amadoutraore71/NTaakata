import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export default function RideArrivalInfo({
  fare,
  destination,
  paymentMethod,
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Informations de la course</Text>

      <View style={styles.row}>
        <View style={styles.left}>
          <MaterialIcons
            name="payments"
            size={22}
            color="#0B6E4F"
          />
          <Text style={styles.label}>Prix</Text>
        </View>

        <Text style={styles.value}>
          {fare != null ? `${fare} FCFA` : "--"}
        </Text>
      </View>

      <View style={styles.separator} />

      <View style={styles.row}>
        <View style={styles.left}>
          <MaterialIcons
            name="place"
            size={22}
            color="#0B6E4F"
          />
          <Text style={styles.label}>Destination</Text>
        </View>

        <Text
          style={styles.value}
          numberOfLines={2}
        >
          {destination || "--"}
        </Text>
      </View>

      <View style={styles.separator} />

      <View style={styles.row}>
        <View style={styles.left}>
          <MaterialIcons
            name="account-balance-wallet"
            size={22}
            color="#0B6E4F"
          />
          <Text style={styles.label}>Paiement</Text>
        </View>

        <Text style={styles.value}>
          {paymentMethod || "Espèces"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  label: {
    marginLeft: 10,
    fontSize: 15,
    color: "#555",
    fontWeight: "500",
  },

  value: {
    flex: 1,
    textAlign: "right",
    fontSize: 15,
    color: "#111827",
    fontWeight: "700",
  },

  separator: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
});