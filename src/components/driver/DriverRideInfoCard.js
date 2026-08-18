import { StyleSheet, Text, View } from "react-native";

export default function DriverRideInfoCard({
  ride,
  distance,
  duration,
}) {
  const formatDistance = () => {
    if (distance == null) return "--";

    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(1)} km`;
    }

    return `${Math.round(distance)} m`;
  };

  const formatDuration = () => {
    if (duration == null) return "--";

    return `${Math.ceil(duration / 60)} min`;
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        Informations de la course
      </Text>

      <View style={styles.row}>
        <Text style={styles.label}>
          👤 Passager
        </Text>

        <Text style={styles.value}>
          {ride?.passengerName || "--"}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>
          📞 Téléphone
        </Text>

        <Text style={styles.value}>
          {ride?.passengerPhone || "--"}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>
          📍 Départ
        </Text>

        <Text style={styles.value}>
          {ride?.pickup?.address ||
            "Position actuelle"}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>
          🎯 Destination
        </Text>

        <Text style={styles.value}>
          {ride?.destination?.address ||
            "--"}
        </Text>
      </View>

      <View style={styles.separator} />

      <View style={styles.statsRow}>

        <View style={styles.statBox}>
          <Text style={styles.statTitle}>
            💰 Prix
          </Text>

          <Text style={styles.statValue}>
            {ride?.estimatedPrice || 0} FCFA
          </Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statTitle}>
            📏 Distance
          </Text>

          <Text style={styles.statValue}>
            {formatDistance()}
          </Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statTitle}>
            ⏱ Temps
          </Text>

          <Text style={styles.statValue}>
            {formatDuration()}
          </Text>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({

  card: {
    backgroundColor: "#FFF",
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 18,
    padding: 18,
    elevation: 4,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0B6E4F",
    marginBottom: 18,
  },

  row: {
    marginBottom: 14,
  },

  label: {
    color: "#777",
    fontSize: 14,
    marginBottom: 4,
  },

  value: {
    color: "#111",
    fontSize: 17,
    fontWeight: "600",
  },

  separator: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 18,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  statBox: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },

  statTitle: {
    color: "#777",
    fontSize: 13,
  },

  statValue: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "bold",
    color: "#0B6E4F",
  },

});