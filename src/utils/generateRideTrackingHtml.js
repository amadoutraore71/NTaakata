export default function generateRideTrackingHtml({
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


/* =====================================================
   PASSAGER
===================================================== */

const PASSENGER = {

    latitude:
        Number(${Number(passengerLocation?.latitude)}),

    longitude:
        Number(${Number(passengerLocation?.longitude)}),

};


/* =====================================================
   CONDUCTEUR ACCEPTÉ
===================================================== */

const DRIVER =
    ${JSON.stringify(driverLocation)};


/* =====================================================
   MODE
===================================================== */

const mode =
    ${JSON.stringify(mode)};

const SEARCHING_DRIVER =
    ${JSON.stringify(searchingDriver)};


/* =====================================================
   CARTE
===================================================== */

const map =
    L.map(
        "map",
        {
            zoomControl: false,
        }
    ).setView(

        [
            PASSENGER.latitude,
            PASSENGER.longitude,
        ],

        15

    );


/* =====================================================
   OPENSTREETMAP
===================================================== */

L.tileLayer(

    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

    {
        maxZoom: 19,

        attribution:
            "&copy; OpenStreetMap contributors",
    }

).addTo(map);


/* =====================================================
   VARIABLES
===================================================== */

const driverMarkers = {};

let driversMapInitialized =
    false;

let searchLineLayer =
    null;

let searchAnimation =
    null;

let currentSearchingDriver =
    null;

let searchActive =
    mode !== "tracking";

let selectedDriver =
    null;

let selectedDriverId =
    null;

let routeLayer =
    null;

let destinationRouteLayer =
    null;

let destinationModeActive =
    false;

let firstRoute =
    true;

let lastDriverPosition =
    null;

let routeRequestInProgress =
    false;


/* =====================================================
   ICÔNE PASSAGER
===================================================== */

const passengerIcon =
    L.icon({

        iconUrl:
            "${icons.passenger}",

        iconSize: [
            40,
            40
        ],

        iconAnchor: [
            20,
            40
        ],

    });


/* =====================================================
   MARQUEUR PASSAGER
===================================================== */

L.marker(

    [
        PASSENGER.latitude,
        PASSENGER.longitude,
    ],

    {
        icon:
            passengerIcon,
    }

).addTo(map);


/* =====================================================
   CERCLE PASSAGER
===================================================== */

L.circle(

    [
        PASSENGER.latitude,
        PASSENGER.longitude,
    ],

    {

        radius:
            40,

        color:
            "#16A34A",

        fillColor:
            "#22C55E",

        fillOpacity:
            0.25,

        weight:
            2,

    }

).addTo(map);


/* =====================================================
   ICÔNE VOITURE
===================================================== */

const carIcon =
    L.icon({

        iconUrl:
            "${icons.car}",

        iconSize: [
            42,
            42
        ],

        iconAnchor: [
            21,
            42
        ],

        popupAnchor: [
            0,
            -42
        ],

    });


/* =====================================================
   ICÔNE MOTO
===================================================== */

const motoIcon =
    L.icon({

        iconUrl:
            "${icons.moto}",

        iconSize: [
            38,
            38
        ],

        iconAnchor: [
            19,
            38
        ],

        popupAnchor: [
            0,
            -38
        ],

    });


/* =====================================================
   POSITION D'AFFICHAGE
===================================================== */

function getDisplayPosition(
    driver,
    index,
    allDrivers
) {

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

        return [
            latitude,
            longitude
        ];

    }


    const nearbyDrivers =
        allDrivers.filter(
            (
                other
            ) => {

                if (
                    !other ||
                    other.id ===
                        driver.id
                ) {

                    return false;

                }

                if (
                    other.latitude ==
                        null ||
                    other.longitude ==
                        null
                ) {

                    return false;

                }

                const distance =
                    map.distance(

                        [
                            latitude,
                            longitude
                        ],

                        [
                            Number(
                                other.latitude
                            ),

                            Number(
                                other.longitude
                            )
                        ]

                    );

                return (
                    distance < 40
                );

            }
        );


    if (
        nearbyDrivers.length === 0
    ) {

        return [
            latitude,
            longitude
        ];

    }


    const group = [

        driver,

        ...nearbyDrivers,

    ]
        .filter(
            (
                item,
                position,
                array
            ) =>

                array.findIndex(
                    (
                        element
                    ) =>
                        element.id ===
                        item.id
                ) === position
        )
        .sort(
            (
                a,
                b
            ) =>

                String(a.id)
                    .localeCompare(
                        String(b.id)
                    )
        );


    const groupIndex =
        group.findIndex(
            (
                item
            ) =>
                item.id ===
                driver.id
        );


    if (
        groupIndex === -1
    ) {

        return [
            latitude,
            longitude
        ];

    }


    const radius =
        0.00025;


    const angle =

        (
            groupIndex *
            (
                360 /
                group.length
            )
        )

        *

        Math.PI /
        180;


    return [

        latitude +
            Math.cos(angle) *
            radius,

        longitude +
            Math.sin(angle) *
            radius,

    ];

}


/* =====================================================
   ANIMATION MARQUEUR
===================================================== */

function animateMarker(
    marker,
    newPosition
) {

    if (
        !marker ||
        !Array.isArray(
            newPosition
        )
    ) {

        return;

    }


    if (
        marker._animationFrame
    ) {

        cancelAnimationFrame(
            marker._animationFrame
        );

    }


    const start =
        marker.getLatLng();


    const end =
        L.latLng(

            Number(
                newPosition[0]
            ),

            Number(
                newPosition[1]
            )

        );


    const duration =
        500;


    const startTime =
        performance.now();


    function animate(
        currentTime
    ) {

        const progress =
            Math.min(

                (
                    currentTime -
                    startTime
                ) /
                duration,

                1

            );


        const latitude =

            start.lat +

            (
                end.lat -
                start.lat
            ) *

            progress;


        const longitude =

            start.lng +

            (
                end.lng -
                start.lng
            ) *

            progress;


        marker.setLatLng(

            [
                latitude,
                longitude
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

            marker.setLatLng(
                end
            );

            marker._animationFrame =
                null;

        }

    }


    marker._animationFrame =
        requestAnimationFrame(
            animate
        );

}


/* =====================================================
   AFFICHER LES CONDUCTEURS
===================================================== */

function showDrivers(
    driversList
) {

    if (
        !Array.isArray(
            driversList
        )
    ) {

        driversList = [];

    }


    window.ReactNativeWebView.postMessage(

        JSON.stringify({

            type:
                "debug",

            message:
                "Nombre de conducteurs reçus : " +
                driversList.length,

        })

    );


    const activeIds =
        new Set();


    driversList.forEach(

        (
            driver,
            index
        ) => {

            if (
                !driver
            ) {

                return;

            }


            const driverId =

                String(

                    driver.id ??
                    driver.docId ??
                    driver.userId ??
                    ""

                );


            if (
                !driverId
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
                !Number.isFinite(
                    latitude
                ) ||

                !Number.isFinite(
                    longitude
                )
            ) {

                return;

            }


            activeIds.add(
                driverId
            );


            const normalizedDriver = {

                ...driver,

                id:
                    driverId,

                latitude,

                longitude,

            };


            const displayPosition =
                getDisplayPosition(

                    normalizedDriver,

                    index,

                    driversList

                );


            /* ==========================================
               MARQUEUR EXISTANT
            ========================================== */

            if (
                driverMarkers[
                    driverId
                ]
            ) {

                animateMarker(

                    driverMarkers[
                        driverId
                    ],

                    displayPosition

                );


                driverMarkers[
                    driverId
                ]._driverData =
                    normalizedDriver;


                return;

            }


            /* ==========================================
               CHOIX ICÔNE
            ========================================== */

            let driverIcon =
                carIcon;


            if (

                String(
                    normalizedDriver.vehicleType ||
                    ""
                ).toLowerCase() ===
                "moto"

            ) {

                driverIcon =
                    motoIcon;

            }


            /* ==========================================
               CRÉATION MARQUEUR
            ========================================== */

            window.ReactNativeWebView.postMessage(

                JSON.stringify({

                    type:
                        "debug",

                    message:

                        "Création du marqueur : " +

                        normalizedDriver.name +

                        " (" +

                        latitude +

                        ", " +

                        longitude +

                        ")",

                })

            );


            const marker =

                L.marker(

                    displayPosition,

                    {

                        icon:
                            driverIcon,

                        zIndexOffset:

                            driverId ===
                            selectedDriverId

                                ? 1000

                                : 0,

                    }

                )

                .addTo(map)

                .bindTooltip(

                    normalizedDriver.name ||
                    "Conducteur",

                    {

                        direction:
                            "top",

                        offset:
                            [
                                0,
                                -20
                            ],

                    }

                );


            marker._driverData =
                normalizedDriver;


            marker.bindPopup(

                "<b>" +

                (
                    normalizedDriver.name ||
                    "Conducteur"
                ) +

                "</b><br/>" +

                (
                    normalizedDriver.vehicleType ||
                    ""
                ) +

                "<br/>" +

                (

                    normalizedDriver.distance !=
                    null

                        ? Math.round(
                            normalizedDriver.distance
                        ) + " m"

                        : ""

                )

            );


            /* ==========================================
               CLIC CONDUCTEUR
            ========================================== */

            marker.on(

                "click",

                function () {

                    selectedDriverId =
                        driverId;

                    selectedDriver =
                        normalizedDriver;


                    window.ReactNativeWebView.postMessage(

                        JSON.stringify({

                            type:
                                "driver_selected",

                            driver:
                                normalizedDriver,

                        })

                    );


                    drawRoute(
                        normalizedDriver
                    );

                }

            );


            driverMarkers[
                driverId
            ] =
                marker;

        }

    );


    /* ================================================
       SUPPRESSION ANCIENS CONDUCTEURS
    ================================================= */

    if (
        driversList.length > 0
    ) {

        Object.keys(
            driverMarkers
        ).forEach(

            (
                id
            ) => {

                if (
                    !activeIds.has(
                        id
                    )
                ) {

                    map.removeLayer(
                        driverMarkers[id]
                    );

                    delete driverMarkers[
                        id
                    ];

                }

            }

        );

    }


    /* ================================================
       CADRAGE INITIAL
    ================================================= */

    if (

        !driversMapInitialized &&

        driversList.length > 0

    ) {

        const bounds =
            L.latLngBounds([]);


        bounds.extend(

            [
                PASSENGER.latitude,
                PASSENGER.longitude
            ]

        );


        driversList.forEach(

            (
                driver,
                index
            ) => {

                if (
                    driver.latitude !=
                        null &&
                    driver.longitude !=
                        null
                ) {

                    bounds.extend(

                        getDisplayPosition(

                            driver,

                            index,

                            driversList

                        )

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

                    padding:
                        [
                            70,
                            70
                        ],

                    maxZoom:
                        15,

                }

            );

        }


        driversMapInitialized =
            true;


        window.ReactNativeWebView.postMessage(

            JSON.stringify({

                type:
                    "debug",

                message:
                    "🗺️ Carte cadrée sur passager + conducteurs",

            })

        );

    }


    window.ReactNativeWebView.postMessage(

        JSON.stringify({

            type:
                "debug",

            message:
                "Marqueurs actuellement sur la carte : " +

                Object.keys(
                    driverMarkers
                ).length,

        })

    );

}


/* =====================================================
   DISTANCE
===================================================== */

function distanceBetween(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R =
        6371000;


    const dLat =
        (
            lat2 -
            lat1
        ) *
        Math.PI /
        180;


    const dLon =
        (
            lon2 -
            lon1
        ) *
        Math.PI /
        180;


    const a =

        Math.sin(
            dLat / 2
        ) ** 2

        +

        Math.cos(
            lat1 *
            Math.PI /
            180
        )

        *

        Math.cos(
            lat2 *
            Math.PI /
            180
        )

        *

        Math.sin(
            dLon / 2
        ) ** 2;


    return (

        R *
        2 *
        Math.atan2(

            Math.sqrt(a),

            Math.sqrt(
                1 - a
            )

        )

    );

}
    /* =====================================================
   SUPPRIMER LIGNE DE RECHERCHE
===================================================== */

function removeSearchingLine() {

    console.log(
        "🧹 removeSearchingLine() appelée"
    );


    if (
        searchAnimation !== null
    ) {

        clearInterval(
            searchAnimation
        );

        searchAnimation =
            null;

    }


    if (
        searchLineLayer !== null
    ) {

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

        } catch (
            error
        ) {

            console.log(
                "⚠️ Erreur suppression ligne :",
                error
            );

        }


        searchLineLayer =
            null;

    }


    currentSearchingDriver =
        null;

}


/* =====================================================
   LIGNE CONDUCTEUR RECHERCHÉ → PASSAGER
===================================================== */

function drawSearchingLine(
    driver
) {

    if (
        !driver
    ) {

        return;

    }


    if (
        !searchActive
    ) {

        console.log(
            "⛔ Recherche inactive → ligne non créée"
        );

        return;

    }


    const driverId =

        String(

            driver.id ??
            driver.docId ??
            driver.userId ??
            ""

        );


    if (
        currentSearchingDriver ===
        driverId
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
        !Number.isFinite(
            latitude
        ) ||
        !Number.isFinite(
            longitude
        )
    ) {

        return;

    }


    removeSearchingLine();


    searchLineLayer =
        L.polyline(

            [

                [
                    PASSENGER.latitude,
                    PASSENGER.longitude
                ],

                [
                    latitude,
                    longitude
                ]

            ],

            {

                color:
                    "#3B82F6",

                weight:
                    5,

                opacity:
                    0.9,

                dashArray:
                    "12 12",

                lineCap:
                    "round",

            }

        ).addTo(
            map
        );


    searchLineLayer.bringToFront();


    window.ReactNativeWebView.postMessage(

        JSON.stringify({

            type:
                "debug",

            message:
                "✅ searchLine créée",

        })

    );


    let offset =
        0;


    searchAnimation =
        setInterval(

            () => {

                if (
                    !searchLineLayer
                ) {

                    return;

                }


                offset +=
                    2;


                searchLineLayer.setStyle({

                    dashOffset:
                        String(
                            -offset
                        ),

                });

            },

            40

        );


    currentSearchingDriver =
        driverId;

}


/* =====================================================
   SUPPRIMER ROUTE CONDUCTEUR → PASSAGER
===================================================== */

function removeDriverRoute() {

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
                "⚠️ Erreur suppression route conducteur :",
                error
            );

        }


        routeLayer =
            null;

    }

}


