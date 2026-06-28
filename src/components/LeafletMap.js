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
            style={styles.map}
            onMessage={(event) => {

                if (event.nativeEvent.data === "READY") {

                    setMapReady(true);

                }

            }}
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