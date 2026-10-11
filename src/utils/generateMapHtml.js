export default function generateMapHtml({

  mode = "drivers",

  passengerLocation,

  driverLocation = null,

  drivers = [],

  searchingDriver = null,

  icons = {},

  destinationLocation = null,

}) {

  const passenger = passengerLocation || {

    latitude: 0,

    longitude: 0,

  };

  const initialDrivers = Array.isArray(drivers) ? drivers : [];

  const driver = driverLocation || null;

  const searching = searchingDriver || null;

  const destination = destinationLocation || null;

  return `<!DOCTYPE html>

<html>

<head>

  <meta charset="utf-8" />

  <meta

    name="viewport"

    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"

  />

  <link

    rel="stylesheet"

    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"

  />

  <style>

    html,

    body,

    #map {

      width: 100%;

      height: 100%;

      margin: 0;

      padding: 0;

      overflow: hidden;

      background: #dfe7e3;

    }

    .leaflet-container {

      background: #dfe7e3;

    }

    .vehicle-icon,

    .passenger-icon,

    .destination-icon {

      background: transparent !important;

      border: 0 !important;

      box-shadow: none !important;

    }

    .vehicle-icon svg,

    .passenger-icon svg,

    .destination-icon svg {

      display: block;

      width: 100%;

      height: 100%;

    }

  
      .passenger-icon, .vehicle-icon, .destination-icon {
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
      }
      .passenger-icon svg, .vehicle-icon svg, .destination-icon svg,
      .nta-icon-image {
        display: block; width: 100%; height: 100%; object-fit: contain;
        background: transparent; overflow: visible;
      }

</style>

</head>

<body>

  <div id="map"></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

  <script>

    (function () {

      "use strict";

      const MODE = ${JSON.stringify(mode)};

      const PASSENGER = ${JSON.stringify(passenger)};

      const INITIAL_DRIVER = ${JSON.stringify(driver)};

      const INITIAL_DRIVERS = ${JSON.stringify(initialDrivers)};

      const SEARCHING_DRIVER = ${JSON.stringify(searching)};

      const INITIAL_DESTINATION = ${JSON.stringify(destination)};
const ICON_URLS = ${JSON.stringify({
        car: icons && icons.car ? icons.car : "",
        moto: icons && icons.moto ? icons.moto : "",
        passenger: icons && icons.passenger ? icons.passenger : "",
        destination: icons && icons.destination ? icons.destination : "",
      })};

      function send(type, payload) {

        try {

          window.ReactNativeWebView.postMessage(

            JSON.stringify(

              Object.assign({ type: type }, payload || {})

            )

          );

        } catch (e) {}

      }

      function debug(message) {

        send("debug", { message: String(message) });

      }

      window.onerror = function (

        message,

        source,

        line,

        column,

        error

      ) {

        send("webview_js_error", {

          message: String(message || ""),

          source: String(source || ""),

          line: Number(line) || 0,

          column: Number(column) || 0,

          stack: error && error.stack ? String(error.stack) : "",

        });

        return true;

      };

      window.addEventListener("unhandledrejection", function (e) {

        const reason = e && e.reason;

        send("webview_js_error", {

          message:

            reason && reason.message

              ? String(reason.message)

              : String(reason || "Unhandled promise rejection"),

          stack:

            reason && reason.stack

              ? String(reason.stack)

              : "",

        });

      });

      function valid(position) {

        return (

          !!position &&

          Number.isFinite(Number(position.latitude)) &&

          Number.isFinite(Number(position.longitude))

        );

      }

      function point(position) {

        return [

          Number(position.latitude),

          Number(position.longitude),

        ];

      }

      function idOf(driver) {

        return String(

          driver &&

            (

              driver.id ||

              driver.docId ||

              driver.userId ||

              driver.phone ||

              "unknown"

            )

        );

      }

      function vehicleType(driver) {

        return String(

          driver && driver.vehicleType || ""

        ).toLowerCase();

      }

      if (typeof L === "undefined") {

        send("webview_js_error", {

          message: "Leaflet n'est pas chargé",

        });

        return;

      }

      if (!valid(PASSENGER)) {

        send("webview_js_error", {

          message: "Position passager invalide",

        });

        return;

      }

      const map = L.map("map", {

        zoomControl: false,

        attributionControl: true,

      }).setView(point(PASSENGER), 15);

      L.tileLayer(

        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

        {

          maxZoom: 19,

          attribution: "© OpenStreetMap contributors",

        }

      ).addTo(map);

      // ==================================================

      // ICÔNES SVG : PASSAGER, VOITURE, MOTO, DESTINATION

      // ==================================================

// STYLE 2 — véhicules minimalistes, vus du dessus, sans badge ni fond
const carSvg =
  '<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M13 3.5h14c2.3 0 3.8 1.5 4.6 4L35 17v15c0 2.5-1.6 4-4 4H9c-2.4 0-4-1.5-4-4V17l3.4-9.5c.8-2.5 2.3-4 4.6-4Z" fill="#16a34a" stroke="#14532d" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<path d="m11 8 2.5-2h13L29 8l2 7H9Z" fill="#e0f2fe" stroke="#166534" stroke-width="1" stroke-linejoin="round"/>' +
    '<path d="M8.5 18h23v6h-23z" fill="#166534"/>' +
    '<path d="m10 26 2 6h16l2-6Z" fill="#bae6fd" stroke="#166534" stroke-width=".8" stroke-linejoin="round"/>' +
    '<path d="M5.8 17h3v5h-3zm25.4 0h3v5h-3z" fill="#111827"/>' +
    '<path d="M10 4.8h4v1.5h-4zm16 0h4v1.5h-4z" fill="#fef3c7"/>' +
  '</svg>';

// Moto lisible au premier regard : roues, guidon, selle et phare avant.
// Son avant est orienté vers le haut ; la rotation existante suit le trajet.
const motoSvg =
  '<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">' +
    '<ellipse cx="20" cy="7.5" rx="4.2" ry="6" fill="#111827"/>' +
    '<ellipse cx="20" cy="7.5" rx="1.7" ry="3.8" fill="#d1d5db"/>' +
    '<ellipse cx="20" cy="32.5" rx="4.2" ry="6" fill="#111827"/>' +
    '<ellipse cx="20" cy="32.5" rx="1.7" ry="3.8" fill="#d1d5db"/>' +
    '<path d="M13 12 10 9M27 12l3-3M10 9l-3 1M30 9l3 1" fill="none" stroke="#374151" stroke-width="2.2" stroke-linecap="round"/>' +
    '<path d="M15 11.5Q20 8 25 11.5l3 7-4 7H16l-4-7Z" fill="#16a34a" stroke="#14532d" stroke-width="1.4" stroke-linejoin="round"/>' +
    '<path d="M16 14h8l2.5 5-3.5 4h-6l-3.5-4Z" fill="#bbf7d0" stroke="#166534" stroke-width=".9" stroke-linejoin="round"/>' +
    '<path d="M16 24h8l-2 4h-4Z" fill="#111827"/>' +
    '<path d="M17 10.5h6" stroke="#fef08a" stroke-width="2.4" stroke-linecap="round"/>' +
  '</svg>';

// Passager style 4 : repère circulaire vert avec point central, sans personnage.
const passengerSvg =
  '<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">' +
    '<circle cx="20" cy="18" r="13.5" fill="#ffffff" stroke="#86efac" stroke-width="4"/>' +
    '<circle cx="20" cy="18" r="7" fill="#16a34a"/>' +
    '<path d="M14.5 28.5 20 37l5.5-8.5" fill="#16a34a" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>' +
  '</svg>';

// Destination style 5 : repère rouge avec cible blanche au centre.
const destinationSvg =
  '<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M20 38S35 22.8 35 15A15 15 0 1 0 5 15c0 7.8 15 23 15 23Z" fill="#dc2626" stroke="#b91c1c" stroke-width="1"/>' +
    '<circle cx="20" cy="15" r="7" fill="#ffffff"/>' +
    '<circle cx="20" cy="15" r="3.5" fill="#dc2626"/>' +
  '</svg>';

      function icon(svg, size, className, imageUrl = "") {

        // Si le composant React Native fournit un PNG, on l'utilise en priorité.
        // Sinon, on conserve le SVG de secours pour éviter une icône vide.
        const html = imageUrl
          ? '<img class="nta-icon-image" src="' + imageUrl + '" alt="" />'
          : svg;

        return L.divIcon({
          html,
          className: className,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      }

 const passengerIcon = icon(

  passengerSvg,

  30,

  "passenger-icon",
  ICON_URLS.passenger

);

const carIcon = icon(

  carSvg,

  30,

  "vehicle-icon",
  ICON_URLS.car

);

const motoIcon = icon(

  motoSvg,

  30,

  "vehicle-icon",
  ICON_URLS.moto

);

// On conserve l'icône de destination actuelle.

const destinationIcon = icon(

  destinationSvg,

  30,

  "destination-icon",
  ICON_URLS.destination
);

      // ==================================================

      // ÉTAT DE LA CARTE ET DES ROUTES

      // ==================================================

      let passengerMarker = null;

      let destinationMarker = null;

      let driverMarkers = {};

      let searchLineLayer = null;

      let pickupRouteLayer = null;

      let destinationRouteLayer = null;

      let pickupRoutePoints = [];

      let destinationRoutePoints = [];

      let pickupRouteGeneration = 0;

      let pickupRouteActive = false;

      let destinationRouteActive = false;

      let routeRequestRunning = false;

      let pendingPickupDriver = null;

      let destinationRequestRunning = false;

      let searchingDriverId = null;

      const ARRIVAL_THRESHOLD_METERS = 25;

      // ==================================================

      // MARQUEUR DU PASSAGER

      // ==================================================

      function showPassenger() {

        if (!valid(PASSENGER)) return;

        if (!passengerMarker) {

          passengerMarker = L.marker(

            point(PASSENGER),

            {

              icon: passengerIcon,

              zIndexOffset: 1200,

            }

          ).addTo(map);

        }

        debug("Marqueur passager créé");

      }

      function hidePassenger() {

        if (!passengerMarker) return;

        try {

          if (map.hasLayer(passengerMarker)) {

            map.removeLayer(passengerMarker);

          }

        } catch (e) {}

        passengerMarker = null;

        debug(

          "Marqueur passager supprimé : conducteur arrivé"

        );

      }

      // ==================================================

      // MARQUEUR DE DESTINATION

      // Appelé uniquement au démarrage de la route destination.

      // ==================================================

      function showDestination(destinationPosition) {

        if (!valid(destinationPosition)) return;

        if (!destinationMarker) {

          destinationMarker = L.marker(

            point(destinationPosition),

            {

              icon: destinationIcon,

              zIndexOffset: 1300,

            }

          ).addTo(map);

          destinationMarker.bindTooltip("Destination", {

            direction: "top",

            offset: [0, -16],

          });

        } else {

          destinationMarker.setLatLng(

            point(destinationPosition)

          );

          if (!map.hasLayer(destinationMarker)) {

            destinationMarker.addTo(map);

          }

        }

        debug("Marqueur destination affiché");

      }

      function hideDestination() {

        if (!destinationMarker) return;

        try {

          if (map.hasLayer(destinationMarker)) {

            map.removeLayer(destinationMarker);

          }

        } catch (e) {}

        destinationMarker = null;

      }

      // ==================================================

      // UTILITAIRES

      // ==================================================

      function distance(a, b) {

        return map.distance(

          [Number(a.latitude), Number(a.longitude)],

          [Number(b.latitude), Number(b.longitude)]

        );

      }

      function clearSearchLine() {

        if (searchLineLayer) {

          try {

            if (map.hasLayer(searchLineLayer)) {

              map.removeLayer(searchLineLayer);

            }

          } catch (e) {}

          searchLineLayer = null;

        }

        searchingDriverId = null;

      }

      function drawSearchLine(d) {

        // Avant acceptation, aucune ligne ne doit être affichée.

        clearSearchLine();

        searchingDriverId = null;

      }

      function clearDrivers() {

        Object.keys(driverMarkers).forEach(function (id) {

          const marker = driverMarkers[id];

          try {

            if (marker && map.hasLayer(marker)) {

              map.removeLayer(marker);

            }

          } catch (e) {}

          delete driverMarkers[id];

        });

      }

      // ==================================================

      // AFFICHAGE DES CONDUCTEURS

      // ==================================================

      function showDrivers(list, fit) {

        if (!Array.isArray(list)) list = [];

        const active = new Set();

        list.forEach(function (d) {

          if (!valid(d)) return;

          const id = idOf(d);

          if (!id || id === "unknown") return;

          active.add(id);

          const pos = point(d);

          let marker = driverMarkers[id];

          if (marker) {

            marker._driverData = d;

            animateMarker(marker, pos);

            return;

          }

         const type = vehicleType(d).trim();

        const selectedIcon =

          type === "moto" || type === "motorbike" || type === "motorcycle"

            ? motoIcon

            : carIcon;

       marker = L.marker(pos, {

  icon: selectedIcon,

  zIndexOffset: 1000,

}).addTo(map);

marker._driverData = d;

          // Orientation initiale : avant vers le haut en attendant le premier déplacement.
          setVehicleRotation(marker, isMotorcycle(marker) ? -90 : 0);
marker.bindTooltip(

            d.name || "Conducteur",

            {

              direction: "top",

              offset: [0, -12],

            }

          );

          marker.on("click", function () {

            send("driver_selected", {

              driver: d,

            });

          });

          driverMarkers[id] = marker;

        });

        Object.keys(driverMarkers).forEach(function (id) {

          if (!active.has(id)) {

            const marker = driverMarkers[id];

            try {

              if (map.hasLayer(marker)) {

                map.removeLayer(marker);

              }

            } catch (e) {}

            delete driverMarkers[id];

          }

        });

        debug(

          "Conducteurs affichés : " +

          Object.keys(driverMarkers).length

        );

        if (fit && list.length) {

          const bounds = L.latLngBounds([

            point(PASSENGER),

          ]);

          list.forEach(function (d) {

            if (valid(d)) {

              bounds.extend(point(d));

            }

          });

          if (bounds.isValid()) {

            map.fitBounds(bounds, {

              padding: [60, 60],

              maxZoom: 16,

            });

          }

        }

      }

function isMotorcycle(marker) {
  const type = String(
    marker && marker._driverData && marker._driverData.vehicleType || ""
  ).toLowerCase().trim();

  return type === "moto" || type === "motorbike" || type === "motorcycle";
}

function setVehicleRotation(marker, angle) {
  if (!marker) return;

  const visual = marker._icon && marker._icon.querySelector("svg, img.nta-icon-image");
  if (!visual) return;

  visual.style.transformOrigin = "50% 50%";
  visual.style.transform = "rotate(" + angle + "deg)";
  marker._vehicleAngle = angle;
}


function getVehicleHeading(marker, start, end) {
  if (!marker || !start || !end) return null;

  const deltaLat = end.lat - start.lat;
  const deltaLng = end.lng - start.lng;

  if (
    Math.abs(deltaLat) < 0.00000001 &&
    Math.abs(deltaLng) < 0.00000001
  ) {
    return null;
  }

  const lat1 = start.lat * Math.PI / 180;
  const lat2 = end.lat * Math.PI / 180;
  const lngDelta = deltaLng * Math.PI / 180;

  const y = Math.sin(lngDelta) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(lngDelta);

  const bearing =
    (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

  // Avant de la voiture et de la moto orienté vers le haut
  // dans les images PNG.
 // Les deux PNG sont supposés avoir leur avant vers le haut.
const imageOffset = 0;

  return (bearing + imageOffset + 360) % 360;
}

// DÉPLACEMENT ANIMÉ DU CONDUCTEUR

      // ==================================================

      function animateMarker(marker, pos) {

        if (

          !marker ||

          !Array.isArray(pos) ||

          pos.length < 2 ||

          !Number.isFinite(Number(pos[0])) ||

          !Number.isFinite(Number(pos[1]))

        ) {

          return;

        }

        if (marker._frame) {

          cancelAnimationFrame(marker._frame);

          marker._frame = null;

        }

        const start = marker.getLatLng();

        const end = L.latLng(

          Number(pos[0]),

          Number(pos[1])

        );

      const targetAngle = getVehicleHeading(marker, start, end);
        const startAngle = Number.isFinite(marker._vehicleAngle)
          ? marker._vehicleAngle
          : 0;

        let angleDelta = 0;
        if (targetAngle !== null) {
          // Prendre le chemin de rotation le plus court autour de 0°/360°.
          angleDelta = ((targetAngle - startAngle + 540) % 360) - 180;
        }

        const nowStarted = performance.now();
        const previousUpdate = marker._lastPositionUpdateAt;
        const elapsedSinceUpdate = previousUpdate
          ? nowStarted - previousUpdate
          : 850;

        // Adapter la durée au rythme des mises à jour GPS.
        const duration = Math.max(650, Math.min(elapsedSinceUpdate, 1200));
        marker._lastPositionUpdateAt = nowStarted;
        const startedAt = nowStarted;

        function frame(now) {
          const progress = Math.min(
            (now - startedAt) / duration,
            1
          );

          // Accélération et ralentissement doux.
          const eased = progress * progress * (3 - 2 * progress);

          const lat =
            start.lat + (end.lat - start.lat) * eased;

          const lng =
            start.lng + (end.lng - start.lng) * eased;

          const currentPosition = [lat, lng];

          marker.setLatLng(currentPosition);

          if (targetAngle !== null) {
            setVehicleRotation(marker, startAngle + angleDelta * eased);
          }

          // La route raccourcit progressivement pendant le déplacement.

          if (

            pickupRouteActive &&

            !destinationRouteActive

          ) {

            trimRoute(

              pickupRouteLayer,

              pickupRoutePoints,

              currentPosition,

              "pickup"

            );

          } else if (destinationRouteActive) {

            trimRoute(

              destinationRouteLayer,

              destinationRoutePoints,

              currentPosition,

              "destination"

            );

          }

          if (progress < 1) {

            marker._frame = requestAnimationFrame(frame);

          } else {

            marker.setLatLng(end);

            marker._frame = null;

          }

        }

        marker._frame = requestAnimationFrame(frame);

      }

      // ==================================================

      // GESTION DES ROUTES

      // ==================================================

      function removeLayer(layer) {

        if (!layer) return;

        try {

          if (map.hasLayer(layer)) {

            map.removeLayer(layer);

          }

        } catch (e) {}

      }

      function trimRoute(layer, points, pos, arrivalType) {

        if (

          !layer ||

          !Array.isArray(points) ||

          points.length < 2

        ) {

          return;

        }

        // Vérifier l'arrivée au point final de la route.

        const endpoint = points[points.length - 1];

        if (

          map.distance(pos, endpoint) <=

          ARRIVAL_THRESHOLD_METERS

        ) {

          removeLayer(layer);

          if (arrivalType === "pickup") {

            pickupRouteActive = false;

            pickupRoutePoints = [];

            pickupRouteLayer = null;

            // Le passager disparaît lorsque le conducteur arrive.

            hidePassenger();

            debug(

              "Conducteur arrivé au passager : route pickup terminée"

            );

          } else {

            destinationRouteActive = false;

            destinationRoutePoints = [];

            destinationRouteLayer = null;

            // Le marqueur destination reste visible.

            debug(

              "Conducteur arrivé à destination : route destination terminée"

            );

          }

          return;

        }

        // L'index avance uniquement dans le sens du trajet.

        const previousIndex =

          Number(layer._progressIndex) || 0;

        let nearestIndex = previousIndex;

        let bestDistance = Infinity;

        for (

          let i = previousIndex;

          i < points.length;

          i++

        ) {

          const currentDistance = map.distance(

            pos,

            points[i]

          );

          if (currentDistance < bestDistance) {

            bestDistance = currentDistance;

            nearestIndex = i;

          }

        }

        layer._progressIndex = Math.max(

          previousIndex,

          nearestIndex

        );

        // Masquer la portion déjà parcourue.

        const nextIndex = Math.min(

          layer._progressIndex + 1,

          points.length - 1

        );

        const remainingPoints = [pos].concat(

          points.slice(nextIndex)

        );

        if (remainingPoints.length >= 2) {

          layer.setLatLngs(remainingPoints);

        }

      }

      // ==================================================

      // CALCUL DE ROUTE OSRM

      // ==================================================

      async function fetchRoute(from, to) {

        const url =

          "https://router.project-osrm.org/route/v1/driving/" +

          from[1] +

          "," +

          from[0] +

          ";" +

          to[1] +

          "," +

          to[0] +

          "?overview=full&geometries=geojson";

        const response = await fetch(url);

        if (!response.ok) {

          throw new Error(

            "OSRM HTTP " + response.status

          );

        }

        const data = await response.json();

        if (!data.routes || !data.routes.length) {

          throw new Error("Aucune route OSRM");

        }

        return data.routes[0];

      }

      // ==================================================

      // ROUTE CONDUCTEUR → PASSAGER

      // ==================================================

      async function startPickupRoute(d) {

        if (!valid(d) || destinationRouteActive) {

          return;

        }

        // Conserver la dernière demande si un calcul est en cours.

        if (routeRequestRunning) {

          pendingPickupDriver = d;

          return;

        }

        if (pickupRouteActive && pickupRouteLayer) {

          return;

        }

        routeRequestRunning = true;

        const generation = pickupRouteGeneration;

        try {

          const route = await fetchRoute(

            point(d),

            point(PASSENGER)

          );

          if (

            generation !== pickupRouteGeneration ||

            destinationRouteActive

          ) {

            return;

          }

          pickupRoutePoints =

            route.geometry.coordinates.map(function (p) {

              return [p[1], p[0]];

            });

          pickupRoutePoints.unshift(point(d));

          pickupRoutePoints.push(point(PASSENGER));

          removeLayer(pickupRouteLayer);

          pickupRouteLayer = L.polyline(

            pickupRoutePoints,

            {

              color: "#16a34a",

              weight: 5,

              opacity: 0.92,

              lineCap: "round",

              lineJoin: "round",

            }

          ).addTo(map);

          pickupRouteActive = true;

          pickupRouteLayer.bringToFront();

          send("route_info", {

            distance: route.distance,

            duration: route.duration,

            eta: Date.now() + route.duration * 1000,

          });

          debug("Route conducteur → passager créée");

        } catch (e) {

          send("webview_js_error", {

            message: "Route pickup : " + String(e),

          });

        } finally {

          routeRequestRunning = false;

          const pending = pendingPickupDriver;

          pendingPickupDriver = null;

          if (

            pending &&

            !pickupRouteActive &&

            !destinationRouteActive

          ) {

            Promise.resolve().then(function () {

              startPickupRoute(pending);

            });

          }

        }

      }

      function stopPickupRoute() {

        pickupRouteGeneration++;

        pendingPickupDriver = null;

        pickupRouteActive = false;

        pickupRoutePoints = [];

        removeLayer(pickupRouteLayer);

        pickupRouteLayer = null;

      }

      // ==================================================

      // ROUTE CONDUCTEUR → DESTINATION

      // L'icône destination apparaît avec cette route.

      // ==================================================

      async function startDestinationRoute(d, dest) {

        if (

          !valid(d) ||

          !valid(dest) ||

          destinationRequestRunning

        ) {

          return;

        }

        destinationRequestRunning = true;

        stopPickupRoute();

        clearSearchLine();

        try {

          const route = await fetchRoute(

            point(d),

            point(dest)

          );

          destinationRoutePoints =

            route.geometry.coordinates.map(function (p) {

              return [p[1], p[0]];

            });

          destinationRoutePoints.unshift(point(d));

          destinationRoutePoints.push(point(dest));

          removeLayer(destinationRouteLayer);

          destinationRouteLayer = L.polyline(

            destinationRoutePoints,

            {

              color: "#16a34a",

              weight: 5,

              opacity: 0.92,

              lineCap: "round",

              lineJoin: "round",

            }

          ).addTo(map);

          destinationRouteActive = true;

          // Afficher l'icône rouge sur la destination exacte.

          showDestination(dest);

          destinationRouteLayer.bringToFront();

          send("destination_route_info", {

            distance: route.distance,

            duration: route.duration,

            eta: Date.now() + route.duration * 1000,

          });

          debug("Route conducteur → destination créée");

        } catch (e) {

          send("webview_js_error", {

            message: "Route destination : " + String(e),

          });

        } finally {

          destinationRequestRunning = false;

        }

      }

      function stopDestinationRoute() {

        destinationRouteActive = false;

        destinationRoutePoints = [];

        removeLayer(destinationRouteLayer);

        destinationRouteLayer = null;

        hideDestination();

      }

      // ==================================================

      // MISE À JOUR DE LA POSITION DU CONDUCTEUR

      // ==================================================

      function updateDriverPosition(d) {

        if (!valid(d)) return;

        const id = idOf(d);

        if (!id || id === "unknown") return;

        let marker = driverMarkers[id];

        if (!marker) {

          showDrivers([d], false);

          marker = driverMarkers[id];

          if (!marker) return;

          marker._driverData = d;

          if (

            pickupRouteActive &&

            !destinationRouteActive

          ) {

            trimRoute(

              pickupRouteLayer,

              pickupRoutePoints,

              point(d),

              "pickup"

            );

          } else if (destinationRouteActive) {

            trimRoute(

              destinationRouteLayer,

              destinationRoutePoints,

              point(d),

              "destination"

            );

          }

          return;

        }

        marker._driverData = d;

        // L'animation met à jour la position et raccourcit la route.

        animateMarker(marker, point(d));

      }

      // ==================================================

      // CONDUCTEUR ACCEPTÉ

      // ==================================================

      function showAcceptedDriver(d) {

        if (!d) return;

        clearSearchLine();

        stopDestinationRoute();

        clearDrivers();

        showDrivers([d], true);

        startPickupRoute(d);

        debug(

          "Conducteur accepté affiché en mode tracking : " +

          (d.name || idOf(d))

        );

      }

      // ==================================================

      // RÉCEPTION DES MESSAGES REACT NATIVE → LEAFLET

      // ==================================================

      window.__ntaakataReceiveMessage = function (message) {

        try {

          let data = message;

          if (typeof data === "string") {

            data = JSON.parse(data);

          }

          if (!data) return;

          if (data.type === "drivers_update") {

            if (MODE !== "drivers") return;

            showDrivers(data.drivers || [], true);

            return;

          }

          if (data.type === "searching_driver") {

            if (MODE !== "drivers") return;

            if (data.driver) {

              drawSearchLine(data.driver);

            } else {

              clearSearchLine();

            }

            return;

          }

          if (

            data.type === "driver_route" ||

            data.type === "show_driver_route"

          ) {

            if (MODE !== "tracking") return;

            showAcceptedDriver(data.driver);

            return;

          }

          if (data.type === "driver_position") {

            if (MODE !== "tracking") return;

            updateDriverPosition(data.driver);

            return;

          }

          if (data.type === "stop_routes") {

            stopPickupRoute();

            clearSearchLine();

            return;

          }

          if (data.type === "driver_arrived") {

            stopPickupRoute();

            clearSearchLine();

            hidePassenger();

            debug(

              "Statut conducteur arrivé reçu : icône passager masquée"

            );

            return;

          }

          if (data.type === "start_destination_route") {

            if (MODE !== "tracking") return;

            const d = data.driver;

            const dest =

              data.destination ||

              data.destinationLocation ||

              INITIAL_DESTINATION;

            if (d && dest) {

              startDestinationRoute(d, dest);

            }

            return;

          }

          if (data.type === "stop_destination_route") {

            stopDestinationRoute();

            return;

          }

          if (data.type === "tracking_driver") {

            if (MODE !== "tracking") return;

            showAcceptedDriver(data.driver);

            return;

          }

          if (data.type === "clear_search") {

            clearSearchLine();

            return;

          }

        } catch (e) {

          send("webview_js_error", {

            message: "Réception message : " + String(e),

            stack: e && e.stack ? String(e.stack) : "",

          });

        }

      };

      document.addEventListener("message", function (e) {

        window.__ntaakataReceiveMessage(e.data);

      });

      window.addEventListener("message", function (e) {

        window.__ntaakataReceiveMessage(e.data);

      });

      // ==================================================

      // INITIALISATION

      // ==================================================

      showPassenger();

      if (MODE === "drivers") {

        showDrivers(INITIAL_DRIVERS, true);

        if (SEARCHING_DRIVER) {

          drawSearchLine(SEARCHING_DRIVER);

        }

      } else if (

        MODE === "tracking" &&

        INITIAL_DRIVER

      ) {

        showAcceptedDriver(INITIAL_DRIVER);

      }

      // La route destination ne démarre pas automatiquement.

      // React Native l'active explicitement.

      map.whenReady(function () {

        debug("WebView Leaflet prête");

        send("ready");

      });

    })();

  </script>

</body>

</html>`;

}