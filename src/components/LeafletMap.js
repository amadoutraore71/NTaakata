import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function LeafletMap({
  html,
  mode = "tracking",
  drivers = [],
  searchingDriver = null,
  onDriverSelected,
  onRouteInfo,
  showDriverRoute = false,
  driverArrived = false,
  startDestinationRoute = false,
  destinationLocation = null,
}) {
  const webViewRef = useRef(null);
  const htmlRef = useRef(typeof html === "string" ? html : "");
  const readyRef = useRef(false);
  const loadedHtmlRef = useRef(null);
  const pendingRef = useRef([]);
  const pickupSentRef = useRef(false);
  const destinationSentRef = useRef(false);
  const arrivedSentRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const webViewSource = useMemo(() => ({ html: html || "" }), [html]);

  const safeDrivers = Array.isArray(drivers) ? drivers : [];
  const driversSignature = useMemo(() => {
    try {
      return JSON.stringify(safeDrivers);
    } catch {
      return "[]";
    }
  }, [safeDrivers]);
  const stableDrivers = useMemo(() => safeDrivers, [driversSignature]);

  const searchingDriverSignature = useMemo(() => {
    try {
      return JSON.stringify(searchingDriver ?? null);
    } catch {
      return "null";
    }
  }, [searchingDriver]);
  const stableSearchingDriver = useMemo(
    () => searchingDriver ?? null,
    [searchingDriverSignature]
  );

  const destinationSignature = useMemo(() => {
    try {
      return JSON.stringify(destinationLocation ?? null);
    } catch {
      return "null";
    }
  }, [destinationLocation]);
  const stableDestination = useMemo(
    () => destinationLocation ?? null,
    [destinationSignature]
  );

  useEffect(() => {
    htmlRef.current = typeof html === "string" ? html : "";
    readyRef.current = false;
    loadedHtmlRef.current = null;
    pendingRef.current = [];
    pickupSentRef.current = false;
    destinationSentRef.current = false;
    arrivedSentRef.current = false;
    setMapReady(false);
  }, [html]);

  const sendMessage = useCallback((message) => {
    const currentHtml = htmlRef.current;
    if (
      !webViewRef.current ||
      !readyRef.current ||
      loadedHtmlRef.current !== currentHtml
    ) {
      // Garder seulement le dernier message de chaque type évite
      // d'accumuler des commandes périmées pendant le chargement.
      pendingRef.current = pendingRef.current.filter(
        (item) => item.type !== (message?.type || "message")
      );
      pendingRef.current.push({
        type: message?.type || "message",
        message,
      });
      return false;
    }

    try {
      const payload = JSON.stringify(message);
      webViewRef.current.injectJavaScript(`
        (function () {
          try {
            if (typeof window.__ntaakataReceiveMessage === "function") {
              window.__ntaakataReceiveMessage(${JSON.stringify(payload)});
            }
          } catch (error) {
            console.error("N'Taakata bridge error", error);
          }
        })();
        true;
      `);
      return true;
    } catch (error) {
      console.error("[LeafletMap] Envoi du message impossible:", error?.message || error);
      return false;
    }
  }, []);

  const flushPending = useCallback(() => {
    if (!readyRef.current || loadedHtmlRef.current !== htmlRef.current) return;
    const queue = [...pendingRef.current];
    pendingRef.current = [];
    queue.forEach(({ message }) => sendMessage(message));
  }, [sendMessage]);

  useEffect(() => {
    if (!mapReady) return;

    if (mode === "drivers") {
      sendMessage({ type: "drivers_update", drivers: stableDrivers });
      sendMessage({
        type: "searching_driver",
        driver: stableSearchingDriver || stableDrivers[0] || null,
      });
    }

    if (mode === "tracking" && stableDrivers[0]) {
      sendMessage({ type: "driver_position", driver: stableDrivers[0] });
    }
  }, [
    mapReady,
    mode,
    stableDrivers,
    stableSearchingDriver,
    sendMessage,
  ]);

  useEffect(() => {
    if (!mapReady || mode !== "tracking") return;

    if (showDriverRoute && stableDrivers[0]) {
      if (!pickupSentRef.current) {
        const sent = sendMessage({
          type: "driver_route",
          driver: stableDrivers[0],
        });
        if (sent) pickupSentRef.current = true;
      }
    } else if (pickupSentRef.current) {
      sendMessage({ type: "stop_routes" });
      pickupSentRef.current = false;
    }
  }, [mapReady, mode, showDriverRoute, stableDrivers, sendMessage]);

  useEffect(() => {
    if (!mapReady || mode !== "tracking") return;

    if (startDestinationRoute && stableDrivers[0] && stableDestination) {
      if (!destinationSentRef.current) {
        const sent = sendMessage({
          type: "start_destination_route",
          driver: stableDrivers[0],
          destination: stableDestination,
        });
        if (sent) destinationSentRef.current = true;
      }
    } else if (destinationSentRef.current) {
      sendMessage({ type: "stop_destination_route" });
      destinationSentRef.current = false;
    }
  }, [
    mapReady,
    mode,
    startDestinationRoute,
    stableDestination,
    stableDrivers,
    sendMessage,
  ]);

  useEffect(() => {
    if (!mapReady || mode !== "tracking") return;

    if (driverArrived && !arrivedSentRef.current) {
      const sent = sendMessage({ type: "driver_arrived" });
      if (sent) arrivedSentRef.current = true;
    } else if (!driverArrived) {
      arrivedSentRef.current = false;
    }
  }, [mapReady, mode, driverArrived, sendMessage]);

  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (!data) return;

      if (data.type === "ready") {
        readyRef.current = true;
        loadedHtmlRef.current = htmlRef.current;
        setMapReady(true);
        flushPending();
        return;
      }

      if (data.type === "driver_selected") {
        onDriverSelected?.(data.driver);
        return;
      }

      if (data.type === "route_info" || data.type === "destination_route_info") {
        onRouteInfo?.(data);
        return;
      }

      if (data.type === "error" || data.type === "webview_js_error") {
        console.error("[LeafletMap] Erreur JavaScript WebView:", {
          type: data.type,
          message: data.message,
          source: data.source || data.filename || "inconnu",
          line: data.line ?? data.lineno ?? "inconnue",
          column: data.column ?? data.colno ?? "inconnue",
          stack: data.stack || "aucune",
        });
        return;
      }

      // Les messages de debug détaillés sont désactivés pour éviter
      // de polluer la console à chaque mise à jour de la carte.
    } catch (error) {
      console.warn(
        "[LeafletMap] Message WebView non JSON:",
        String(event.nativeEvent.data || "").slice(0, 200),
        error?.message || error
      );
    }
  }, [flushPending, onDriverSelected, onRouteInfo]);

  if (!html) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={webViewSource}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowUniversalAccessFromFileURLs
        mixedContentMode="always"
        onMessage={handleMessage}
        onLoadStart={() => {
          readyRef.current = false;
          loadedHtmlRef.current = null;
          setMapReady(false);
        }}
        onLoadEnd={() => {
          // Pas de log à chaque rechargement normal de la carte.
        }}
        onError={(event) => {
          console.warn("[LeafletMap] Erreur WebView:", event.nativeEvent?.description || "inconnue");
        }}
        style={styles.map}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 1 },
  map: { flex: 1 },
  loading: {
    flex: 1,
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center",
  },
});