/* =====================================================
   SUPPRIMER ROUTE DESTINATION
===================================================== */

function removeDestinationRoute() {

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


    destinationModeActive =
        false;

}


/* =====================================================
   ROUTE CONDUCTEUR → PASSAGER
===================================================== */

async function drawRoute(
    driver
) {

    if (
        !driver
    ) {

        return;

    }


    if (
        routeRequestInProgress
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
        !Number.isFinite(
            latitude
        ) ||
        !Number.isFinite(
            longitude
        )
    ) {

        return;

    }


    if (
        lastDriverPosition
    ) {

        const distance =
            distanceBetween(

                lastDriverPosition.latitude,

                lastDriverPosition.longitude,

                latitude,

                longitude

            );


        if (
            distance < 15
        ) {

            return;

        }

    }


    lastDriverPosition = {

        latitude,

        longitude,

    };


    routeRequestInProgress =
        true;


    try {

        const url =

            "https://router.project-osrm.org/route/v1/driving/" +

            longitude +
            "," +
            latitude +

            ";" +

            PASSENGER.longitude +
            "," +
            PASSENGER.latitude +

            "?overview=full&geometries=geojson";


        const response =
            await fetch(
                url
            );


        if (
            !response.ok
        ) {

            throw new Error(
                "OSRM HTTP " +
                response.status
            );

        }


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

                (
                    point
                ) => [

                    Number(
                        point[1]
                    ),

                    Number(
                        point[0]
                    ),

                ]

            );


        removeDriverRoute();


        routeLayer =
            L.polyline(

                latLngs,

                {

                    color:
                        "#16A34A",

                    weight: 7,
                    opacity: 1,

                }

            ).addTo(
                map
            );


        try {

            map.fitBounds(

                routeLayer.getBounds(),

                {

                    padding:
                        [
                            50,
                            50
                        ],

                }

            );

        } catch (
            error
        ) {

            console.log(
                "⚠️ Impossible d'ajuster la carte :",
                error
            );

        }


        window.ReactNativeWebView.postMessage(

            JSON.stringify({

                type:
                    "route_info",

                distance:
                    Number(
                        route.distance
                    ) / 1000,

                duration:
                    Number(
                        route.duration
                    ) / 60,

                eta:
                    Math.ceil(
                        Number(
                            route.duration
                        ) / 60
                    ),

            })

        );


        window.ReactNativeWebView.postMessage(

            JSON.stringify({

                type:
                    "debug",

                message:
                    "✅ Route conducteur → passager créée",

            })

        );

    }

    catch (
        error
    ) {

        console.log(
            "❌ Erreur calcul route :",
            error
        );

    }

    finally {

        routeRequestInProgress =
            false;

    }

}


