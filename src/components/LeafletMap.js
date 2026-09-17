import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

export default function LeafletMap({
  html,
  mode = "tracking",
  drivers = [],
  onDriverSelected,
  onRouteInfo,
  showDriverRoute = false,
  startDestinationRoute = false,
  destinationLocation = null,
}) {
  const webViewRef = useRef(null);
  const htmlRef = useRef(html);
  const readyRef = useRef(false);
  const loadedHtmlRef = useRef(null);
  const pendingRef = useRef([]);
  const pickupSentRef = useRef(false);
  const destinationSentRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    htmlRef.current = html;
    readyRef.current = false;
    loadedHtmlRef.current = null;
    setMapReady(false);
    pickupSentRef.current = false;
    destinationSentRef.current = false;
  }, [html]);

  const sendMessage = useCallback((message) => {
    if (!webViewRef.current || !readyRef.current || loadedHtmlRef.current !== htmlRef.current) {
      pendingRef.current = pendingRef.current.filter((x) => x.type !== message?.type);
      pendingRef.current.push({ type: message?.type || "message", message });
      return false;
    }

    try {
      const payload = JSON.stringify(message);
      webViewRef.current.injectJavaScript(`
        (function(){
          try{
            if(typeof window.__ntaakataReceiveMessage==="function"){
              window.__ntaakataReceiveMessage(${JSON.stringify(payload)});
            }
          }catch(e){}
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
    if (!readyRef.current || loadedHtmlRef.current !== htmlRef.current) return;
    if (!pendingRef.current.length) return;

    const queue = [...pendingRef.current];
    pendingRef.current = [];

    queue.forEach((item) => {
      if (!sendMessage(item.message)) pendingRef.current.push(item);
    });
  }, [sendMessage]);

  // La position Firestore ne recrée jamais la carte : elle déplace seulement le marqueur.
  useEffect(() => {
    if (!mapReady || mode !== "tracking") return;
    const driver = drivers?.[0];
    if (!driver) return;
    sendMessage({ type: "driver_position", driver });
  }, [drivers, mapReady, mode, sendMessage]);

  useEffect(() => {
    if (!mapReady || mode !== "tracking" || !showDriverRoute || pickupSentRef.current) return;
    const driver = drivers?.[0];
    if (!driver) return;

    if (sendMessage({ type: "show_driver_route", driver })) {
      pickupSentRef.current = true;
      console.log("✅ Route conducteur → passager envoyée");
    }
  }, [mapReady, mode, showDriverRoute, drivers, sendMessage]);

  useEffect(() => {
    if (!showDriverRoute) pickupSentRef.current = false;
  }, [showDriverRoute]);

  useEffect(() => {
    if (!mapReady || mode !== "tracking" || !startDestinationRoute || destinationSentRef.current) return;
    const driver = drivers?.[0];
    if (!driver || !destinationLocation) return;

    if (sendMessage({
      type: "start_destination_route",
      driver,
      destinationLocation,
    })) {
      destinationSentRef.current = true;
      console.log("✅ Route conducteur → destination envoyée");
    }
  }, [mapReady, mode, startDestinationRoute, drivers, destinationLocation, sendMessage]);

  useEffect(() => {
    if (!startDestinationRoute) destinationSentRef.current = false;
  }, [startDestinationRoute]);

  useEffect(() => {
    if (!mapReady) return;
    const t = setTimeout(flushPending, 30);
    return () => clearTimeout(t);
  }, [mapReady, flushPending]);

  const handleMessage = useCallback((event) => {
    const raw = event.nativeEvent?.data;
    if (!raw) return;

    try {
      const data = JSON.parse(raw);

      if (data.type === "ready") {
        readyRef.current = true;
        loadedHtmlRef.current = htmlRef.current;
        setMapReady(true);
        console.log("✅ WebView Leaflet prête");
        setTimeout(flushPending, 30);
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

      if (data.type === "debug") {
        console.log("🌐 WEBVIEW :", data.message);
        return;
      }

      if (data.type === "webview_js_error") {
        console.error("❌ Erreur JavaScript WebView :", data);
      }
    } catch {
      console.log("⚠️ Message WebView non JSON :", raw);
    }
  }, [flushPending, onDriverSelected, onRouteInfo]);

  if (!html) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" />
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
          console.log("🟡 WebView chargement démarré");
        }}
        onLoadEnd={() => console.log("🟢 WebView chargée")}
        onError={(event) => console.error("❌ Erreur WebView :", event.nativeEvent)}
        onHttpError={(event) => console.error("❌ Erreur HTTP WebView :", event.nativeEvent)}
        style={styles.map}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
});
