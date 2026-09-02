import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DebugButton from "./DebugButton";

export default function DeveloperPanel({
  // ==============================
  // DEMANDES BROADCAST
  // ==============================
  rideRequests = [],
  onAcceptRequest,
  onRejectRequest,

  // ==============================
  // ANCIENS OUTILS DE DEBUG
  // ==============================
  onSimulateRide,
  onMoveDriver,
  onIncomingRide,
  onAcceptRide,
  onStartRide,
  onFinishRide,
  onCancelRide,
  onResetRide,
}) {
  const [expanded, setExpanded] = useState(false);

  // Le panneau n'existe qu'en développement
  if (!__DEV__) {
    return null;
  }

  // Nombre de demandes encore en attente
  const pendingRequests = rideRequests.filter(
    (request) => request.status === "pending"
  );

  return (
    <View style={styles.container}>
      {/* ================================================= */}
      {/* EN-TÊTE                                           */}
      {/* ================================================= */}

      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((previous) => !previous)}
        activeOpacity={0.8}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.title}>🧪 MODE DÉVELOPPEUR</Text>

          {rideRequests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{rideRequests.length}</Text>
            </View>
          )}
        </View>

        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={24}
          color="#D97706"
        />
      </TouchableOpacity>

      {/* ================================================= */}
      {/* CONTENU                                           */}
      {/* ================================================= */}

      {expanded && (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>
            Outils de test N'Taakata
          </Text>

          {/* ================================================= */}
          {/* DEMANDES DE COURSE BROADCAST                      */}
          {/* ================================================= */}

          <View style={styles.requestsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                📡 Demandes envoyées aux conducteurs
              </Text>

              <Text style={styles.requestCount}>
                {rideRequests.length}
              </Text>
            </View>

            {rideRequests.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>📭</Text>

                <Text style={styles.emptyText}>
                  Aucune demande de conducteur
                </Text>

                <Text style={styles.emptySubText}>
                  Les demandes broadcast apparaîtront ici.
                </Text>
              </View>
            ) : (
              rideRequests.map((request, index) => {
                const status = request.status || "pending";

                const driverName =
                  request.driverName ||
                  `Conducteur ${index + 1}`;

                const distance =
                  request.driverDistance ??
                  request.distance ??
                  null;

                return (
                  <View
                    key={request.id || request.requestId || index}
                    style={styles.requestCard}
                  >
                    {/* ============================== */}
                    {/* INFORMATIONS CONDUCTEUR        */}
                    {/* ============================== */}

                    <View style={styles.requestTop}>
                      <View style={styles.driverIcon}>
                        <Text style={styles.driverIconText}>🚕</Text>
                      </View>

                      <View style={styles.driverInfo}>
                        <Text
                          style={styles.driverName}
                          numberOfLines={1}
                        >
                          {driverName}
                        </Text>

                        {distance !== null && (
                          <Text style={styles.distance}>
                            📍 {formatDistance(distance)}
                          </Text>
                        )}

                        {request.vehicleType && (
                          <Text style={styles.vehicle}>
                            🚗 {request.vehicleType}
                          </Text>
                        )}
                      </View>

                      {/* STATUT */}
                      <View
                        style={[
                          styles.statusBadge,
                          getStatusStyle(status),
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            getStatusTextStyle(status),
                          ]}
                        >
                          {getStatusLabel(status)}
                        </Text>
                      </View>
                    </View>

                    {/* ============================== */}
                    {/* ACTIONS                         */}
                    {/* ============================== */}

                    {status === "pending" && (
                      <View style={styles.actions}>
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            styles.rejectButton,
                          ]}
                          onPress={() => {
                            if (onRejectRequest) {
                              onRejectRequest(
                                request.id || request.requestId
                              );
                            }
                          }}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.rejectButtonText}>
                            ❌ Refuser
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            styles.acceptButton,
                          ]}
                          onPress={() => {
                            if (onAcceptRequest) {
                              onAcceptRequest(
                                request.id || request.requestId
                              );
                            }
                          }}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.acceptButtonText}>
                            ✅ Accepter
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>

          {/* ================================================= */}
          {/* OUTILS DEBUG EXISTANTS                            */}
          {/* ================================================= */}

          <View style={styles.debugSection}>
            <Text style={styles.sectionTitle}>
              🛠️ Outils de simulation
            </Text>

            <DebugButton
              title="🚕 Simuler une course"
              color="#1976D2"
              onPress={onSimulateRide}
            />

            <DebugButton
              title="📍 Déplacer le conducteur"
              color="#009688"
              onPress={onMoveDriver}
            />

            <DebugButton
              title="📞 Simuler une demande"
              color="#9C27B0"
              onPress={onIncomingRide}
            />

            <DebugButton
              title="✅ Accepter la course"
              color="#43A047"
              onPress={onAcceptRide}
            />

            <DebugButton
              title="🚗 Démarrer la course"
              color="#FB8C00"
              onPress={onStartRide}
            />

            <DebugButton
              title="🏁 Terminer la course"
              color="#E53935"
              onPress={onFinishRide}
            />

            <DebugButton
              title="❌ Annuler la course"
              color="#757575"
              onPress={onCancelRide}
            />

            <DebugButton
              title="🔄 Réinitialiser"
              color="#5E35B1"
              onPress={onResetRide}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

/* ========================================================= */
/* OUTILS                                                     */
/* ========================================================= */

function formatDistance(distance) {
  const value = Number(distance);

  if (!Number.isFinite(value)) {
    return "Distance inconnue";
  }

  // Si la valeur est en mètres
  if (value < 1000) {
    return `${Math.round(value)} m`;
  }

  return `${(value / 1000).toFixed(1)} km`;
}

function getStatusLabel(status) {
  switch (status) {
    case "pending":
      return "En attente";

    case "accepted":
      return "Acceptée";

    case "rejected":
      return "Refusée";

    case "timeout":
      return "Expirée";

    case "cancelled":
      return "Annulée";

    default:
      return status;
  }
}

function getStatusStyle(status) {
  switch (status) {
    case "pending":
      return styles.statusPending;

    case "accepted":
      return styles.statusAccepted;

    case "rejected":
      return styles.statusRejected;

    case "timeout":
      return styles.statusTimeout;

    case "cancelled":
      return styles.statusCancelled;

    default:
      return styles.statusDefault;
  }
}

function getStatusTextStyle(status) {
  switch (status) {
    case "pending":
      return styles.statusPendingText;

    case "accepted":
      return styles.statusAcceptedText;

    case "rejected":
      return styles.statusRejectedText;

    case "timeout":
      return styles.statusTimeoutText;

    case "cancelled":
      return styles.statusCancelledText;

    default:
      return styles.statusDefaultText;
  }
}

/* ========================================================= */
/* STYLES                                                      */
/* ========================================================= */

const styles = StyleSheet.create({
  container: {
    margin: 15,
    borderRadius: 18,
    backgroundColor: "#FFF8E1",
    borderWidth: 1,
    borderColor: "#F4B400",
    overflow: "hidden",
    maxHeight: "80%",
  },

  header: {
    minHeight: 60,
    paddingHorizontal: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#D97706",
  },

  badge: {
    minWidth: 25,
    height: 25,
    borderRadius: 13,
    marginLeft: 8,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#D97706",
  },

  badgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },

  content: {
    maxHeight: 600,
  },

  contentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },

  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },

  /* ============================== */
  /* DEMANDES                       */
  /* ============================== */

  requestsSection: {
    marginBottom: 20,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },

  requestCount: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1976D2",
    color: "#FFFFFF",
    textAlign: "center",
    textAlignVertical: "center",
    fontWeight: "bold",
    paddingTop: 5,
    overflow: "hidden",
  },

  emptyBox: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  emptyIcon: {
    fontSize: 30,
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#555",
  },

  emptySubText: {
    marginTop: 5,
    fontSize: 12,
    color: "#888",
    textAlign: "center",
  },

  requestCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  requestTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  driverIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },

  driverIconText: {
    fontSize: 23,
  },

  driverInfo: {
    flex: 1,
    marginLeft: 10,
  },

  driverName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
  },

  distance: {
    marginTop: 3,
    fontSize: 12,
    color: "#666",
  },

  vehicle: {
    marginTop: 2,
    fontSize: 12,
    color: "#777",
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    marginLeft: 5,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },

  statusPending: {
    backgroundColor: "#FFF3CD",
  },

  statusPendingText: {
    color: "#856404",
  },

  statusAccepted: {
    backgroundColor: "#D4EDDA",
  },

  statusAcceptedText: {
    color: "#155724",
  },

  statusRejected: {
    backgroundColor: "#F8D7DA",
  },

  statusRejectedText: {
    color: "#721C24",
  },

  statusTimeout: {
    backgroundColor: "#E2E3E5",
  },

  statusTimeoutText: {
    color: "#383D41",
  },

  statusCancelled: {
    backgroundColor: "#E2E3E5",
  },

  statusCancelledText: {
    color: "#383D41",
  },

  statusDefault: {
    backgroundColor: "#E5E7EB",
  },

  statusDefaultText: {
    color: "#374151",
  },

  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },

  actionButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  rejectButton: {
    backgroundColor: "#FDECEC",
    borderWidth: 1,
    borderColor: "#E53935",
  },

  rejectButtonText: {
    color: "#C62828",
    fontWeight: "700",
    fontSize: 13,
  },

  acceptButton: {
    backgroundColor: "#43A047",
  },

  acceptButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },

  /* ============================== */
  /* OUTILS DEBUG                   */
  /* ============================== */

  debugSection: {
    borderTopWidth: 1,
    borderTopColor: "#F0D98C",
    paddingTop: 15,
  },
});