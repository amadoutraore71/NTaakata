import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import ProgressBar from "../common/ProgressBar";

export default function IncomingRideCard({
  visible,
  request,
  countdown,
  onAccept,
  onReject,
}) {
  if (!request) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
    >
      <View style={styles.overlay}>

        <View style={styles.card}>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              🚖 NOUVELLE DEMANDE
            </Text>
          </View>

          <ProgressBar countdown={countdown} />

          <Text style={styles.title}>
            👤 {request.passengerName}
          </Text>

          <Text style={styles.text}>
            📞 {request.passengerPhone}
          </Text>

          <Text style={styles.label}>
            📍 Départ
          </Text>

          <Text style={styles.value}>
            {request.pickup?.address ??
              "Position actuelle"}
          </Text>

          <Text style={styles.label}>
            🎯 Destination
          </Text>

          <Text style={styles.value}>
            {request.destination?.address ??
              "Destination"}
          </Text>

          <View style={styles.infoRow}>

            <View style={styles.infoBox}>

              <Text style={styles.infoLabel}>
                Distance
              </Text>

              <Text style={styles.infoValue}>
                {request.estimatedDistance}
              </Text>

            </View>

            <View style={styles.infoBox}>

              <Text style={styles.infoLabel}>
                Durée
              </Text>

              <Text style={styles.infoValue}>
                {request.estimatedDuration}
              </Text>

            </View>

          </View>

          <View style={styles.priceCard}>

            <Text style={styles.priceLabel}>
              Prix estimé
            </Text>

            <Text style={styles.price}>
              {request.estimatedPrice} FCFA
            </Text>

          </View>

          <View style={styles.buttonRow}>

            <TouchableOpacity
              style={styles.rejectButton}
              onPress={onReject}
            >
              <Text style={styles.buttonText}>
                Refuser
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={onAccept}
            >
              <Text style={styles.buttonText}>
                Accepter
              </Text>
            </TouchableOpacity>

          </View>

        </View>

      </View>

    </Modal>
  );
}

const styles = StyleSheet.create({

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    width: "90%",
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 24,
    elevation: 20,
  },

  badge: {
    alignSelf: "center",
    borderWidth: 2,
    borderColor: "#0B6E4F",
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 15,
  },

  badgeText: {
    color: "#0B6E4F",
    fontWeight: "bold",
    fontSize: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 15,
  },

  text: {
    fontSize: 17,
    marginTop: 8,
  },

  label: {
    fontWeight: "bold",
    marginTop: 18,
    color: "#666",
  },

  value: {
    fontSize: 17,
    marginTop: 4,
  },

  infoRow: {
    flexDirection: "row",
    marginTop: 20,
  },

  infoBox: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
    alignItems: "center",
  },

  infoLabel: {
    color: "#777",
  },

  infoValue: {
    marginTop: 6,
    fontWeight: "bold",
    fontSize: 17,
  },

  priceCard: {
    marginTop: 20,
    backgroundColor: "#EAF8F2",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
  },

  priceLabel: {
    color: "#666",
  },

  price: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginTop: 5,
  },

  buttonRow: {
    flexDirection: "row",
    marginTop: 25,
  },

  rejectButton: {
    flex: 1,
    backgroundColor: "#E53935",
    padding: 15,
    borderRadius: 12,
    marginRight: 6,
    alignItems: "center",
  },

  acceptButton: {
    flex: 1,
    backgroundColor: "#0B6E4F",
    padding: 15,
    borderRadius: 12,
    marginLeft: 6,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 17,
  },

});