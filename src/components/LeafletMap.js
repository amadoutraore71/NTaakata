import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
export default function LeafletMap({ html,
    drivers, }) {
    const [mapReady, setMapReady] = useState(false);

    const webViewRef = useRef(null);
    useEffect(() => {

        if (!mapReady) return;

        if (!webViewRef.current) return;

        console.log("Envoi vers Leaflet");
        console.log(
            "Nombre de conducteurs envoyés :",
            drivers.length
        );
        webViewRef.current.postMessage(
            JSON.stringify(drivers)
        );

    }, [drivers, mapReady]);
    if (!html) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator
                    size="large"
                    color="#0B6E4F"
                />
            </View>
        );
    }

    return (
        <WebView
  ref={webViewRef}
  originWhitelist={["*"]}
  source={{ html }}
  javaScriptEnabled
  domStorageEnabled
  startInLoadingState
  onLoadEnd={() => setMapReady(true)}

  onMessage={(event) => {
    console.log(
      "Message WebView :",
      event.nativeEvent.data
    );
  }}

  style={styles.map}
/>
    );
}

const styles = StyleSheet.create({
    map: {
        flex: 1,
    },

    loading: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});