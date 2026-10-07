import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

export default function LeafletMap({
  html,
  mode = "tracking",
  drivers = [],
  searchingDriver = null,
  onDriverSelected,
  onRouteInfo,
  showDriverRoute = false,
  startDestinationRoute = false,
  destinationLocation = null,
}) {
  const webViewRef = useRef(null);
  const htmlRef = useRef(html || "");
  const readyRef = useRef(false);
  const loadedHtmlRef = useRef(null);
  const pendingRef = useRef([]);
  const pickupSentRef = useRef(false);
  const destinationSentRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    htmlRef.current = typeof html === "string" ? html : "";
    readyRef.current = false;
    loadedHtmlRef.current = null;
    pendingRef.current = [];
    pickupSentRef.current = false;
    destinationSentRef.current = false;
    setMapReady(false);
  }, [html]);

  const sendMessage = useCallback((message) => {
    if (
      !webViewRef.current ||
      !readyRef.current ||
      loadedHtmlRef.current !== htmlRef.current
    ) {
      pendingRef.current = pendingRef.current.filter(
        (item) => item.type !== message?.type
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
      console.error("❌ Envoi Leaflet impossible :", error);
      return false;
    }
  }, []);

  const flushPending = useCallback(() => {
    if (!readyRef.current || loadedHtmlRef.current !== htmlRef.current) {
      return;
    }

    const queue = [...pendingRef.current];
    pendingRef.current = [];

    queue.forEach((item) => sendMessage(item.message));
  }, [sendMessage]);

  useEffect(() => {
    if (!mapReady) return;

    if (mode === "drivers") {
      sendMessage({
        type: "drivers_update",
        drivers: Array.isArray(drivers) ? drivers : [],
      });
    }

    if (mode === "tracking" && drivers?.[0]) {
      sendMessage({
        type: "driver_position",
        driver: drivers[0],
      });
    }
  }, [mapReady, mode, drivers, sendMessage]);

  useEffect(() => {
    if (!mapReady || mode !== "drivers") return;

    sendMessage({
      type: "searching_driver",
      driver: searchingDriver || drivers?.[0] || null,
    });
  }, [mapReady, mode, searchingDriver, drivers, sendMessage]);

  useEffect(() => {
    if (!mapReady || mode !== "tracking") return;

    if (showDriverRoute && drivers?.[0] && !pickupSentRef.current) {
      pickupSentRef.current = true;

      sendMessage({
        type: "driver_route",
        driver: drivers[0],
      });
    }

    if (!showDriverRoute && pickupSentRef.current) {
      sendMessage({ type: "stop_routes" });
    }
  }, [mapReady, mode, showDriverRoute, drivers, sendMessage]);

  useEffect(() => {
    if (!mapReady || mode !== "tracking") return;

    if (
      startDestinationRoute &&
      drivers?.[0] &&
      destinationLocation &&
      !destinationSentRef.current
    ) {
      destinationSentRef.current = true;

      sendMessage({
        type: "start_destination_route",
        driver: drivers[0],
        destination: destinationLocation,
      });
    }

    if (!startDestinationRoute && destinationSentRef.current) {
      destinationSentRef.current = false;
      sendMessage({ type: "stop_destination_route" });
    }
  }, [
    mapReady,
    mode,
    startDestinationRoute,
    destinationLocation,
    drivers,
    sendMessage,
  ]);

  const handleMessage = useCallback(
    (event) => {
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

        if (
          data.type === "route_info" ||
          data.type === "destination_route_info"
        ) {
          onRouteInfo?.(data);
          return;
        }

        if (
          data.type === "error" ||
          data.type === "webview_js_error"
        ) {
          console.error("==========================================");
          console.error("💥 ERREUR JAVASCRIPT WEBVIEW");
          console.error("📌 Type :", data.type);
          console.error("📌 Message :", data.message);
          console.error(
            "📌 Fichier :",
            data.source || data.filename || "inconnu"
          );
          console.error(
            "📌 Ligne :",
            data.line ?? data.lineno ?? "inconnue"
          );
          console.error(
            "📌 Colonne :",
            data.column ?? data.colno ?? "inconnue"
          );
          console.error("📌 Stack :", data.stack || "aucune");
          console.error("==========================================");
          return;
        }

        if (data.type === "debug") {
          console.log("WEBVIEW :", data.message);
        }
      } catch (error) {
        console.error(
          "❌ Message WebView non JSON :",
          event.nativeEvent.data,
          error
        );
      }
    },
    [flushPending, onDriverSelected, onRouteInfo]
  );

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
        source={{ html }}
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
          console.log("🟢 WebView Leaflet chargée");
        }}
        onError={(event) => {
          console.warn("⚠️ WebView :", event.nativeEvent);
        }}
        style={styles.map}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 1,
  },
  map: {
    flex: 1,
  },
  loading: {
    flex: 1,
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center",
  },
});
