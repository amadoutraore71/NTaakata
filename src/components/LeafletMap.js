import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    ActivityIndicator,
    StyleSheet,
    View,
} from "react-native";

import { WebView } from "react-native-webview";

export default function LeafletMap({
    html,
    mode = "drivers",
    drivers = [],
    searchingDriver = null,
    onDriverSelected,
    onRouteInfo,
}) {
    const webViewRef = useRef(null);

    const [mapReady, setMapReady] =
        useState(false);

    // ======================================================
    // DEBUG
    // ======================================================

    console.log(
        "🟢 LeafletMap :",
        {
            searchingDriver:
                searchingDriver?.name ??
                null,

            searchingDriverId:
                searchingDriver?.id ??
                null,

            drivers:
                drivers?.length ?? 0,

            mode,
        }
    );

    // ======================================================
    // Quand le HTML change
    // ======================================================

    useEffect(() => {
        setMapReady(false);
    }, [html]);

    // ======================================================
    // ENVOYER LES CONDUCTEURS
    // ======================================================

    useEffect(() => {
        if (
            !mapReady ||
            !webViewRef.current
        ) {
            return;
        }

        console.log(
            "📤 Conducteurs envoyés à Leaflet :",
            drivers?.length ?? 0
        );

        webViewRef.current.postMessage(
            JSON.stringify(
                drivers || []
            )
        );
    }, [
        drivers,
        mapReady,
    ]);

    // ======================================================
    // GESTION DU CONDUCTEUR RECHERCHÉ
    // ======================================================

    useEffect(() => {
        if (
            !mapReady ||
            !webViewRef.current
        ) {
            return;
        }

        // ==================================================
        // AUCUNE RECHERCHE ACTIVE
        // ==================================================

        if (!searchingDriver) {
            console.log(
                "🧹 FIN DE RECHERCHE → suppression ligne"
            );

            webViewRef.current.postMessage(
                JSON.stringify({
                    type: "clear_search",
                })
            );

            return;
        }

        // ==================================================
        // RECHERCHE ACTIVE
        // ==================================================

        console.log(
            "📤 Conducteur actuellement recherché :",
            searchingDriver.name,
            searchingDriver.id
        );

        webViewRef.current.postMessage(
            JSON.stringify({
                type: "searching_driver",
                driver: searchingDriver,
            })
        );
    }, [
        searchingDriver,
        mapReady,
    ]);

    // ======================================================
    // MESSAGE WEBVIEW
    // ======================================================

    const handleMessage = useCallback(
        (event) => {
            const message =
                event.nativeEvent.data;

            console.log(
                "📩 WebView -> React Native :",
                message
            );

            try {
                const data =
                    JSON.parse(message);

                switch (data.type) {
                    // ======================================
                    // CARTE PRÊTE
                    // ======================================

                    case "ready":
                        console.log(
                            "✅ Carte prête"
                        );

                        setMapReady(true);
                        break;

                    // ======================================
                    // DEBUG
                    // ======================================

                    case "debug":
                        console.log(
                            "🗺",
                            data.message
                        );
                        break;

                    // ======================================
                    // CONDUCTEUR SÉLECTIONNÉ
                    // ======================================

                    case "driver_selected":
                        console.log(
                            "✅ DRIVER SELECTED REÇU"
                        );

                        console.log(
                            data.driver
                        );

                        onDriverSelected?.(
                            data.driver
                        );

                        break;

                    // ======================================
                    // INFORMATIONS ROUTE
                    // ======================================

                    case "route_info":
                        console.log(
                            "✅ ROUTE INFO REÇU"
                        );

                        onRouteInfo?.({
                            distance:
                                data.distance,

                            duration:
                                data.duration,

                            eta:
                                data.eta,
                        });

                        break;

                    // ======================================
                    // ERREUR
                    // ======================================

                    case "error":
                        console.error(
                            "❌ Erreur carte :",
                            data.message,
                            data.line
                                ? `(ligne ${data.line})`
                                : ""
                        );

                        break;

                    default:
                        break;
                }
            } catch (error) {
                console.error(
                    "❌ Impossible de parser le message WebView :",
                    message,
                    error
                );
            }
        },
        [
            onDriverSelected,
            onRouteInfo,
        ]
    );

    // ======================================================
    // PAS DE HTML
    // ======================================================

    if (!html) {
        return (
            <View
                style={styles.loading}
            >
                <ActivityIndicator
                    size="large"
                    color="#0B6E4F"
                />
            </View>
        );
    }

    // ======================================================
    // WEBVIEW
    // ======================================================

    return (
        <WebView
            ref={webViewRef}
            source={{
                html,
            }}
            originWhitelist={[
                "*",
            ]}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            onLoadEnd={() => {
                console.log(
                    "🌍 WebView chargée"
                );
            }}
            onMessage={
                handleMessage
            }
            onError={(event) => {
                console.error(
                    "❌ Erreur WebView :",
                    event.nativeEvent
                );
            }}
            onHttpError={(event) => {
                console.error(
                    "❌ Erreur HTTP WebView :",
                    event.nativeEvent
                );
            }}
            style={styles.map}
        />
    );
}

const styles =
    StyleSheet.create({
        map: {
            flex: 1,
        },

        loading: {
            flex: 1,
            justifyContent:
                "center",
            alignItems:
                "center",
        },
    });