/* =====================================================
   ROUTE CONDUCTEUR → DESTINATION
===================================================== */

async function drawDestinationRoute(
    driver
) {

    if (
        !driver ||
        !driver.destination
    ) {

        console.log(
            "❌ Destination absente"
        );

        return;

    }


    const driverLatitude =
        Number(
            driver.latitude
        );

    const driverLongitude =
        Number(
            driver.longitude
        );


    const destinationLatitude =
        Number(
            driver.destination.latitude
        );

    const destinationLongitude =
        Number(
            driver.destination.longitude
        );


    if (

        !Number.isFinite(
            driverLatitude
        ) ||

        !Number.isFinite(
            driverLongitude
        ) ||

        !Number.isFinite(
            destinationLatitude
        ) ||

        !Number.isFinite(
            destinationLongitude
        )

    ) {

        console.log(
            "❌ Coordonnées destination invalides"
        );

        return;

    }


    destinationModeActive =
        true;


    removeSearchingLine();

    removeDriverRoute();

    removeDestinationRoute();


    const url =

        "https://router.project-osrm.org/route/v1/driving/" +

        driverLongitude +
        "," +
        driverLatitude +

        ";" +

        destinationLongitude +
        "," +
        destinationLatitude +

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
                "OSRM HTTP " +
                response.status
            );

        }


        const data =
            await response.json();


        if (
            !data.routes ||
            data.routes.length === 0
        ) {

            throw new Error(
                "Aucune route destination"
            );

        }


        const route =
            data.routes[0];


        const latLngs =
            route.geometry.coordinates.map(

                (
                    point
                ) => [

                    Number(
                        point[1]
                    ),

                    Number(
                        point[0]
                    ),

                ]

            );


        destinationRouteLayer =
            L.polyline(

                latLngs,

                {

                    color: "#16A34A",
                    weight: 7,
                    opacity: 1,

                }

            ).addTo(
                map
            );


        try {

            map.fitBounds(

                destinationRouteLayer
                    .getBounds(),

                {

                    padding:
                        [
                            50,
                            50
                        ],

                }

            );

        } catch (
            error
        ) {

            console.log(
                "⚠️ fitBounds destination impossible :",
                error
            );

        }


        window.ReactNativeWebView.postMessage(

            JSON.stringify({

                type:
                    "destination_route_info",

                distance:
                    Number(
                        route.distance
                    ) / 1000,

                duration:
                    Number(
                        route.duration
                    ) / 60,

                eta:
                    Math.ceil(
                        Number(
                            route.duration
                        ) / 60
                    ),

            })

        );


        window.ReactNativeWebView.postMessage(

            JSON.stringify({

                type:
                    "debug",

                message:
                    "✅ Route conducteur → destination créée",

            })

        );

    }

    catch (
        error
    ) {

        destinationModeActive =
            false;


        console.log(
            "❌ Erreur route destination :",
            error
        );

    }

}


