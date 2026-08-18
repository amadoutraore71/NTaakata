export default function generateMapHtml({
  mode = "drivers",
  passengerLocation,
  driverLocation = null,
  drivers = [],
  icons,
  searchingDriver = null,
}) {
  return `
<!DOCTYPE html>
<html>

<head>

<meta charset="utf-8"/>

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet/dist/leaflet.css"
/>

<style>

html,
body,
#map {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.leaflet-container {
  background: #F5F5F5;
}

</style>

</head>

<body>

<div id="map"></div>

<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>

<script>

window.ReactNativeWebView.postMessage(
  JSON.stringify({
    type: "debug",
    message: "Le script HTML démarre",
  })
);

window.onerror = function(
  message,
  source,
  line,
  col,
  error
) {

  window.ReactNativeWebView.postMessage(
    JSON.stringify({
      type: "error",
      message: String(message),
      line,
      col,
      stack: error?.stack,
    })
  );

  return true;
};


// =====================================================
// PASSAGER
// =====================================================

const PASSENGER = {
  latitude: ${passengerLocation.latitude},
  longitude: ${passengerLocation.longitude},
};


// =====================================================
// MODE
// =====================================================

const mode = "${mode}";

const SEARCHING_DRIVER =
  ${JSON.stringify(searchingDriver)};


window.ReactNativeWebView.postMessage(
  JSON.stringify({
    type: "debug",
    message: "MODE = " + mode,
  })
);


// =====================================================
// CARTE
// =====================================================

const map = L.map("map", {
  zoomControl: false,
}).setView(
  [
    PASSENGER.latitude,
    PASSENGER.longitude,
  ],
  15
);


// =====================================================
// OPENSTREETMAP
// =====================================================

L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }
).addTo(map);


// =====================================================
// VARIABLES
// =====================================================

const driverMarkers = {};

let driversMapInitialized = false;

let routeLayer = null;

let searchLineLayer = null;

let searchAnimation = null;

let currentSearchingDriver = null;
let searchActive = false;
let selectedDriver = null;

let selectedDriverId = null;

let firstRoute = true;

let lastDriverPosition = null;

let routeRequestInProgress = false;


// =====================================================
// ICÔNE PASSAGER
// =====================================================

const passengerIcon = L.icon({
  iconUrl: "${icons.passenger}",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});


// =====================================================
// MARQUEUR PASSAGER
// =====================================================

L.marker(
  [
    PASSENGER.latitude,
    PASSENGER.longitude,
  ],
  {
    icon: passengerIcon,
  }
).addTo(map);


// =====================================================
// CERCLE PASSAGER
// =====================================================

L.circle(
  [
    PASSENGER.latitude,
    PASSENGER.longitude,
  ],
  {
    radius: 40,
    color: "#16A34A",
    fillColor: "#22C55E",
    fillOpacity: 0.25,
    weight: 2,
  }
).addTo(map);


// =====================================================
// ICÔNES CONDUCTEURS
// =====================================================

const carIcon = L.icon({
  iconUrl: "${icons.car}",
  iconSize: [42, 42],
  iconAnchor: [21, 42],
  popupAnchor: [0, -42],
});


const motoIcon = L.icon({
  iconUrl: "${icons.moto}",
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});


// =====================================================
// ANIMATION MARQUEUR
// =====================================================

function animateMarker(
  marker,
  newPosition
) {

  if (marker._animationFrame) {

    cancelAnimationFrame(
      marker._animationFrame
    );

  }

  const start =
    marker.getLatLng();

  const end =
    L.latLng(
      newPosition[0],
      newPosition[1]
    );

  const duration = 500;

  const startTime =
    performance.now();


  function animate(time) {

    const progress =
      Math.min(
        (time - startTime) / duration,
        1
      );


    const lat =
      start.lat +
      (end.lat - start.lat) *
        progress;


    const lng =
      start.lng +
      (end.lng - start.lng) *
        progress;


    marker.setLatLng([
      lat,
      lng,
    ]);


    if (progress < 1) {

      marker._animationFrame =
        requestAnimationFrame(
          animate
        );

    } else {

      marker.setLatLng(end);

      marker._animationFrame =
        null;
    }
  }


  marker._animationFrame =
    requestAnimationFrame(
      animate
    );
}


// =====================================================
// POSITION D'AFFICHAGE
//
// IMPORTANT :
// Les coordonnées du conducteur restent intactes.
// On décale uniquement le marqueur VISUELLEMENT
// lorsque plusieurs conducteurs sont quasiment
// au même endroit.
// =====================================================

function getDisplayPosition(driver, index, drivers) {
  const lat = Number(driver.latitude);
  const lng = Number(driver.longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return [lat, lng];
  }

  // Conducteurs situés à moins de 40 m
  const nearbyDrivers = drivers.filter((other) => {
    if (!other || other.id === driver.id) {
      return false;
    }

    if (
      other.latitude == null ||
      other.longitude == null
    ) {
      return false;
    }

    const distance = map.distance(
      [lat, lng],
      [
        Number(other.latitude),
        Number(other.longitude),
      ]
    );

    return distance < 40;
  });

  // Aucun conducteur proche
  if (nearbyDrivers.length === 0) {
    return [lat, lng];
  }

  // ------------------------------------------------------
  // Groupe stable
  // ------------------------------------------------------

  const group = [
    driver,
    ...nearbyDrivers,
  ]
    .filter(
      (item, position, array) =>
        array.findIndex(
          (element) =>
            element.id === item.id
        ) === position
    )
    .sort((a, b) =>
      String(a.id).localeCompare(
        String(b.id)
      )
    );

  const groupIndex =
    group.findIndex(
      (item) =>
        item.id === driver.id
    );

  if (groupIndex === -1) {
    return [lat, lng];
  }

  // ------------------------------------------------------
  // Décalage visuel
  // ------------------------------------------------------

  const radius = 0.00025;

  const angle =
    (
      groupIndex *
      (360 / group.length)
    ) *
    Math.PI /
    180;

  const displayLat =
    lat +
    Math.cos(angle) * radius;

  const displayLng =
    lng +
    Math.sin(angle) * radius;

  return [
    displayLat,
    displayLng,
  ];
}
// =====================================================
// AFFICHER LES CONDUCTEURS
// =====================================================

function showDrivers(
  drivers
) {

  window.ReactNativeWebView.postMessage(
    JSON.stringify({
      type: "debug",
      message:
        "Nombre de conducteurs reçus : " +
        drivers.length,
    })
  );


  window.ReactNativeWebView.postMessage(
    JSON.stringify({
      type: "debug",
      message:
        "showDrivers() appelée",
    })
  );


  const activeIds =
    new Set();


  // ===================================================
  // CRÉATION / MISE À JOUR
  // ===================================================

  drivers.forEach(
    (driver, index) => {

      // -----------------------------------------------
      // Vérification
      // -----------------------------------------------

      if (
        driver.latitude == null ||
        driver.longitude == null
      ) {

        return;
      }


      if (!driver.id) {

        return;
      }


      activeIds.add(
        driver.id
      );


      // -----------------------------------------------
      // Position réelle
      // -----------------------------------------------

      const realPosition = [
        Number(driver.latitude),
        Number(driver.longitude),
      ];


      // -----------------------------------------------
      // Position visuelle
      // -----------------------------------------------

      const displayPosition =
        getDisplayPosition(
          driver,
          index,
          drivers
        );


      console.log(
        "🚗 Conducteur :",
        driver.name,
        driver.id,
        realPosition,
        "display =",
        displayPosition
      );


      // =================================================
      // MARQUEUR EXISTANT
      // =================================================

      if (
        driverMarkers[driver.id]
      ) {

        animateMarker(
          driverMarkers[driver.id],
          displayPosition
        );

        return;
      }


      // =================================================
      // CRÉATION MARQUEUR
      // =================================================

      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: "debug",
          message:
            "Création du marqueur : " +
            driver.name +
            " (" +
            driver.latitude +
            ", " +
            driver.longitude +
            ")",
        })
      );


      // =================================================
      // TYPE DE VÉHICULE
      // =================================================

      let driverIcon;


      if (
        driver.vehicleType
          ?.toLowerCase() ===
        "moto"
      ) {

        driverIcon =
          motoIcon;

      } else {

        driverIcon =
          carIcon;
      }


      // =================================================
      // MARQUEUR
      // =================================================

      const marker =
        L.marker(
          displayPosition,
          {
            icon: driverIcon,
            zIndexOffset:
              driver.id ===
              selectedDriverId
                ? 1000
                : 0,
          }
        )
          .addTo(map)
          .bindTooltip(
            driver.name,
            {
              direction: "top",
              offset: [
                0,
                -20
              ],
            }
          );


      // =================================================
      // POPUP
      // =================================================

      marker.bindPopup(
        "<b>" +
        driver.name +
        "</b><br/>" +
        (
          driver.vehicleType ||
          ""
        ) +
        "<br/>" +
        (
          driver.distance != null
            ? Math.round(
                driver.distance
              ) + " m"
            : ""
        )
      );


      // =================================================
      // CLIC CONDUCTEUR
      // =================================================

      marker.on(
        "click",
        () => {

          selectedDriverId =
            driver.id;

          selectedDriver =
            driver;


          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type:
                "driver_selected",

              driver:
                driver,
            })
          );


          // Route vers le conducteur
          drawRoute(
            driver
          );
        }
      );


      // =================================================
      // SAUVEGARDE
      // =================================================

      driverMarkers[
        driver.id
      ] = marker;
    }
  );


  // =====================================================
  // CADRAGE INITIAL
  // =====================================================

  if (
    !driversMapInitialized &&
    drivers.length > 0
  ) {

    const bounds =
      L.latLngBounds([]);


    // Passager
    bounds.extend([
      PASSENGER.latitude,
      PASSENGER.longitude,
    ]);


    // Conducteurs
    drivers.forEach(
      (driver) => {

        if (
          driver.latitude != null &&
          driver.longitude != null
        ) {

          const displayPosition =
            getDisplayPosition(
              driver,
              0,
              drivers
            );


          bounds.extend(
            displayPosition
          );
        }
      }
    );


    if (
      bounds.isValid()
    ) {

      map.fitBounds(
        bounds,
        {
          padding: [
            70,
            70
          ],
          maxZoom: 15,
        }
      );
    }


    driversMapInitialized =
      true;


    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: "debug",
        message:
          "🗺️ Carte cadrée sur passager + conducteurs",
      })
    );
  }

// =====================================================
// SUPPRESSION DES ANCIENS CONDUCTEURS
// =====================================================

// IMPORTANT :
// Si React Native envoie une liste vide,
// on conserve les conducteurs déjà affichés.
//
// Cela permet aux conducteurs de rester visibles
// pendant et après la recherche.

if (drivers.length > 0) {

    Object.keys(driverMarkers).forEach(
        (id) => {

            if (!activeIds.has(id)) {

                map.removeLayer(
                    driverMarkers[id]
                );

                delete driverMarkers[id];

                window.ReactNativeWebView.postMessage(
                    JSON.stringify({
                        type: "debug",
                        message:
                            "🗑 Conducteur supprimé : " +
                            id,
                    })
                );
            }
        }
    );

} else {

    window.ReactNativeWebView.postMessage(
        JSON.stringify({
            type: "debug",
            message:
                "⏸ Liste vide reçue → conducteurs conservés : " +
                Object.keys(driverMarkers).length,
        })
    );
}
  // =====================================================
  // DEBUG
  // =====================================================

  window.ReactNativeWebView.postMessage(
    JSON.stringify({
      type: "debug",
      message:
        "Marqueurs actuellement sur la carte : " +
        Object.keys(
          driverMarkers
        ).length,
    })
  );
}


// =====================================================
// DISTANCE
// =====================================================

function distanceBetween(
  lat1,
  lon1,
  lat2,
  lon2
) {

  const R = 6371000;


  const dLat =
    (lat2 - lat1) *
    Math.PI /
    180;


  const dLon =
    (lon2 - lon1) *
    Math.PI /
    180;


  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +

    Math.cos(
      lat1 *
      Math.PI /
      180
    ) *

    Math.cos(
      lat2 *
      Math.PI /
      180
    ) *

    Math.sin(dLon / 2) *
      Math.sin(dLon / 2);


  return (
    R *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
}


// =====================================================
// SUPPRIMER LIGNE DE RECHERCHE
// =====================================================

// =====================================================
// SUPPRIMER LIGNE DE RECHERCHE
// =====================================================

function removeSearchingLine() {

    console.log(
        "🧹 removeSearchingLine() appelée"
    );

    // ==========================================
    // ARRÊTER L'ANIMATION
    // ==========================================

    if (searchAnimation !== null) {

        clearInterval(
            searchAnimation
        );

        searchAnimation = null;

        console.log(
            "🛑 Animation de recherche arrêtée"
        );
    }

    // ==========================================
    // SUPPRIMER LA LIGNE BLEUE
    // ==========================================

    if (searchLineLayer !== null) {

        try {

            if (
                map.hasLayer(
                    searchLineLayer
                )
            ) {

                map.removeLayer(
                    searchLineLayer
                );

            }

        } catch (error) {

            console.log(
                "⚠️ Erreur suppression ligne :",
                error
            );

        }

        searchLineLayer = null;

        console.log(
            "🧹 Ligne bleue supprimée"
        );
    }

    // ==========================================
    // RÉINITIALISER LE CONDUCTEUR RECHERCHÉ
    // ==========================================

    currentSearchingDriver = null;
}
function drawSearchingLine(
  driver
) {

  if (!driver) {
    return;
  }

  // Une recherche doit être explicitement active
  if (!searchActive) {
    console.log(
      "⛔ Recherche inactive → ligne non créée"
    );
    return;
  }


  if (
    currentSearchingDriver ===
    driver.id
  ) {

    return;
  }


  removeSearchingLine();


  searchLineLayer =
    L.polyline(
      [
        [
          PASSENGER.latitude,
          PASSENGER.longitude,
        ],

        [
          Number(
            driver.latitude
          ),

          Number(
            driver.longitude
          ),
        ],
      ],
      {
        color: "#3B82F6",
        weight: 5,
        opacity: 0.9,
        dashArray: "12 12",
        lineCap: "round",
      }
    ).addTo(map);


  searchLineLayer.bringToFront();


  window.ReactNativeWebView.postMessage(
    JSON.stringify({
      type: "debug",
      message:
        "✅ searchLine créée",
    })
  );


  let offset = 0;


  searchAnimation =
    setInterval(
      () => {

        if (
          !searchLineLayer
        ) {

          return;
        }


        offset += 2;


        searchLineLayer.setStyle({
          dashOffset:
            String(-offset),
        });

      },
      40
    );


  currentSearchingDriver =
    driver.id;
}


// =====================================================
// ROUTE
// =====================================================

async function drawRoute(
  driver
) {

  console.log(
    "➡️ drawRoute appelée"
  );


  if (
    routeRequestInProgress
  ) {

    return;
  }


  routeRequestInProgress =
    true;


  try {

    // -----------------------------------------------
    // Éviter les requêtes inutiles
    // -----------------------------------------------

    if (
      lastDriverPosition
    ) {

      const distance =
        distanceBetween(
          lastDriverPosition.latitude,
          lastDriverPosition.longitude,
          driver.latitude,
          driver.longitude
        );


      if (
        distance < 15
      ) {

        return;
      }
    }


    lastDriverPosition = {
      latitude:
        Number(driver.latitude),

      longitude:
        Number(driver.longitude),
    };


    // -----------------------------------------------
    // OSRM
    // -----------------------------------------------

    const url =
      "https://router.project-osrm.org/route/v1/driving/" +

      PASSENGER.longitude +
      "," +
      PASSENGER.latitude +

      ";" +

      driver.longitude +
      "," +
      driver.latitude +

      "?overview=full&geometries=geojson";


    const response =
      await fetch(url);


    const data =
      await response.json();


    if (
      !data.routes ||
      data.routes.length === 0
    ) {

      return;
    }


    const route =
      data.routes[0];


    const latLngs =
      route.geometry.coordinates.map(
        point => [
          point[1],
          point[0],
        ]
      );


    // -----------------------------------------------
    // Ancienne route
    // -----------------------------------------------

    if (
      routeLayer
    ) {

      map.removeLayer(
        routeLayer
      );
    }


    // -----------------------------------------------
    // Nouvelle route
    // -----------------------------------------------

    routeLayer =
      L.polyline(
        latLngs,
        {
          color: "#16A34A",
          weight: 6,
        }
      ).addTo(map);


    // -----------------------------------------------
    // Cadrage route
    // -----------------------------------------------

    const bounds =
      L.latLngBounds([
        [
          PASSENGER.latitude,
          PASSENGER.longitude,
        ],

        [
          driver.latitude,
          driver.longitude,
        ],
      ]);


    if (
      firstRoute
    ) {

      map.flyToBounds(
        bounds,
        {
          padding: [
            80,
            80
          ],
          maxZoom: 16,
          duration: 1.2,
        }
      );


      firstRoute =
        false;
    }


    // -----------------------------------------------
    // Informations route
    // -----------------------------------------------

    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: "route_info",
        distance:
          route.distance,
        duration:
          route.duration,
        eta:
          Date.now() +
          route.duration *
          1000,
      })
    );

  } catch (error) {

    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: "error",
        message:
          error.message,
      })
    );

  } finally {

    routeRequestInProgress =
      false;
  }
}


// =====================================================
// MESSAGES REACT NATIVE
// =====================================================

function handleReactNativeMessage(
  event
) {

  try {

    const data =
      JSON.parse(
        event.data
      );


    // =================================================
    // LISTE DES CONDUCTEURS
    // =================================================

    if (
      Array.isArray(data)
    ) {

      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: "debug",
          message:
            "🚗 Conducteurs reçus dans Leaflet : " +
            data.length,
        })
      );


      showDrivers(
        data
      );

      return;
    }

// =================================================
// CONDUCTEUR ACTUELLEMENT RECHERCHÉ
// =================================================

if (
  data.type === "searching_driver"
) {

  window.ReactNativeWebView.postMessage(
    JSON.stringify({
      type: "debug",
      message:
        "🔍 Conducteur recherché : " +
        data.driver?.name,
    })
  );
searchActive = true;
  if (data.driver) {

    drawSearchingLine(
      data.driver
    );

  } else {

    // Aucun conducteur actuellement recherché
    removeSearchingLine();

    currentSearchingDriver = null;

    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: "debug",
        message:
          "🧹 Ligne de recherche supprimée",
      })
    );
  }

  return;
}


// =====================================================
// NETTOYER LA RECHERCHE
// =====================================================

if (
  data.type === "clear_search"
) {

  console.log(
    "🧹 CLEAR SEARCH REÇU"
  );

  // ==========================================
  // 1. DÉSACTIVER LA RECHERCHE
  // ==========================================

  searchActive = false;

  // ==========================================
  // 2. SUPPRIMER LA LIGNE
  // ==========================================

  removeSearchingLine();

  // ==========================================
  // 3. RÉINITIALISER
  // ==========================================

  currentSearchingDriver = null;

  // ==========================================
  // 4. CONSERVER LES CONDUCTEURS
  // ==========================================

  const remainingDrivers =
    Object.keys(
      driverMarkers
    ).length;

  console.log(
    "🚕 Conducteurs conservés :",
    remainingDrivers
  );

  // ==========================================
  // 5. CONFIRMATION
  // ==========================================

  window.ReactNativeWebView.postMessage(
    JSON.stringify({
      type: "debug",
      message:
        "🧹 Recherche terminée — ligne supprimée — conducteurs conservés : " +
        remainingDrivers,
    })
  );

  return;
}
  } catch (error) {

    console.error(
      "❌ Erreur réception message :",
      error
    );
  }
}


// =====================================================
// SUPPORT WEBVIEW
// =====================================================

document.addEventListener(
  "message",
  handleReactNativeMessage
);

window.addEventListener(
  "message",
  handleReactNativeMessage
);


// =====================================================
// CARTE PRÊTE
// =====================================================

window.ReactNativeWebView.postMessage(
  JSON.stringify({
    type: "ready",
  })
);

</script>

</body>

</html>
`;
}