export default function generateMapHtml({
  mode = "drivers",
  passengerLocation,
  driverLocation = null,
  drivers = [],
  searchingDriver = null,
  icons = {},
}) {

  const PASSENGER = passengerLocation
    ? {
        latitude: Number(
          passengerLocation.latitude
        ),
        longitude: Number(
          passengerLocation.longitude
        ),
        address:
          passengerLocation.address || "",
      }
    : null;


  const DRIVER = driverLocation
    ? {
        ...driverLocation,

        latitude: Number(
          driverLocation.latitude
        ),

        longitude: Number(
          driverLocation.longitude
        ),
      }
    : null;


  const SEARCHING_DRIVER =
    searchingDriver
      ? {
          ...searchingDriver,

          latitude: Number(
            searchingDriver.latitude
          ),

          longitude: Number(
            searchingDriver.longitude
          ),
        }
      : null;


  const initialDrivers =
    Array.isArray(drivers)
      ? drivers
      : [];


  const carIcon =
    icons.car || "";


  const motoIcon =
    icons.moto || "";


  const passengerIcon =
    icons.passenger || "";


  const initialMode =
    mode || "drivers";


  return `
<!DOCTYPE html>
<html>

<head>

<meta
  charset="UTF-8"
/>

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
/>

<style>

html,
body {

  margin: 0;

  padding: 0;

  width: 100%;

  height: 100%;

  overflow: hidden;

}


#map {

  width: 100%;

  height: 100%;

}


.leaflet-control-attribution {

  font-size: 9px;

}


.driver-label {

  background: white;

  border: 1px solid #16A34A;

  border-radius: 8px;

  padding: 3px 7px;

  font-size: 11px;

  font-weight: 600;

  white-space: nowrap;

  box-shadow:
    0 2px 5px rgba(
      0,
      0,
      0,
      0.2
    );

}


</style>

</head>


<body>

<div id="map"></div>


<script
  src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
></script>


<script>

const MODE =
  ${JSON.stringify(initialMode)};


const PASSENGER =
  ${JSON.stringify(PASSENGER)};


const DRIVER =
  ${JSON.stringify(DRIVER)};


const SEARCHING_DRIVER =
  ${JSON.stringify(SEARCHING_DRIVER)};


const INITIAL_DRIVERS =
  ${JSON.stringify(initialDrivers)};


const ICONS = {

  car:
    ${JSON.stringify(carIcon)},

  moto:
    ${JSON.stringify(motoIcon)},

  passenger:
    ${JSON.stringify(passengerIcon)},

};


console.log(
  "🗺️ Leaflet démarrage",
  {
    mode: MODE,
    passenger: PASSENGER,
    driver: DRIVER,
    searchingDriver:
      SEARCHING_DRIVER,
    drivers:
      INITIAL_DRIVERS,
  }
);


if (
  !PASSENGER ||
  !Number.isFinite(
    PASSENGER.latitude
  ) ||
  !Number.isFinite(
    PASSENGER.longitude
  )
) {

  console.log(
    "❌ Position passager invalide"
  );

}


const map =
  L.map(
    "map",
    {
      zoomControl: true,
    }
  );


L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,

    attribution:
      "&copy; OpenStreetMap contributors",
  }
).addTo(map);


let passengerMarker =
  null;


let driverMarkers =
  {};


let searchingDriverMarker =
  null;


let searchLineLayer =
  null;


let routeLayer =
  null;


let destinationRouteLayer =
  null;

let destinationRoute =
  [];

// =====================================================
// PROTECTION ROUTE DESTINATION
// =====================================================

let activeDestinationRouteKey =
  null;

let lastDestinationRouteInfoDistance =
  null;
// =====================================================
// ROUTE CONDUCTEUR → PASSAGER
// =====================================================

let driverRoute =
  [];

let driverAnimationFrame =
  null;

let driverAnimationToken =
  0;

let driverRouteActive =
  false;
let destinationAnimationFrame =
  null;


let destinationAnimationToken =
  0;


let destinationRouteToken =
  0;


let destinationModeActive =
  false;


let currentSearchingDriver =
  null;


let lastDriverPosition =
  null;


let firstRoute =
  true;


const passengerIconObject =
  ICONS.passenger
    ? L.icon({

        iconUrl:
          ICONS.passenger,

        iconSize: [
          42,
          42,
        ],

        iconAnchor: [
          21,
          21,
        ],

      })
    : null;


const carIconObject =
  ICONS.car
    ? L.icon({

        iconUrl:
          ICONS.car,

        iconSize: [
          42,
          42,
        ],

        iconAnchor: [
          21,
          21,
        ],

      })
    : null;


const motoIconObject =
  ICONS.moto
    ? L.icon({

        iconUrl:
          ICONS.moto,

        iconSize: [
          42,
          42,
        ],

        iconAnchor: [
          21,
          21,
        ],

      })
    : null;


// =====================================================
// ENVOI MESSAGE VERS REACT NATIVE
// =====================================================

function sendMessage(
  data
) {

  try {

    if (
      window.ReactNativeWebView
    ) {

      window.ReactNativeWebView.postMessage(
        JSON.stringify(data)
      );

    }

  } catch (
    error
  ) {

    console.log(
      "❌ Erreur postMessage :",
      error
    );

  }

}
// =====================================================
// ENVOYER DISTANCE DESTINATION UNE SEULE FOIS
// =====================================================

function sendDestinationRouteInfo(
  distance,
  duration = 0,
  eta = 0
) {
  const numericDistance =
    Number(distance);

  if (
    !Number.isFinite(
      numericDistance
    )
  ) {
    return;
  }

  // Arrondir au centimètre près pour
  // éviter les variations minuscules.
  const roundedDistance =
    Math.round(
      numericDistance * 100
    ) / 100;

  // Ne rien envoyer si la distance
  // est exactement la même que précédemment.
  if (
    lastDestinationRouteInfoDistance !== null &&
    Math.abs(
      roundedDistance -
      lastDestinationRouteInfoDistance
    ) < 0.01
  ) {
    return;
  }

  lastDestinationRouteInfoDistance =
    roundedDistance;

  sendMessage({
    type:
      "destination_route_info",

    distance:
      roundedDistance,

    duration:
      Number(duration) || 0,

    eta:
      Number(eta) || 0,
  });
}

// =====================================================
// MARQUEUR PASSAGER
// =====================================================

function showPassenger() {

  if (
    !PASSENGER
  ) {

    return;

  }


  if (
    !Number.isFinite(
      PASSENGER.latitude
    ) ||
    !Number.isFinite(
      PASSENGER.longitude
    )
  ) {

    return;

  }


  if (
    passengerMarker
  ) {

    try {

      map.removeLayer(
        passengerMarker
      );

    } catch (
      error
    ) {}

  }


  passengerMarker =
    passengerIconObject
      ? L.marker(
          [
            PASSENGER.latitude,
            PASSENGER.longitude,
          ],
          {
            icon:
              passengerIconObject,

            zIndexOffset:
              1000,
          }
        ).addTo(map)
      : L.marker(
          [
            PASSENGER.latitude,
            PASSENGER.longitude,
          ],
          {
            zIndexOffset:
              1000,
          }
        ).addTo(map);


  passengerMarker.bindPopup(
    "📍 Passager"
  );


  console.log(
    "📍 Passager affiché :",
    PASSENGER
  );

}


// =====================================================
// ANIMATION MARQUEUR
// =====================================================

function animateMarker(
  marker,
  from,
  to,
  duration = 1000
) {

  if (
    !marker ||
    !from ||
    !to
  ) {

    return;

  }


  const startTime =
    performance.now();


  function animate(
    currentTime
  ) {

    const elapsed =
      currentTime -
      startTime;


    const progress =
      Math.min(
        elapsed /
          duration,
        1
      );


    const latitude =
      from.latitude +
      (
        to.latitude -
        from.latitude
      ) *
        progress;


    const longitude =
      from.longitude +
      (
        to.longitude -
        from.longitude
      ) *
        progress;


    marker.setLatLng(
      [
        latitude,
        longitude,
      ]
    );


    if (
      progress < 1
    ) {

      marker._animationFrame =
        requestAnimationFrame(
          animate
        );

    } else {

      marker._animationFrame =
        null;

    }

  }


  if (
    marker._animationFrame
  ) {

    cancelAnimationFrame(
      marker._animationFrame
    );

  }


  marker._animationFrame =
    requestAnimationFrame(
      animate
    );

}


// =====================================================
// POSITION D'AFFICHAGE
// =====================================================

function getDisplayPosition(
  driver
) {

  if (
    !driver
  ) {

    return null;

  }


  const latitude =
    Number(
      driver.latitude
    );


  const longitude =
    Number(
      driver.longitude
    );


  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {

    return null;

  }


  return {
    latitude,
    longitude,
  };

}


// =====================================================
// SUPPRIMER TOUS LES MARQUEURS
// =====================================================

function clearAllDriverMarkers() {

  Object.keys(
    driverMarkers
  ).forEach(
    (id) => {

      const marker =
        driverMarkers[id];


      if (
        marker
      ) {

        try {

          if (
            marker._animationFrame
          ) {

            cancelAnimationFrame(
              marker._animationFrame
            );

            marker._animationFrame =
              null;

          }


          if (
            map.hasLayer(
              marker
            )
          ) {

            map.removeLayer(
              marker
            );

          }

        } catch (
          error
        ) {

          console.log(
            "⚠️ Erreur suppression marqueur :",
            error
          );

        }

      }


      delete driverMarkers[id];

    }
  );

}


// =====================================================
// MISE À JOUR DES CONDUCTEURS
// =====================================================

function updateDrivers(
  driversList
) {

  if (
    destinationModeActive
  ) {

    return;

  }


  if (
    !Array.isArray(
      driversList
    )
  ) {

    driversList =
      [];

  }


  console.log(
    "🚗 Nombre de conducteurs reçus :",
    driversList.length
  );


  const activeIds =
    new Set();


  driversList.forEach(
    (
      driver
    ) => {

      if (
        !driver
      ) {

        return;

      }


      const id =
        driver.id ||
        driver.docId ||
        driver.userId;


      if (
        !id
      ) {

        return;

      }


      const position =
        getDisplayPosition(
          driver
        );


      if (
        !position
      ) {

        return;

      }


      activeIds.add(
        String(id)
      );


      const icon =
        driver.vehicleType === "moto" ||
        driver.vehicleType === "motorbike"
          ? motoIconObject
          : carIconObject;


      let marker =
        driverMarkers[
          String(id)
        ];


      if (
        !marker
      ) {

        marker =
          icon
            ? L.marker(
                [
                  position.latitude,
                  position.longitude,
                ],
                {
                  icon,
                  zIndexOffset:
                    1000,
                }
              ).addTo(map)
            : L.marker(
                [
                  position.latitude,
                  position.longitude,
                ],
                {
                  zIndexOffset:
                    1000,
                }
              ).addTo(map);


        marker.driverData =
          driver;


        marker.on(
          "click",
          function() {

            sendMessage({

              type:
                "driver_selected",

              driver:
                marker.driverData,

            });

          }
        );


        driverMarkers[
          String(id)
        ] =
          marker;


        console.log(
          "📍 Conducteur affiché :",
          driver.name ||
          id
        );

      } else {

        const current =
          marker.getLatLng();


        animateMarker(
          marker,
          {
            latitude:
              current.lat,

            longitude:
              current.lng,
          },
          position,
          700
        );


        marker.driverData =
          driver;

      }

    }
  );


  Object.keys(
    driverMarkers
  ).forEach(
    (id) => {

      if (
        !activeIds.has(
          String(id)
        )
      ) {

        const marker =
          driverMarkers[id];


        if (
          marker
        ) {

          try {

            map.removeLayer(
              marker
            );

          } catch (
            error
          ) {}

        }


        delete driverMarkers[id];

      }

    }
  );


  if (
    firstRoute &&
    driversList.length &&
    PASSENGER
  ) {

    const bounds =
      [
        [
          PASSENGER.latitude,
          PASSENGER.longitude,
        ],
      ];


    driversList.forEach(
      (
        driver
      ) => {

        const position =
          getDisplayPosition(
            driver
          );


        if (
          position
        ) {

          bounds.push(
            [
              position.latitude,
              position.longitude,
            ]
          );

        }

      }
    );


    if (
      bounds.length > 1
    ) {

      try {

        map.fitBounds(
          bounds,
          {
            padding: [
              50,
              50,
            ],

            maxZoom: 15,
          }
        );

      } catch (
        error
      ) {

        console.log(
          "⚠️ Erreur cadrage carte :",
          error
        );

      }

    }


    firstRoute =
      false;

  }

}
// =====================================================
// POINT LE PLUS PROCHE SUR LA ROUTE
// =====================================================

function getClosestRoutePoint(
  latitude,
  longitude
) {

  if (
    !driverRoute ||
    driverRoute.length < 2
  ) {
    return null;
  }

  let closest = null;

  let minimumDistance =
    Infinity;

  for (
    let i = 0;
    i < driverRoute.length - 1;
    i++
  ) {

    const a =
      driverRoute[i];

    const b =
      driverRoute[i + 1];

    const aLat =
      Number(a[0]);

    const aLng =
      Number(a[1]);

    const bLat =
      Number(b[0]);

    const bLng =
      Number(b[1]);

    const dx =
      bLng - aLng;

    const dy =
      bLat - aLat;

    const denominator =
      dx * dx +
      dy * dy;

    let t = 0;

    if (denominator > 0) {

      t =
        (
          (longitude - aLng) * dx +
          (latitude - aLat) * dy
        ) /
        denominator;

      t =
        Math.max(
          0,
          Math.min(
            1,
            t
          )
        );
    }

    const projectedLatitude =
      aLat +
      (
        bLat - aLat
      ) *
      t;

    const projectedLongitude =
      aLng +
      (
        bLng - aLng
      ) *
      t;

    const distance =
      map.distance(
        [
          latitude,
          longitude,
        ],

        [
          projectedLatitude,
          projectedLongitude,
        ]
      );

    if (
      distance <
      minimumDistance
    ) {

      minimumDistance =
        distance;

      closest = {
        segmentIndex:
          i,

        latitude:
          projectedLatitude,

        longitude:
          projectedLongitude,

        distance,
      };
    }
  }

  return closest;
}


// =====================================================
// RÉDUIRE LA ROUTE CONDUCTEUR → PASSAGER
// =====================================================

function updateRemainingDriverRoute(
  latitude,
  longitude
) {

  if (
    !routeLayer ||
    !driverRoute ||
    driverRoute.length < 2
  ) {
    return;
  }

  const closest =
    getClosestRoutePoint(
      latitude,
      longitude
    );

  if (!closest) {
    return;
  }

  // ===================================================
  // ROUTE RESTANTE
  // ===================================================

  const remainingRoute = [
    [
      latitude,
      longitude,
    ],

    ...driverRoute.slice(
      closest.segmentIndex + 1
    ),
  ];

  // ===================================================
  // METTRE À JOUR LA LIGNE
  // ===================================================

  if (
    remainingRoute.length >= 2
  ) {

    routeLayer.setLatLngs(
      remainingRoute
    );

  } else {

    routeLayer.setLatLngs([
      [
        latitude,
        longitude,
      ],

      [
        PASSENGER.latitude,
        PASSENGER.longitude,
      ],
    ]);
  }

  // ===================================================
  // CALCUL DISTANCE RESTANTE
  // ===================================================

  let remainingDistance =
    map.distance(
      [
        latitude,
        longitude,
      ],

      [
        closest.latitude,
        closest.longitude,
      ]
    );

  // Distance à parcourir entre le point
  // projeté et la fin de la route.

  for (
    let i =
      closest.segmentIndex + 1;

    i <
      driverRoute.length - 1;

    i++
  ) {

    remainingDistance +=
      map.distance(
        [
          driverRoute[i][0],
          driverRoute[i][1],
        ],

        [
          driverRoute[i + 1][0],
          driverRoute[i + 1][1],
        ]
      );
  }

  remainingDistance =
    Math.max(
      remainingDistance,
      0
    );

  // ===================================================
  // DISTANCE / ETA
  // ===================================================

  sendMessage({
    type:
      "route_info",

    distance:
      remainingDistance,

    duration:
      0,

    eta:
      0,
  });

  // ===================================================
  // ARRIVÉE
  // ===================================================

  if (
    remainingDistance <= 15
  ) {

    if (routeLayer) {

      try {

        map.removeLayer(
          routeLayer
        );

      } catch (error) {}

      routeLayer =
        null;
    }

    sendMessage({
      type:
        "route_info",

      distance:
        0,

      duration:
        0,

      eta:
        0,
    });

    console.log(
      "🏁 Conducteur arrivé au passager"
    );
  }
}
// =====================================================
// MISE À JOUR DE LA POSITION D'UN CONDUCTEUR
// =====================================================

// =====================================================
// POSITION CONDUCTEUR REÇUE DE FIRESTORE
// =====================================================

function updateDriverPosition(
  driver
) {

if (!driver) {
  return;
}

  // ===================================================
  // IDENTIFIANT
  // ===================================================

  const driverId =
    driver.id ||
    driver.docId ||
    driver.userId;

  if (!driverId) {

    console.log(
      "❌ Position conducteur : ID manquant"
    );

    return;
  }

  // ===================================================
  // COORDONNÉES
  // ===================================================

  const latitude =
    Number(
      driver.latitude
    );

  const longitude =
    Number(
      driver.longitude
    );

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {

    console.log(
      "❌ Position conducteur : coordonnées invalides",
      driver
    );

    return;
  }

  // ===================================================
  // RÉCUPÉRER LE MARQUEUR
  // ===================================================

  let marker =
    driverMarkers[
      String(driverId)
    ];

  // ===================================================
  // CRÉER LE MARQUEUR SI BESOIN
  // ===================================================

  if (!marker) {

    showAcceptedDriver({
      ...driver,

      id:
        driverId,

      latitude,

      longitude,
    });

    marker =
      driverMarkers[
        String(driverId)
      ];

    if (!marker) {
      return;
    }
  }

  // ===================================================
  // POSITION ACTUELLE
  // ===================================================

  const current =
    marker.getLatLng();

  // ===================================================
  // ANIMATION VISUELLE COURTE
  // ===================================================
  //
  // IMPORTANT :
  // ce n'est PAS le moteur du déplacement.
  //
  // Firestore reste la source de vérité.
  //
  // Cette petite interpolation sert uniquement
  // à éviter un déplacement visuel brutal du marqueur.
  // ===================================================

  animateMarker(
    marker,

    {
      latitude:
        current.lat,

      longitude:
        current.lng,
    },

    {
      latitude,
      longitude,
    },

    250
  );

  // ===================================================
  // DONNÉES CONDUCTEUR
  // ===================================================

  marker.driverData =
    driver;

  lastDriverPosition = {
    latitude,

    longitude,
  };

  // ===================================================
  // RÉDUIRE LA ROUTE RESTANTE
  // ===================================================

 // ===================================================
// TRAJET CONDUCTEUR → PASSAGER
// ===================================================

if (
  !destinationModeActive
) {
  updateRemainingDriverRoute(
    latitude,
    longitude
  );
}

// ===================================================
// TRAJET CONDUCTEUR → DESTINATION
// ===================================================

if (
  destinationModeActive &&
  destinationRouteLayer &&
  destinationRoute.length >= 2
) {
  updateRemainingDestinationRoute(
    latitude,
    longitude
  );
}

  console.log(
    "📍 Position conducteur mise à jour :",
    {
      driverId,
      latitude,
      longitude,
    }
  );
}
// =====================================================
// CONDUCTEUR ACCEPTÉ
// =====================================================

function showAcceptedDriver(
  driver
) {

  if (
    !driver
  ) {

    return;

  }


  const normalized =
    {
      ...driver,

      id:
        driver.id ||
        driver.docId ||
        driver.userId,
    };


  if (
    !normalized.id
  ) {

    console.log(
      "❌ Conducteur accepté sans ID"
    );

    return;

  }


  clearAllDriverMarkers();


  const latitude =
    Number(
      normalized.latitude
    );


  const longitude =
    Number(
      normalized.longitude
    );


  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {

    console.log(
      "❌ Position conducteur acceptée invalide"
    );

    return;

  }


  const icon =
    normalized.vehicleType === "moto" ||
    normalized.vehicleType === "motorbike"
      ? motoIconObject
      : carIconObject;


  const marker =
    icon
      ? L.marker(
          [
            latitude,
            longitude,
          ],
          {
            icon,
            zIndexOffset:
              2000,
          }
        ).addTo(map)
      : L.marker(
          [
            latitude,
            longitude,
          ],
          {
            zIndexOffset:
              2000,
          }
        ).addTo(map);


  marker.driverData =
    normalized;


  driverMarkers[
    String(normalized.id)
  ] =
    marker;


  lastDriverPosition =
    {
      latitude,
      longitude,
    };


  map.setView(
    [
      latitude,
      longitude,
    ],
    15
  );


  console.log(
    "🚗 Conducteur accepté affiché :",
    normalized
  );

}


// =====================================================
// ROUTE OSRM
// =====================================================

async function fetchRoute(
  start,
  end
) {

  if (
    !start ||
    !end
  ) {

    return null;

  }


  const startLat =
    Number(
      start.latitude
    );


  const startLng =
    Number(
      start.longitude
    );


  const endLat =
    Number(
      end.latitude
    );


  const endLng =
    Number(
      end.longitude
    );


  if (
    !Number.isFinite(startLat) ||
    !Number.isFinite(startLng) ||
    !Number.isFinite(endLat) ||
    !Number.isFinite(endLng)
  ) {

    console.log(
      "❌ Coordonnées invalides pour OSRM"
    );

    return null;

  }


  const url =
    "https://router.project-osrm.org/route/v1/driving/" +
    startLng +
    "," +
    startLat +
    ";" +
    endLng +
    "," +
    endLat +
    "?overview=full&geometries=geojson";


  try {

    const response =
      await fetch(
        url
      );


    if (
      !response.ok
    ) {

      throw new Error(
        "HTTP " +
        response.status
      );

    }


    const data =
      await response.json();


    if (
      data.code !== "Ok" ||
      !data.routes ||
      !data.routes.length
    ) {

      console.log(
        "❌ OSRM n'a retourné aucune route"
      );

      return null;

    }


    const route =
      data.routes[0];


    const coordinates =
      route.geometry.coordinates.map(
        (point) => [
          point[1],
          point[0],
        ]
      );


    return {

      coordinates,

      distance:
        route.distance,

      duration:
        route.duration,

    };


  } catch (
    error
  ) {

    console.error(
      "❌ Erreur récupération route OSRM :",
      error
    );


    sendMessage({

      type:
        "error",

      message:
        "Impossible de récupérer la route OSRM",

    });


    return null;

  }

}


// =====================================================
// AFFICHER ROUTE CONDUCTEUR → PASSAGER
// =====================================================

// =====================================================
// ROUTE CONDUCTEUR → PASSAGER
// =====================================================

// =====================================================
// ROUTE CONDUCTEUR → PASSAGER
// =====================================================
//
// moveDriver = false
//     → affiche la route uniquement
//
// moveDriver = true
//     → affiche la route + déplace le conducteur
//
// =====================================================

// =====================================================
// ROUTE CONDUCTEUR → PASSAGER
// =====================================================
//
// Cette fonction NE DÉPLACE PAS le conducteur.
//
// Elle fait uniquement :
// 1. récupérer la route OSRM
// 2. afficher la route
// 3. envoyer la distance initiale
//
// Le déplacement réel est assuré par
// driverMovementService + Firestore.
//
// =====================================================

async function startDriverRoute(driver) {

  if (!driver) {
    console.log(
      "❌ Aucun conducteur pour afficher la route"
    );

    return;
  }

  if (!PASSENGER) {
    console.log(
      "❌ Position passager absente"
    );

    return;
  }

  // ===================================================
  // POSITION CONDUCTEUR
  // ===================================================

  const start = {
    latitude: Number(
      driver.latitude
    ),

    longitude: Number(
      driver.longitude
    ),
  };

  // ===================================================
  // POSITION PASSAGER
  // ===================================================

  const end = {
    latitude: Number(
      PASSENGER.latitude
    ),

    longitude: Number(
      PASSENGER.longitude
    ),
  };

  // ===================================================
  // VALIDATION
  // ===================================================

  if (
    !Number.isFinite(start.latitude) ||
    !Number.isFinite(start.longitude) ||
    !Number.isFinite(end.latitude) ||
    !Number.isFinite(end.longitude)
  ) {

    console.log(
      "❌ Coordonnées invalides pour route conducteur → passager"
    );

    return;
  }

  console.log(
    "🛣️ CALCUL ROUTE CONDUCTEUR → PASSAGER",
    {
      start,
      end,
    }
  );

  // ===================================================
  // OSRM
  // ===================================================

  const result =
    await fetchRoute(
      start,
      end
    );

  if (!result) {
    console.log(
      "❌ Impossible de récupérer la route OSRM"
    );

    return;
  }

  if (
    !result.coordinates ||
    result.coordinates.length < 2
  ) {

    console.log(
      "❌ Route OSRM invalide"
    );

    return;
  }

  // ===================================================
  // SAUVEGARDER LA GÉOMÉTRIE
  // ===================================================

  driverRoute =
    result.coordinates;

  console.log(
    "📍 Nombre de points OSRM :",
    driverRoute.length
  );

  // ===================================================
  // SUPPRIMER UNIQUEMENT L'ANCIENNE ROUTE
  // ===================================================

  if (routeLayer) {

    try {
      map.removeLayer(
        routeLayer
      );
    } catch (error) {
      console.log(
        "⚠️ Erreur suppression ancienne route :",
        error
      );
    }

    routeLayer =
      null;
  }

  // ===================================================
  // TRACER LA ROUTE COMPLÈTE
  // ===================================================

  routeLayer =
    L.polyline(
      driverRoute,
      {
        color:
          "#16A34A",

        weight:
          5,

        opacity:
          0.9,
      }
    ).addTo(map);

  // ===================================================
  // DISTANCE INITIALE
  // ===================================================

  sendMessage({
    type:
      "route_info",

    distance:
      result.distance,

    duration:
      result.duration,

    eta:
      Math.ceil(
        result.duration / 60
      ),
  });

  // ===================================================
  // CADRAGE
  // ===================================================

  try {

    map.fitBounds(
      routeLayer.getBounds(),
      {
        padding: [
          50,
          50,
        ],
      }
    );

  } catch (error) {

    console.log(
      "⚠️ Impossible de cadrer la route :",
      error
    );

  }

  console.log(
    "✅ ROUTE CONDUCTEUR → PASSAGER AFFICHÉE"
  );

  console.log(
    "🛑 Conducteur immobile jusqu'au démarrage manuel"
  );
}
// =====================================================
// EFFACER ROUTE CONDUCTEUR
// =====================================================

function clearDriverRoute() {

  if (
    routeLayer
  ) {

    try {

      map.removeLayer(
        routeLayer
      );

    } catch (
      error
    ) {

      console.log(
        "⚠️ Erreur suppression route :",
        error
      );

    }


    routeLayer =
      null;

  }

}
  // =====================================================
// ROUTE CONDUCTEUR → DESTINATION
// =====================================================

async function startDestinationRoute(
  driver
) {

  if (
    !driver
  ) {

    console.log(
      "❌ Aucun conducteur pour la route vers destination"
    );

    return;

  }


 const destination =
  driver.destination;

if (
  !destination
) {
  console.log(
    "❌ Destination absente du conducteur"
  );

  sendMessage({
    type:
      "error",

    message:
      "Destination absente",
  });

  return;
}

const driverId =
  driver.id ||
  driver.docId ||
  driver.userId;

const destinationKey =
  driverId +
  "|" +
  Number(
    destination.latitude
  ) +
  "," +
  Number(
    destination.longitude
  );

// ===================================================
// ÉVITER DE RELANCER LA MÊME ROUTE
// ===================================================

if (
  activeDestinationRouteKey ===
  destinationKey
) {
  console.log(
    "⏭️ Route destination déjà active → ignorée"
  );

  return;
}

 


  const start =
    {
      latitude:
        Number(
          driver.latitude
        ),

      longitude:
        Number(
          driver.longitude
        ),
    };


  const end =
    {
      latitude:
        Number(
          destination.latitude
        ),

      longitude:
        Number(
          destination.longitude
        ),
    };


  if (
    !Number.isFinite(
      start.latitude
    ) ||
    !Number.isFinite(
      start.longitude
    ) ||
    !Number.isFinite(
      end.latitude
    ) ||
    !Number.isFinite(
      end.longitude
    )
  ) {

    console.log(
      "❌ Coordonnées destination invalides"
    );

    return;

  }


  console.log(
    "🚦 DÉMARRAGE ROUTE CONDUCTEUR → DESTINATION",
    {
      start,
      end,
    }
  );

destinationModeActive =
  true;

activeDestinationRouteKey =
  destinationKey;

lastDestinationRouteInfoDistance =
  null;
  destinationRouteToken =
    ++destinationAnimationToken;


  if (
    destinationAnimationFrame
  ) {

    cancelAnimationFrame(
      destinationAnimationFrame
    );

    destinationAnimationFrame =
      null;

  }


  const result =
    await fetchRoute(
      start,
      end
    );


 if (
  !result
) {

  destinationModeActive =
    false;

  activeDestinationRouteKey =
    null;

  lastDestinationRouteInfoDistance =
    null;

  console.log(
    "❌ Route destination impossible à calculer"
  );

  return;
}


  destinationRoute =
    result.coordinates;


  if (
    destinationRouteLayer
  ) {

    try {

      map.removeLayer(
        destinationRouteLayer
      );

    } catch (
      error
    ) {

      console.log(
        "⚠️ Erreur suppression ancienne route destination :",
        error
      );

    }

  }


  destinationRouteLayer =
    L.polyline(
      destinationRoute,
      {
        color:
          "#16A34A",

        weight:
          5,

        opacity:
          0.9,
      }
    ).addTo(map);


  try {

    map.fitBounds(
      destinationRouteLayer.getBounds(),
      {
        padding: [
          50,
          50,
        ],
      }
    );

  } catch (
    error
  ) {

    console.log(
      "⚠️ Impossible de cadrer la route destination :",
      error
    );

  }


  // ===================================================
  // MARQUEUR CONDUCTEUR
  // ===================================================

// driverId est déjà défini plus haut


  let marker =
    driverId
      ? driverMarkers[
          String(driverId)
        ]
      : null;


  if (
    !marker
  ) {

    const vehicleIcon =
      driver.vehicleType === "moto" ||
      driver.vehicleType === "motorbike"
        ? motoIconObject
        : carIconObject;


    marker =
      vehicleIcon
        ? L.marker(
            [
              start.latitude,
              start.longitude,
            ],
            {
              icon:
                vehicleIcon,

              zIndexOffset:
                3000,
            }
          ).addTo(map)
        : L.marker(
            [
              start.latitude,
              start.longitude,
            ],
            {
              zIndexOffset:
                3000,
            }
          ).addTo(map);


    if (
      driverId
    ) {

      driverMarkers[
        String(driverId)
      ] =
        marker;

    }

  }


  marker.driverData =
    driver;


  lastDriverPosition =
    {
      latitude:
        start.latitude,

      longitude:
        start.longitude,
    };


 sendDestinationRouteInfo(
  result.distance,
  result.duration,
  Math.ceil(
    result.duration / 60
  )
);


  console.log(
    "✅ Route conducteur → destination affichée"
  );

}

// =====================================================
// RÉDUIRE PROGRESSIVEMENT LA ROUTE CONDUCTEUR → DESTINATION
// =====================================================

function updateRemainingDestinationRoute(
  latitude,
  longitude
) {

  if (
    !destinationRouteLayer ||
    !Array.isArray(destinationRoute) ||
    destinationRoute.length < 2
  ) {
    return;
  }

  const driverPoint =
    L.latLng(
      Number(latitude),
      Number(longitude)
    );

  let closestSegmentIndex = 0;
  let closestPoint = null;
  let closestDistance = Infinity;

  // ===================================================
  // TROUVER LE POINT LE PLUS PROCHE SUR UN SEGMENT
  // ===================================================

  for (
    let i = 0;
    i < destinationRoute.length - 1;
    i++
  ) {

    const a =
      L.latLng(
        destinationRoute[i][0],
        destinationRoute[i][1]
      );

    const b =
      L.latLng(
        destinationRoute[i + 1][0],
        destinationRoute[i + 1][1]
      );

    const ax = a.lng;
    const ay = a.lat;

    const bx = b.lng;
    const by = b.lat;

    const dx =
      bx - ax;

    const dy =
      by - ay;

    const lengthSquared =
      dx * dx +
      dy * dy;

    let t = 0;

    if (lengthSquared > 0) {

      t =
        (
          (driverPoint.lng - ax) * dx +
          (driverPoint.lat - ay) * dy
        ) /
        lengthSquared;

      t =
        Math.max(
          0,
          Math.min(
            1,
            t
          )
        );
    }

    const projectedLng =
      ax +
      dx * t;

    const projectedLat =
      ay +
      dy * t;

    const projected =
      L.latLng(
        projectedLat,
        projectedLng
      );

    const distance =
      map.distance(
        driverPoint,
        projected
      );

    if (
      distance <
      closestDistance
    ) {

      closestDistance =
        distance;

      closestSegmentIndex =
        i;

      closestPoint =
        projected;
    }
  }

  if (!closestPoint) {
    return;
  }

  // ===================================================
  // CONSTRUIRE LA ROUTE RESTANTE
  // ===================================================

  const remainingRoute = [
    [
      driverPoint.lat,
      driverPoint.lng
    ],
    [
      closestPoint.lat,
      closestPoint.lng
    ],
    ...destinationRoute.slice(
      closestSegmentIndex + 1
    )
  ];

  // ===================================================
  // SUPPRIMER LES POINTS INUTILES
  // ===================================================

  const cleanedRoute =
    remainingRoute.filter(
      (point, index) => {

        if (index === 0) {
          return true;
        }

        const previous =
          remainingRoute[index - 1];

        const distance =
          map.distance(
            L.latLng(
              previous[0],
              previous[1]
            ),
            L.latLng(
              point[0],
              point[1]
            )
          );

        return distance > 0.5;
      }
    );

  // ===================================================
  // REDESSINER LA ROUTE RESTANTE
  // ===================================================

  if (
    cleanedRoute.length >= 2
  ) {

    destinationRouteLayer.setLatLngs(
      cleanedRoute
    );

  } else {

    destinationRouteLayer.setLatLngs([
      [
        driverPoint.lat,
        driverPoint.lng
      ],

      destinationRoute[
        destinationRoute.length - 1
      ]
    ]);
  }

  // ===================================================
  // CALCUL DISTANCE RESTANTE
  // ===================================================

  let remainingDistance = 0;

  for (
    let i = 0;
    i < cleanedRoute.length - 1;
    i++
  ) {

    const a =
      L.latLng(
        cleanedRoute[i][0],
        cleanedRoute[i][1]
      );

    const b =
      L.latLng(
        cleanedRoute[i + 1][0],
        cleanedRoute[i + 1][1]
      );

    remainingDistance +=
      map.distance(
        a,
        b
      );
  }

  remainingDistance =
    Math.max(
      0,
      remainingDistance
    );

  // ===================================================
  // DISTANCE / ETA
  // ===================================================

 sendDestinationRouteInfo(
  remainingDistance,
  0,
  0
);

 // ===================================================
// ARRIVÉE À DESTINATION
// ===================================================

if (
  remainingDistance <= 15
) {

  // Supprimer complètement la ligne
  if (
    destinationRouteLayer
  ) {

    try {

      if (
        map.hasLayer(
          destinationRouteLayer
        )
      ) {
        map.removeLayer(
          destinationRouteLayer
        );
      }

    } catch (error) {

      console.log(
        "⚠️ Erreur suppression ligne destination :",
        error
      );
    }

    destinationRouteLayer =
      null;
  }

  sendDestinationRouteInfo(
  0,
  0,
  0
);

  console.log(
    "🏁 Conducteur arrivé à destination"
  );

  console.log(
    "🧹 Ligne destination supprimée"
  );
}
}
// =====================================================
// ARRÊTER ANIMATION DESTINATION
// =====================================================

function stopDestinationRoute() {

  destinationAnimationToken++;


  if (
    destinationAnimationFrame
  ) {

    cancelAnimationFrame(
      destinationAnimationFrame
    );

    destinationAnimationFrame =
      null;

  }


  destinationModeActive =
    false;


  console.log(
    "🛑 Animation destination arrêtée"
  );

}


// =====================================================
// EFFACER ROUTE DESTINATION
// =====================================================

function clearDestinationRoute() {

  stopDestinationRoute();


  if (
    destinationRouteLayer
  ) {

    try {

      map.removeLayer(
        destinationRouteLayer
      );

    } catch (
      error
    ) {

      console.log(
        "⚠️ Erreur suppression route destination :",
        error
      );

    }


    destinationRouteLayer =
      null;

  }


destinationRoute =
  [];

activeDestinationRouteKey =
  null;

lastDestinationRouteInfoDistance =
  null;

console.log(
  "🧹 Route destination supprimée"
);

}


// =====================================================
// CONDUCTEUR EN RECHERCHE
// =====================================================

function showSearchingDriver(
  driver
) {

  if (
    currentSearchingDriver &&
    currentSearchingDriver.id ===
      driver?.id
  ) {

    return;

  }


  currentSearchingDriver =
    driver;


  if (
    searchLineLayer
  ) {

    try {

      map.removeLayer(
        searchLineLayer
      );

    } catch (
      error
    ) {}

    searchLineLayer =
      null;

  }


  if (
    !driver
  ) {

    return;

  }


  const latitude =
    Number(
      driver.latitude
    );


  const longitude =
    Number(
      driver.longitude
    );


  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {

    return;

  }


  const icon =
    driver.vehicleType === "moto" ||
    driver.vehicleType === "motorbike"
      ? motoIconObject
      : carIconObject;


  if (
    searchingDriverMarker
  ) {

    try {

      map.removeLayer(
        searchingDriverMarker
      );

    } catch (
      error
    ) {}

  }


  searchingDriverMarker =
    icon
      ? L.marker(
          [
            latitude,
            longitude,
          ],
          {
            icon,

            zIndexOffset:
              2500,
          }
        ).addTo(map)
      : L.marker(
          [
            latitude,
            longitude,
          ],
          {
            zIndexOffset:
              2500,
          }
        ).addTo(map);


  searchingDriverMarker.driverData =
    driver;


  searchLineLayer =
    L.polyline(
      [
        [
          latitude,
          longitude,
        ],
        [
          PASSENGER.latitude,
          PASSENGER.longitude,
        ],
      ],
      {
        color:
          "#16A34A",

        weight:
          3,

        dashArray:
          "8,8",

        opacity:
          0.8,
      }
    ).addTo(map);


  try {

    map.fitBounds(
      searchLineLayer.getBounds(),
      {
        padding: [
          50,
          50,
        ],
      }
    );

  } catch (
    error
  ) {}

}


// =====================================================
// SUPPRIMER CONDUCTEUR EN RECHERCHE
// =====================================================

function clearSearchingDriver() {

  currentSearchingDriver =
    null;


  if (
    searchingDriverMarker
  ) {

    try {

      map.removeLayer(
        searchingDriverMarker
      );

    } catch (
      error
    ) {}

    searchingDriverMarker =
      null;

  }


  if (
    searchLineLayer
  ) {

    try {

      map.removeLayer(
        searchLineLayer
      );

    } catch (
      error
    ) {}

    searchLineLayer =
      null;

  }


  console.log(
    "🧹 Conducteur recherché supprimé"
  );

}


// =====================================================
// MESSAGE REACT NATIVE → WEBVIEW
// =====================================================

function handleReactNativeMessage(
  event
) {

  let data =
    event.data;


  try {

    if (
      typeof data === "string"
    ) {

      data =
        JSON.parse(
          data
        );

    }

  } catch (
    error
  ) {

    console.log(
      "⚠️ Message non JSON :",
      data
    );

    return;

  }


  if (
    !data
  ) {

    return;

  }


  console.log(
    "📩 React Native → Leaflet :",
    data
  );


  switch (
    data.type
  ) {
case "driver_position":

  updateDriverPosition(
    data.driver
  );

  break;
    case "drivers":

      if (
        !destinationModeActive
      ) {

        updateDrivers(
          data.drivers || []
        );

      }

      break;


    case "searching_driver":

      showSearchingDriver(
        data.driver
      );

      break;


    case "clear_search":

      clearSearchingDriver();

      break;


case "show_driver_route":

  console.log(
    "🛣️ SHOW DRIVER ROUTE REÇU"
  );

  showAcceptedDriver(
    data.driver
  );

  startDriverRoute(
    data.driver
  );

  break;
 case "start_driver_route":

  console.log(
    "🚦 START DRIVER ROUTE REÇU"
  );

  showAcceptedDriver(
    data.driver
  );

  console.log(
    "🚗 Déplacement contrôlé par driverMovementService"
  );

  break;


    case "start_destination_route":

      console.log(
        "🚦 START DESTINATION ROUTE REÇU"
      );


      showAcceptedDriver(
        data.driver
      );


      startDestinationRoute(
        data.driver
      );

      break;


    case "stop_destination_route":

      clearDestinationRoute();

      break;


    case "clear_driver_route":

      clearDriverRoute();

      break;


    default:

      console.log(
        "ℹ️ Message ignoré :",
        data.type
      );

      break;

  }

}


// =====================================================
// ÉCOUTE DES MESSAGES
// =====================================================

window.addEventListener(
  "message",
  handleReactNativeMessage
);


document.addEventListener(
  "message",
  handleReactNativeMessage
);


// =====================================================
// AFFICHAGE INITIAL DU PASSAGER
// =====================================================

showPassenger();


// =====================================================
// CONDUCTEUR INITIAL
// =====================================================

if (
  MODE === "tracking" &&
  DRIVER
) {

  showAcceptedDriver(
    DRIVER
  );

}


// =====================================================
// CONDUCTEURS INITIAUX
// =====================================================

if (
  MODE === "drivers"
) {

  updateDrivers(
    INITIAL_DRIVERS
  );

}


// =====================================================
// CONDUCTEUR EN RECHERCHE INITIAL
// =====================================================

if (
  SEARCHING_DRIVER
) {

  showSearchingDriver(
    SEARCHING_DRIVER
  );

}


// =====================================================
// CENTRER LA CARTE SUR LE PASSAGER
// =====================================================

if (
  PASSENGER &&
  Number.isFinite(
    PASSENGER.latitude
  ) &&
  Number.isFinite(
    PASSENGER.longitude
  )
) {

  map.setView(
    [
      PASSENGER.latitude,
      PASSENGER.longitude,
    ],
    14
  );

}


// =====================================================
// NOTIFICATION CARTE PRÊTE
// =====================================================

setTimeout(
  function() {

    sendMessage({
      type:
        "ready",
    });

    sendMessage({

      type:
        "debug",

      message:
        "Leaflet initialisé",

    });

  },
  300
);

</script>

</body>

</html>
`;
}