/* =====================================================
   MESSAGES REACT NATIVE → WEBVIEW
===================================================== */

function handleReactNativeMessage(
    event
) {

    try {

        const rawData =
            event.data;


        const data =

            typeof rawData ===
            "string"

                ? JSON.parse(
                    rawData
                )

                : rawData;


        console.log(
            "📩 React Native → Leaflet :",
            data
        );


        /* ==========================================
           NOUVEAU FORMAT :
           {
             type: "drivers",
             drivers: [...]
           }
        ========================================== */

        if (
            data &&
            data.type ===
            "drivers"
        ) {

            showDrivers(
                Array.isArray(
                    data.drivers
                )
                    ? data.drivers
                    : []
            );

            return;

        }


        /* ==========================================
           ANCIEN FORMAT :
           [...]
        ========================================== */

        if (
            Array.isArray(
                data
            )
        ) {

            showDrivers(
                data
            );

            return;

        }


        /* ==========================================
           CONDUCTEUR RECHERCHÉ
        ========================================== */

        if (
            data.type ===
            "searching_driver"
        ) {

            searchActive =
                true;


            currentSearchingDriver =
                null;


            if (
                data.driver
            ) {

                drawSearchingLine(
                    data.driver
                );

            }

            else {

                removeSearchingLine();

            }


            return;

        }


        /* ==========================================
           FIN RECHERCHE
        ========================================== */

        if (
            data.type ===
            "clear_search"
        ) {

            searchActive =
                false;


            removeSearchingLine();


            /*
             * IMPORTANT :
             * on ne supprime PAS
             * les conducteurs de la carte.
             */

            window.ReactNativeWebView.postMessage(

                JSON.stringify({

                    type:
                        "debug",

                    message:
                        "🧹 Recherche terminée — conducteurs conservés",

                })

            );


            return;

        }


        /* ==========================================
           ROUTE CONDUCTEUR → PASSAGER
        ========================================== */

        if (
            data.type ===
            "start_driver_route"
        ) {

            searchActive =
                false;


            removeSearchingLine();


            if (
                data.driver
            ) {

                showDrivers(
                    [
                        data.driver
                    ]
                );


                drawRoute(
                    data.driver
                );

            }


            return;

        }


        /* ==========================================
           ROUTE CONDUCTEUR → DESTINATION
        ========================================== */

        if (
            data.type ===
            "start_destination_route"
        ) {

            searchActive =
                false;


            removeSearchingLine();


            if (
                data.driver
            ) {

                showDrivers(
                    [
                        data.driver
                    ]
                );


                drawDestinationRoute(
                    data.driver
                );

            }


            return;

        }


        /* ==========================================
           ARRÊT ROUTE DESTINATION
        ========================================== */

        if (
            data.type ===
            "stop_destination_route" ||

            data.type ===
            "clear_destination_route"
        ) {

            removeDestinationRoute();

            return;

        }


        /* ==========================================
           CARTE PRÊTE
        ========================================== */

        if (
            data.type ===
            "ready"
        ) {

            return;

        }

    }

    catch (
        error
    ) {

        console.error(
            "❌ Erreur réception message :",
            error
        );

    }

}


