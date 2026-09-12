import { useCallback, useEffect, useRef, useState } from "react";

import { ActivityIndicator, StyleSheet, View } from "react-native";

import { WebView } from "react-native-webview";

export default function LeafletMap({
  html,
  mode = "drivers",
  drivers = [],
  searchingDriver = null,
  onDriverSelected,
  onRouteInfo,
  showDriverRoute = false,
  startDriverRoute = false,
  
  startDestinationRoute = false,
}) {
  const webViewRef = useRef(null);

  const destinationRouteStartedRef = useRef(false);

  const driverRouteStartedRef = useRef(false);
const driverRouteShownRef = useRef(false);
const pendingDriverRouteRef = useRef(null);
  // ======================================================
  // HTML RÉELLEMENT CHARGÉ DANS LA WEBVIEW
  // ======================================================

  const loadedHtmlRef = useRef(null);

  const [mapReady, setMapReady] = useState(false);

  // ======================================================
  // DEBUG
  // ======================================================

  console.log("🟢 LeafletMap :", {
    searchingDriver: searchingDriver?.name ?? null,

    searchingDriverId: searchingDriver?.id ?? null,

    drivers: drivers?.length ?? 0,

    mode,

    startDestinationRoute,
  });
// ======================================================
// AFFICHER ROUTE CONDUCTEUR → PASSAGER
// UNE SEULE FOIS, APRÈS CHARGEMENT COMPLET DE LA WEBVIEW
// ======================================================

useEffect(() => {
  if (!showDriverRoute) {
    return;
  }

  if (mode !== "tracking") {
    return;
  }

  if (!drivers || drivers.length === 0) {
    return;
  }
if (driverRouteShownRef.current) {
  return;
}
  const driver = drivers[0];

  const driverId =
    driver?.id ??
    driver?.docId ??
    driver?.userId;

  const latitude =
    Number(driver?.latitude);

  const longitude =
    Number(driver?.longitude);

  if (
    !driverId ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    console.log(
      "❌ Conducteur invalide pour affichage route"
    );

    return;
  }

  const driverForRoute = {
    ...driver,

    id: driverId,

    latitude,

    longitude,
  };

  // ----------------------------------------------------
  // TOUJOURS mémoriser le conducteur
  // ----------------------------------------------------

  pendingDriverRouteRef.current =
    driverForRoute;

  // ----------------------------------------------------
  // WebView pas prête
  // ----------------------------------------------------

  if (
    !mapReady ||
    !webViewRef.current ||
    loadedHtmlRef.current !== html
  ) {
    console.log(
      "⏳ Route conducteur mémorisée, attente WebView..."
    );

    return;
  }

  // ----------------------------------------------------
  // Route déjà envoyée
  // ----------------------------------------------------

  if (driverRouteShownRef.current) {
    return;
  }

  // ----------------------------------------------------
  // ENVOI
  // ----------------------------------------------------

  console.log(
    "🛣️ ENVOI ROUTE CONDUCTEUR → PASSAGER"
  );

  driverRouteShownRef.current =
    true;

  pendingDriverRouteRef.current =
    null;

  webViewRef.current.postMessage(
    JSON.stringify({
      type:
        "show_driver_route",

      driver:
        driverForRoute,
    })
  );

}, [
  showDriverRoute,
  mode,
  mapReady,
  html,
]);
useEffect(() => {
  setMapReady(false);

  loadedHtmlRef.current = null;

  destinationRouteStartedRef.current = false;

  driverRouteStartedRef.current = false;

  driverRouteShownRef.current = false;

  pendingDriverRouteRef.current =
    null;
}, [html]);

  // ======================================================
  // RESET DESTINATION ROUTE
  // ======================================================

  useEffect(() => {
    if (!startDestinationRoute) {
      destinationRouteStartedRef.current = false;
    }
  }, [startDestinationRoute]);

  // ======================================================
  // ENVOYER LES CONDUCTEURS
  // ======================================================

  useEffect(() => {
    if (!mapReady || !webViewRef.current || loadedHtmlRef.current !== html) {
      return;
    }

    if (!drivers || !drivers.length) {
      return;
    }

    const driver = drivers[0];

    // ==================================================
    // MODE TRACKING
    // ==================================================

    if (mode === "tracking") {
      console.log("📍 Position conducteur envoyée à Leaflet :", {
        id: driver?.id ?? driver?.docId ?? driver?.userId ?? null,

        latitude: driver?.latitude,

        longitude: driver?.longitude,
      });

      webViewRef.current.postMessage(
        JSON.stringify({
          type: "driver_position",

          driver,
        }),
      );

      return;
    }

    // ==================================================
    // MODE CONDUCTEURS PROCHES
    // ==================================================

    console.log("📤 Conducteurs envoyés à Leaflet :", drivers.length);

    webViewRef.current.postMessage(
      JSON.stringify({
        type: "drivers",

        drivers,
      }),
    );
  }, [drivers, mapReady, mode, html]);
// ======================================================
// RELANCER UNE ROUTE EN ATTENTE APRÈS CHARGEMENT WEBVIEW
// ======================================================

useEffect(() => {
  if (!mapReady) {
    return;
  }

  if (
    !webViewRef.current ||
    loadedHtmlRef.current !== html
  ) {
    return;
  }

  const driver =
    pendingDriverRouteRef.current;

  if (
    !driver ||
    driverRouteShownRef.current
  ) {
    return;
  }

  if (!showDriverRoute) {
    return;
  }

  console.log(
    "✅ WebView prête → envoi route en attente"
  );

  driverRouteShownRef.current =
    true;

  pendingDriverRouteRef.current =
    null;

  webViewRef.current.postMessage(
    JSON.stringify({
      type:
        "show_driver_route",

      driver,
    })
  );

}, [
  mapReady,
  html,
  showDriverRoute,
]);

 // ======================================================
// TRAJET CONDUCTEUR → PASSAGER
// ======================================================
//
// IMPORTANT :
//
// Ce trajet ne démarre JAMAIS automatiquement.
//
// Il démarre uniquement lorsque
// startDriverRoute === true.
//
// Cela correspond au bouton
// « Faire déplacer le conducteur ».
// ======================================================

useEffect(() => {
    if (
        !mapReady ||
        !webViewRef.current ||
        loadedHtmlRef.current !== html
    ) {
        return;
    }

    // Pas de trajet demandé
    if (!startDriverRoute) {
        return;
    }

    // Le trajet vers la destination ne doit pas
    // être lancé en même temps.
    if (startDestinationRoute) {
        return;
    }

    if (mode !== "tracking") {
        return;
    }

    if (!drivers || !drivers.length) {
        console.log(
            "❌ Aucun conducteur pour démarrer le trajet."
        );
        return;
    }

    if (driverRouteStartedRef.current) {
        return;
    }

    const driver = drivers[0];

    if (!driver) {
        return;
    }

    const driverId =
        driver.id ??
        driver.docId ??
        driver.userId;

    const latitude =
        Number(driver.latitude);

    const longitude =
        Number(driver.longitude);

    if (
        !driverId ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {
        console.log(
            "❌ Conducteur invalide pour le trajet :",
            {
                driverId,
                latitude,
                longitude,
            }
        );

        return;
    }

    const driverForRoute = {
        ...driver,
        id: driverId,
        latitude,
        longitude,
    };

    console.log(
        "🚦 DÉMARRAGE MANUEL TRAJET CONDUCTEUR → PASSAGER"
    );

    console.log(
        "🚗 Conducteur :",
        driverForRoute
    );

    try {
        webViewRef.current.postMessage(
            JSON.stringify({
                type: "start_driver_route",
                driver: driverForRoute,
            })
        );

        driverRouteStartedRef.current = true;

        console.log(
            "✅ Message start_driver_route envoyé à Leaflet"
        );

    } catch (error) {
        console.error(
            "❌ Erreur envoi start_driver_route :",
            error
        );
    }

}, [
    mapReady,
    html,
    mode,
    drivers,
    startDriverRoute,
    startDestinationRoute,
]);
// ======================================================
// TRAJET CONDUCTEUR → DESTINATION
// ======================================================
//
// Ce trajet commence UNIQUEMENT lorsque
// startDestinationRoute === true.
//
// Il ne dépend pas de startDriverRoute.
// ======================================================

useEffect(() => {

  if (
    !mapReady ||
    !webViewRef.current ||
    loadedHtmlRef.current !== html
  ) {
    return;
  }

  if (!startDestinationRoute) {
    return;
  }

  if (mode !== "tracking") {
    return;
  }

  if (
    destinationRouteStartedRef.current
  ) {
    return;
  }

  if (
    !drivers ||
    !drivers.length
  ) {
    console.log(
      "❌ Aucun conducteur pour démarrer la route vers destination."
    );

    return;
  }

  const driver =
    drivers[0];

  if (!driver) {
    return;
  }

  const driverId =
    driver?.id ??
    driver?.docId ??
    driver?.userId;

  const latitude =
    Number(driver?.latitude);

  const longitude =
    Number(driver?.longitude);

  if (
    !driverId ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    console.log(
      "❌ Conducteur invalide pour route destination :",
      {
        driverId,
        latitude,
        longitude,
      }
    );

    return;
  }

  const driverForDestination = {
    ...driver,

    id:
      driverId,

    latitude,

    longitude,
  };

  console.log(
    "🚦 ENVOI ROUTE CONDUCTEUR → DESTINATION"
  );

  console.log(
    "📍 Conducteur :",
    driverForDestination
  );

  // Verrou avant l'envoi pour éviter
  // plusieurs démarrages.
  destinationRouteStartedRef.current =
    true;

  webViewRef.current.postMessage(
    JSON.stringify({
      type:
        "start_destination_route",

      driver:
        driverForDestination,
    })
  );

}, [
  mapReady,
  html,
  mode,
  drivers,
  startDestinationRoute,
]);


  // ======================================================
// CONDUCTEUR RECHERCHÉ
// ======================================================

useEffect(() => {
  if (
    !mapReady ||
    !webViewRef.current ||
    loadedHtmlRef.current !== html
  ) {
    return;
  }

  // ==================================================
  // MODE TRACKING
  // ==================================================
  //
  // Une fois qu'un conducteur est accepté,
  // on NE DOIT PLUS effacer la ligne de route.
  // ==================================================

  if (mode === "tracking") {
    return;
  }

  // ==================================================
  // MODE RECHERCHE
  // ==================================================

  if (!searchingDriver) {
    console.log(
      "🧹 FIN DE RECHERCHE → suppression affichage recherche"
    );

    webViewRef.current.postMessage(
      JSON.stringify({
        type: "clear_search",
      })
    );

    return;
  }

  // ==================================================
  // CONDUCTEUR ACTUELLEMENT RECHERCHÉ
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
  html,
  mode,
]);

  // ======================================================
  // MESSAGE WEBVIEW
  // ======================================================

  const handleMessage = useCallback(
    (event) => {
      const message = event.nativeEvent.data;

      console.log("📩 WebView -> React Native :", message);

      try {
        const data = JSON.parse(message);

        switch (data.type) {
          // ==================================
          // CARTE PRÊTE
          // ==================================

          case "ready":
            console.log("✅ Carte prête");

            loadedHtmlRef.current = html;

            setMapReady(true);

            break;

          // ==================================
          // DEBUG
          // ==================================

          case "debug":
            console.log("🗺", data.message);

            break;

          // ==================================
          // CONDUCTEUR SÉLECTIONNÉ
          // ==================================

          

          case "driver_selected":
            console.log("✅ DRIVER SELECTED REÇU");

            console.log(data.driver);

            onDriverSelected?.(data.driver);

            break;

          // ==================================
          // ROUTE INFO
          // ==================================

          case "route_info":
            console.log("✅ ROUTE INFO REÇU");

            onRouteInfo?.({
              distance: data.distance,
              duration: data.duration,
              eta: data.eta,
            });

            break;

          // ==================================
          // ROUTE DESTINATION
          // ==================================

          case "destination_route_info":
            console.log("✅ ROUTE DESTINATION REÇUE");

            onRouteInfo?.({
              distance: data.distance,
              duration: data.duration,
              eta: data.eta,
            });

            break;

          // ==================================
          // ERREUR
          // ==================================

          case "error":
            console.error(
              "❌ Erreur carte :",
              data.message,
              data.line ? `(ligne ${data.line})` : "",
            );

        

            break;
case "webview_debug":

  console.log(
    "🧪 WEBVIEW :",
    data.message
  );

  break;


case "webview_console_log":

  console.log(
    "🌐 WEBVIEW LOG :",
    data.message
  );

  break;


case "webview_console_error":

  console.error(
    "💥 WEBVIEW CONSOLE ERROR :",
    data.message
  );

  break;


case "webview_js_error":

  console.error(
    "💥💥 ERREUR JAVASCRIPT WEBVIEW"
  );

  console.error(
    "Message :",
    data.message
  );

  console.error(
    "Fichier :",
    data.source
  );

  console.error(
    "Ligne :",
    data.line
  );

  console.error(
    "Colonne :",
    data.column
  );

  break;


case "webview_promise_error":

  console.error(
    "💥 PROMESSE WEBVIEW :",
    data.message
  );

  break;
          // ==================================
          // PAR DÉFAUT
          // ==================================

          default:
            console.log("ℹ️ Message WebView ignoré :", data.type);

            break;
        }
      } catch (error) {
        console.error(
          "❌ Impossible de parser le message WebView :",
          message,
          error,
        );
      }
    },

    [html, onDriverSelected, onRouteInfo],
  );

  // ======================================================
  // PAS DE HTML
  // ======================================================

  if (!html) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0B6E4F" />
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
      originWhitelist={["*"]}
      javaScriptEnabled
      domStorageEnabled
      startInLoadingState
      // ==================================================
      // DÉBUT CHARGEMENT
      // ==================================================

onLoadStart={() => {
  console.log(
    "🌐 WebView chargement démarré"
  );

  loadedHtmlRef.current = null;

  // Le contenu de la WebView est en train
  // d'être rechargé, mais on NE SUPPRIME PAS
  // une route qui attend encore son affichage.

  driverRouteStartedRef.current = false;

  destinationRouteStartedRef.current = false;

  setMapReady(false);
}}
      // ==================================================
      // FIN CHARGEMENT
      // ==================================================
onLoadEnd={() => {
  console.log(
    "🌍 WebView chargée"
  );

  loadedHtmlRef.current =
    html;

  setMapReady(true);
}}
      // ==================================================
      // MESSAGE WEBVIEW
      // ==================================================

      onMessage={handleMessage}
      injectedJavaScriptBeforeContentLoaded={`
(function() {

  function send(type, data) {
    try {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type,
          ...data,
        })
      );
    } catch (e) {}
  }

  // ==================================================
  // CAPTURER console.log
  // ==================================================

  const originalLog =
    console.log;

  console.log =
    function() {

      const args =
        Array.from(arguments);

      try {

        send(
          "webview_console_log",
          {
            message:
              args
                .map((arg) => {

                  try {
                    return typeof arg === "string"
                      ? arg
                      : JSON.stringify(arg);

                  } catch {
                    return String(arg);
                  }

                })
                .join(" "),
          }
        );

      } catch {}

      originalLog.apply(
        console,
        arguments
      );
    };


  // ==================================================
  // CAPTURER console.error
  // ==================================================

  const originalError =
    console.error;

  console.error =
    function() {

      const args =
        Array.from(arguments);

      try {

        send(
          "webview_console_error",
          {
            message:
              args
                .map((arg) => {

                  try {
                    return typeof arg === "string"
                      ? arg
                      : JSON.stringify(arg);

                  } catch {
                    return String(arg);
                  }

                })
                .join(" "),
          }
        );

      } catch {}

      originalError.apply(
        console,
        arguments
      );
    };


  // ==================================================
  // ERREUR JAVASCRIPT
  // ==================================================

  window.addEventListener(
    "error",
    function(event) {

      send(
        "webview_js_error",
        {
          message:
            event.message ||
            "Erreur JavaScript inconnue",

          source:
            event.filename || "",

          line:
            event.lineno || 0,

          column:
            event.colno || 0,
        }
      );

    }
  );


  // ==================================================
  // PROMESSE NON GÉRÉE
  // ==================================================

  window.addEventListener(
    "unhandledrejection",
    function(event) {

      send(
        "webview_promise_error",
        {
          message:
            event.reason?.message ||
            String(event.reason),
        }
      );

    }
  );


  // ==================================================
  // TEST WEBVIEW
  // ==================================================

  send(
    "webview_debug",
    {
      message:
        "Injection JavaScript effectuée",
    }
  );

})();

true;
`}
      onNavigationStateChange={(navState) => {
  console.log(
    "🌐 WebView navigation :",
    navState.url
  );
}}
      // ==================================================
      // ERREUR WEBVIEW
      // ==================================================

      onError={(event) => {
        console.error("❌ Erreur WebView :", event.nativeEvent);
      }}
      onHttpError={(event) => {
        console.error("❌ Erreur HTTP WebView :", event.nativeEvent);
      }}
      style={styles.map}
    />
  );
}

// ========================================================
// STYLES
// ========================================================

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
