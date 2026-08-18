import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function DriverActionButtons({
  ride,
  distance,
  onCallPassenger,
  onMessagePassenger,
  onArrived,
  onStartRide,
  onFinishRide,
}) {
  const isArrived =
    distance !== null && distance <= 30;

  return (
    <View style={styles.container}>

      {/* Avant l'arrivée */}
      {ride?.status === "accepted" && !isArrived && (
        <>
          <TouchableOpacity
            style={styles.callButton}
            onPress={onCallPassenger}
          >
            <Text style={styles.buttonText}>
              📞 Appeler le passager
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.messageButton}
            onPress={onMessagePassenger}
          >
            <Text style={styles.buttonText}>
              💬 Envoyer un message
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* Arrivé chez le passager */}
      {ride?.status === "accepted" && isArrived && (
        <>
          <View style={styles.arrivedBanner}>
            <Text style={styles.arrivedText}>
              🟢 Vous êtes arrivé chez le passager
            </Text>
          </View>

          <TouchableOpacity
            style={styles.arrivedButton}
            onPress={onArrived}
          >
            <Text style={styles.buttonText}>
              🚗 Je suis arrivé
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* Début de course */}
      {ride?.status === "arrived" && (
        <TouchableOpacity
          style={styles.startButton}
          onPress={onStartRide}
        >
          <Text style={styles.buttonText}>
            ▶️ Démarrer la course
          </Text>
        </TouchableOpacity>
      )}

      {/* Pendant la course */}
      {ride?.status === "started" && (
        <TouchableOpacity
          style={styles.finishButton}
          onPress={onFinishRide}
        >
          <Text style={styles.buttonText}>
            🏁 Terminer la course
          </Text>
        </TouchableOpacity>
      )}

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    margin: 15,
  },

  arrivedBanner: {
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },

  arrivedText: {
    color: "#2E7D32",
    fontWeight: "bold",
    fontSize: 16,
  },

  callButton: {
    backgroundColor: "#1565C0",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    alignItems: "center",
  },

  messageButton: {
    backgroundColor: "#0B6E4F",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    alignItems: "center",
  },

  arrivedButton: {
    backgroundColor: "#16A34A",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
  },

  startButton: {
    backgroundColor: "#F4B400",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
  },

  finishButton: {
    backgroundColor: "#E53935",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 17,
  },

});