/* =====================================================
   ÉCOUTE WEBVIEW
===================================================== */

document.addEventListener(

    "message",

    handleReactNativeMessage

);


window.addEventListener(

    "message",

    handleReactNativeMessage

);


/* =====================================================
   INITIALISATION DES CONDUCTEURS
===================================================== */

try {

    const initialDrivers =
        ${JSON.stringify(drivers || [])};


    if (
        Array.isArray(
            initialDrivers
        ) &&
        initialDrivers.length > 0
    ) {

        showDrivers(
            initialDrivers
        );

    }


    /* ================================================
       CONDUCTEUR ACCEPTÉ
    ================================================= */

    if (
        mode ===
        "tracking" &&
        DRIVER
    ) {

        showDrivers(
            [
                DRIVER
            ]
        );


        window.ReactNativeWebView.postMessage(

            JSON.stringify({

                type:
                    "debug",

                message:
                    "🚗 Conducteur accepté affiché en mode tracking : " +
                    (
                        DRIVER.name ||
                        "Conducteur"
                    ),

            })

        );

    }


    /* ================================================
       CONDUCTEUR RECHERCHÉ AU DÉMARRAGE
    ================================================= */

    if (
        mode !== "tracking" &&
        SEARCHING_DRIVER
    ) {

        searchActive =
            true;


        drawSearchingLine(
            SEARCHING_DRIVER
        );

    }

}

catch (
    error
) {

    console.error(
        "❌ Erreur initialisation conducteurs :",
        error
    );

}


/* =====================================================
   CARTE PRÊTE
===================================================== */

window.ReactNativeWebView.postMessage(

    JSON.stringify({

        type:
            "ready",

    })

);


window.ReactNativeWebView.postMessage(

    JSON.stringify({

        type:
            "debug",

        message:
            "Leaflet initialisé",

    })

);

</script>

</body>

</html>
`;
}