export default function generateRideTrackingHtml({
    origin,
    destination,
    icons,
    tripType = "pickup",
}){

    return `
<!DOCTYPE html>

<html>

<head>

<meta charset="utf-8"/>

<meta
name="viewport"
content="width=device-width, initial-scale=1.0"/>

<link
rel="stylesheet"
href="https://unpkg.com/leaflet/dist/leaflet.css"/>

<style>

html,
body,
#map{
    width:100%;
    height:100%;
    margin:0;
    padding:0;
}

.leaflet-container{
    background:#F5F5F5;
}

/* -------- Carte conducteur -------- */

.driver-tooltip{
    background:#FFFFFF;
    border-radius:14px;
    padding:10px 14px;
    box-shadow:0 4px 12px rgba(0,0,0,.18);
    text-align:center;
    font-family:Arial,sans-serif;
    min-width:140px;
    border:none;
}

.driver-name{
    font-size:15px;
    font-weight:bold;
    color:#222;
}

.driver-car{
    margin-top:4px;
    color:#666;
    font-size:13px;
}

.driver-rating{
    margin-top:4px;
    color:#F4B400;
    font-weight:bold;
}
.driver-icon{
    filter: drop-shadow(0 3px 8px rgba(0,0,0,.35));
    animation: pulse 1.6s infinite;
}

@keyframes pulse{

    0%{
        transform: scale(1);
    }

    50%{
        transform: scale(1.08);
    }

    100%{
        transform: scale(1);
    }

}

</style>

</head>

<body>

<div id="map"></div>


<script>

const PASSENGER = {
    latitude: ${passengerLocation.latitude},
    longitude: ${passengerLocation.longitude},
};

const map = L.map("map", {
    zoomControl: false,
}).setView(
    [
        PASSENGER.latitude,
        PASSENGER.longitude,
    ],
    15
);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
    }
).addTo(map);

</script>
<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>

<script src="https://unpkg.com/leaflet-rotatedmarker@0.2.0/leaflet.rotatedMarker.js"></script>

<script>

const map = L.map("map",{
    zoomControl:false
}).setView(
[
${origin.latitude},
${origin.longitude}
],
15
);

L.tileLayer(
"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
{
    maxZoom:19
}
).addTo(map);

const markers = {};

const animations = {};
const movingMarkers = {};
const routeAnimations = {};

let selectedDriver = null;
let selectedMarker = null;
let routeLayer = null;
let firstRoute = true;
let followDriver = true;
let lastCameraUpdate = 0;
const CAMERA_OFFSET = 0.0012;

let lastRoutePosition = null;

const destinationLabel =
    tripType === "pickup"
        ? "📍 Passager"
        : "🎯 Destination";
const passengerIcon = L.icon({

    iconUrl:"${icons.passenger}",

    iconSize:[42,42],

    iconAnchor:[21,42]

});

const destinationIcon = L.icon({
    iconUrl: icons.destination,
    iconSize: [42,42],
    iconAnchor: [21,42],
});
const targetIcon =
    tripType === "pickup"
        ? passengerIcon
        : destinationIcon;
L.marker(
[
    destination.latitude,
    destination.longitude
],
{
    icon: targetIcon,
})
.addTo(map)
.bindTooltip(
    destinationLabel,
    {
        permanent: true,
        direction: "top",
        offset: [0, -25],
    }
);
L.circle(
[
destination.latitude,
destination.longitude
],

{
radius: 50,
color:"#16A34A",
weight:2,
fillColor:"#22C55E",
fillOpacity:0.20
}).addTo(map);
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
    iconSize: [46,46],
    iconAnchor: [23,46],
    popupAnchor: [0,-46],
   
    className: "driver-icon",
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
        // Remet l'ancien conducteur à sa taille normale
       if (selectedMarker) {
            const el = selectedMarker.getElement();

            if (el) {
                el.style.filter = "";
                el.style.zIndex = "";
            }
        }
        selectedDriver = driver;
        selectedMarker = marker;
        const el = marker.getElement();

       if (el) {
el.style.filter = "drop-shadow(0 0 8px #22C55E)";
            el.style.zIndex = "999";
        }
        window.ReactNativeWebView.postMessage(
            JSON.stringify({
                type:"driver_selected",
                driver:driver
            })
        );
    redrawRoute(driver);

    });

    markers[driver.id] = marker;

}


// ======================================
// Rotation véhicule
// ======================================

function getBearing(lat1,lng1,lat2,lng2){

    const dLon=(lng2-lng1)*Math.PI/180;

    const y=Math.sin(dLon)*Math.cos(lat2*Math.PI/180);

    const x=
        Math.cos(lat1*Math.PI/180)*
        Math.sin(lat2*Math.PI/180)
        -
        Math.sin(lat1*Math.PI/180)*
        Math.cos(lat2*Math.PI/180)*
        Math.cos(dLon);

    let bearing=Math.atan2(y,x)*180/Math.PI;

    return (bearing+360)%360;

}

function getCameraTarget(lat, lng, bearing) {

    const distance = 0.0012;

    const rad = bearing * Math.PI / 180;

    return {
        latitude: lat - Math.cos(rad) * distance,
        longitude: lng - Math.sin(rad) * distance,
    };

}


// ======================================
// Distance entre deux points
// ======================================

function getDistanceMeters(lat1,lng1,lat2,lng2){

    const R=6371000;

    const dLat=(lat2-lat1)*Math.PI/180;

    const dLng=(lng2-lng1)*Math.PI/180;

    const a=
        Math.sin(dLat/2)*Math.sin(dLat/2)+
        Math.cos(lat1*Math.PI/180)*
        Math.cos(lat2*Math.PI/180)*
        Math.sin(dLng/2)*
        Math.sin(dLng/2);

    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));

}

function distanceBetween(lat1, lng1, lat2, lng2) {

  const R = 6371000;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
// ======================================
// Animation du conducteur
// ======================================

function animateMarker(marker,newLat,newLng){

const id = marker._leaflet_id;

if (movingMarkers[id]) {
    return;
}

movingMarkers[id] = true;

   

    if(animations[id]){
        cancelAnimationFrame(animations[id]);
    }

    const start=marker.getLatLng();

    const bearing=getBearing(
        start.lat,
        start.lng,
        newLat,
        newLng
    );
    const startAngle =
    marker.options.rotationAngle || 0;

    const duration=700;

    const startTime=performance.now();

    function animate(now){

        const progress=Math.min(
            (now-startTime)/duration,
            1
        );

        const lat=
            start.lat+
            (newLat-start.lat)*progress;

        const lng=
            start.lng+
            (newLng-start.lng)*progress;

        marker.setLatLng([lat,lng]);

       const easedProgress =
    progress * progress * (3 - 2 * progress);

const angle =
    startAngle +
    (bearing - startAngle) * easedProgress;

        marker.setRotationAngle(angle);
    if (
    followDriver &&
    selectedMarker === marker
) {

    const now = performance.now();

    if (now - lastCameraUpdate > 300) {

        lastCameraUpdate = now;

    const camera = getCameraTarget(
    lat,
    lng,
    angle
);

map.flyTo(
    [
        camera.latitude,
        camera.longitude
    ],
    map.getZoom(),
    {
        animate: true,
        duration: 0.3,
    }
);

    }

}
        if(progress<1){

            animations[id]=
                requestAnimationFrame(animate);

        } else {

            marker.setLatLng([newLat, newLng]);
                
            marker.setRotationAngle(bearing);
                movingMarkers[id] = false;
            }

        }

    requestAnimationFrame(animate);

}
    function animateAlongRoute(marker, route) {
        

        if (routeAnimations[id]) {
            return;
        }
 if (!route || route.length < 2) {
        return;
    }

    const id = marker._leaflet_id;

    if (routeAnimations[id]) {
        return;
    }

    routeAnimations[id] = true;

    const current = marker.getLatLng();

    let nearestIndex = 0;
    let nearestDistance = Infinity;

    for (let i = 0; i < route.length; i++) {

        const point = route[i];

        const distance = getDistanceMeters(
            current.lat,
            current.lng,
            point[0],
            point[1]
        );

        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = i;
        }
    }

    if (nearestIndex >= route.length - 1) return;

    const nextPoint = route[nearestIndex + 1];

    animateMarker(
        marker,
        nextPoint[0],
        nextPoint[1]
    );
    setTimeout(() => {
    routeAnimations[id] = false;
}, 700);

}
    // ======================================
// Dessin de l'itinéraire
// ======================================
function redrawRoute(driver) {

    drawRoute(
        driver.latitude,
        driver.longitude,
        destination.latitude,
        destination.longitude
    );

}
async function drawRoute(
    startLat,
    startLng,
    endLat,
    endLng
){

    try{

        // ----------------------------------
        // Recalcul seulement après 15 mètres
        // ----------------------------------

        if(lastRoutePosition){

            const moved = getDistanceMeters(

                lastRoutePosition.latitude,
                lastRoutePosition.longitude,

                endLat,
                endLng

            );

            if(moved < 15){

                return;

            }

        }

        lastRoutePosition = {

            latitude:endLat,
            longitude:endLng

        };

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

        const response = await fetch(url);

        const data = await response.json();

        if(
            !data.routes ||
            data.routes.length===0
        ){
            return;
        }
const route = data.routes[0];

window.currentRouteDistance = route.distance;

window.currentRouteDuration = route.duration;
window.ReactNativeWebView.postMessage(
  JSON.stringify({
    type: "debug",
    message: "Envoi route_info",
  })
);
window.ReactNativeWebView.postMessage(
  JSON.stringify({
    type: "route_info",
    distance: route.distance,
    duration: route.duration,
    eta:
      Date.now() + route.duration * 1000,
  })
);
routeRequestInProgress = false;

        const latLngs =
            route.geometry.coordinates.map(point=>[
                point[1],
                point[0]
            ]);
            window.currentRoute = latLngs;

        if(routeLayer){

            map.removeLayer(routeLayer);

        }

        routeLayer = L.polyline(

            latLngs,

            {

                color:"#16A34A",

                weight:7,

                opacity:0.95,

                lineCap:"round",

                lineJoin:"round"

            }

        ).addTo(map);
if (firstRoute) {

    const zoom = getZoom(route.distance);

    map.flyTo(
      [
        (startLat + endLat) / 2,
        (startLng + endLng) / 2,
      ],
      zoom,
      {
        animate: true,
        duration: 0.8,
      }
    );

    firstRoute = false;
}
    }

    catch(error){

        console.log(error);

    }

}
    // ======================================
// Supprimer un conducteur
// ======================================

function removeMarker(id){

    if(!markers[id]) return;

    if(animations[markers[id]._leaflet_id]){

        cancelAnimationFrame(
            animations[markers[id]._leaflet_id]
        );

        delete animations[
            markers[markers[id]._leaflet_id]
        ];

    }

    map.removeLayer(markers[id]);

    delete markers[id];

}


// ======================================
// Mise à jour des conducteurs
// ======================================

function updateDrivers(drivers){

    if(!Array.isArray(drivers)) return;

    const activeIds=[];

    drivers.forEach(driver=>{

        activeIds.push(driver.id);

        if(markers[driver.id]){

            const marker=markers[driver.id];

            const current=marker.getLatLng();

            const moved=

                Math.abs(current.lat-driver.latitude)>0.000001 ||

                Math.abs(current.lng-driver.longitude)>0.000001;

            if(moved){

                if (
                selectedDriver &&
                selectedDriver.id=== driver.id &&
                window.currentRoute
            ) {

                animateAlongRoute(
                    marker,
                    window.currentRoute
                );

            } else {

                animateMarker(
                    marker,
                    driver.latitude,
                    driver.longitude
                );

            }

              if (
  selectedDriver &&
  selectedDriver.id === driver.id
) {

  selectedDriver = driver;

  if (!lastRoutePosition) {

    lastRoutePosition = {
      latitude: driver.latitude,
      longitude: driver.longitude,
    };
    redrawRoute(driver);

  } else {

    const distance = distanceBetween(
      lastRoutePosition.latitude,
      lastRoutePosition.longitude,
      driver.latitude,
      driver.longitude
    );

    if (distance > 15) {

      lastRoutePosition = {
        latitude: driver.latitude,
        longitude: driver.longitude,
      };

    redrawRoute(driver);

    }

  }

}

            }

        }

        else{

            createMarker(driver);

        }

    });

    Object.keys(markers).forEach(id=>{

        if(!activeIds.includes(id)){

            removeMarker(id);

        }

    });

}



// ======================================
// Réception React Native
// ======================================

window.addEventListener("message",function(event){

    try{

        updateDrivers(

            JSON.parse(event.data)

        );

    }

    catch(e){

        console.log(e);

    }

});


document.addEventListener("message", (event) => {
  const drivers = JSON.parse(event.data);
  showDrivers(drivers);
});


// ======================================
// Erreurs JS
// ======================================

window.onerror=function(message,source,line){

    window.ReactNativeWebView.postMessage(

        JSON.stringify({

            type:"error",

            message,

            line

        })

    );

};



// ======================================
// Carte prête
// ======================================

window.ReactNativeWebView.postMessage("Leaflet prêt");

</script>

</body>

</html>

`;

}