import { useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
export default function LeafletMap({html,
  drivers, }) {
    const webViewRef = useRef(null);
    useEffect(() => {

  if (!webViewRef.current)
    return;

  webViewRef.current.postMessage(
    JSON.stringify(drivers)
  );

}, [drivers]);
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