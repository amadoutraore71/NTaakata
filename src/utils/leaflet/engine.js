export function createEngineScript() {

return `

// ===============================
// Etat du moteur Leaflet
// ===============================

const markers = {};

const animations = {};

const movingMarkers = {};

const routeAnimations = {};

let selectedDriver = null;

let selectedMarker = null;

let routeLayer = null;

let currentRoute = null;

let lastRoutePosition = null;

let firstRoute = true;

let followDriver = true;

let lastCameraUpdate = 0;

const CAMERA_OFFSET = 0.0012;

`;

}

export function createMarkerScript() {

return `

// ======================================
// Création d'un conducteur
// ======================================

function createMarker(driver){

    const iconUrl =
        driver.vehicleType === "moto"
            ? driver.iconMoto
            : driver.iconCar;

    const driverIcon = L.icon({

        iconUrl: iconUrl,

        iconSize:[46,46],

        iconAnchor:[23,46],

        popupAnchor:[0,-46],

        className:"driver-icon",

    });

    const marker = L.marker(

        [
            driver.latitude,
            driver.longitude
        ],

        {

            icon:driverIcon,

            rotationAngle:0,

            rotationOrigin:"center center"

        }

    ).addTo(map);

    marker.on("click",function(){

        if(selectedMarker){

            const el =
                selectedMarker.getElement();

            if(el){

                el.style.filter="";

                el.style.zIndex="";

            }

        }

        selectedDriver = driver;

        selectedMarker = marker;

        const el = marker.getElement();

        if(el){

            el.style.filter =
                "drop-shadow(0 0 8px #22C55E)";

            el.style.zIndex="999";

        }

        window.ReactNativeWebView.postMessage(

            JSON.stringify({

                type:"driver_selected",

                driver:driver

            })

        );

        redrawRoute(driver);

    });

    markers[driver.userId]=marker;

}

`;

}