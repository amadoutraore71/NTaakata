export default function generateMapHtml({

  mode = "drivers",

  passengerLocation,

  driverLocation = null,

  drivers = [],

  searchingDriver = null,

  icons = {},

  destinationLocation = null,

}) {

  const passenger = passengerLocation || { latitude: 0, longitude: 0 };

  const initialDrivers = Array.isArray(drivers) ? drivers : [];

  const searching = searchingDriver || initialDrivers[0] || null;

  const driver = driverLocation || null;

  const destination = destinationLocation || null;



  return `<!DOCTYPE html>

<html>

<head>

<meta charset="utf-8" />

<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

<style>

html,body,#map{width:100%;height:100%;margin:0;padding:0;background:#dfe7e3;overflow:hidden}

.leaflet-container{font-family:Arial,sans-serif;background:#dfe7e3}

.vehicle-icon,.passenger-icon{background:transparent!important;border:0!important;box-shadow:none!important}

.vehicle-icon svg,.passenger-icon svg{display:block;width:100%;height:100%;filter:drop-shadow(0 1px 1px rgba(0,0,0,.25))}

</style>

</head>

<body>

<div id="map"></div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<script>

(function(){

  "use strict";



  const MODE = ${JSON.stringify(mode)};

  const PASSENGER = ${JSON.stringify(passenger)};

  const INITIAL_DRIVER = ${JSON.stringify(driver)};

  const INITIAL_DRIVERS = ${JSON.stringify(initialDrivers)};

  const SEARCHING_DRIVER = ${JSON.stringify(searching)};

  const DESTINATION = ${JSON.stringify(destination)};



  function send(type, payload){

    try {

      window.ReactNativeWebView.postMessage(JSON.stringify({type, ...(payload||{})}));

    } catch(e) {}

  }

  function debug(message){ send("debug", {message:String(message)}); }

    window.onerror = function(message, source, line, col, error) {
    const msg = String(message || "");
    const src = source ? String(source) : "";
    const hasDetails = !!(src || line || col || (error && error.stack));

    // WebView/Chromium can report a generic cross-origin
    // "Script error." with no useful source, line, column or stack.
    // It is not actionable and must not be treated as an application
    // JavaScript error.
    if (msg === "Script error." && !hasDetails) {
      debug("⚠️ WebView a signalé un Script error générique sans détails — ignoré");
      return true;
    }

    send("webview_js_error", {
      message: msg,
      source: src,
      line: line || 0,
      column: col || 0,
      stack: error && error.stack ? String(error.stack) : "",
    });

    return true;
  };



  window.addEventListener("unhandledrejection", function(event){

    const reason = event && event.reason;

    send("webview_js_error", {

      message: reason && reason.message ? String(reason.message) : String(reason || "Unhandled promise rejection"),

      stack: reason && reason.stack ? String(reason.stack) : ""

    });

  });



  debug("Le script HTML démarre");

  debug("MODE = " + MODE);



  if (typeof L === "undefined") {

    send("webview_js_error", {message:"Leaflet n'est pas chargé"});

    return;

  }



  const map = L.map("map", {zoomControl:false, attributionControl:true});

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {

    maxZoom:19,

    attribution:"© OpenStreetMap contributors"

  }).addTo(map);



  const passengerMarker = {};

  const driverMarkers = {};

  let pickupRouteLayer = null;

  let destinationRouteLayer = null;

  let searchingLineLayer = null;

  let searchingAnimationFrame = null;

  let pickupRouteShown = false;

  let destinationRouteShown = false;

  let pickupRoutePoints = null;

  let destinationRoutePoints = null;

  let pickupRouteIndex = 0;

  let destinationRouteIndex = 0;

  const ARRIVAL_THRESHOLD_METERS = 25;

  let routeRequestRunning = false;

  let destinationRequestRunning = false;

  let currentPhase = MODE === "tracking" ? "pickup" : "searching";



  const passengerSvg = '<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M16 2.5a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm-10 27c.9-6.1 4.3-9.2 10-9.2s9.1 3.1 10 9.2H6Z" fill="#16a34a"/></svg>';

  const carSvg = '<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M7 8.5h18l2.6 8H29a2 2 0 0 1 2 2v6h-3v2h-4v-2H8v2H4v-2H1v-6a2 2 0 0 1 2-2h1.4l2.6-8Zm2.3 3-1.6 5h16.6l-1.6-5H9.3ZM6 19.2a2.1 2.1 0 1 0 0 4.2 2.1 2.1 0 0 0 0-4.2Zm20 0a2.1 2.1 0 1 0 0 4.2 2.1 2.1 0 0 0 0-4.2Z" fill="#111827"/><path d="M9 13h14" stroke="#fff" stroke-width="1.2"/></svg>';

  const motoSvg = '<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="23" r="4" fill="#111827"/><circle cx="24" cy="23" r="4" fill="#111827"/><path d="M8 23h6l3-7h5l2 7h-4l-2-5h-4l-2 5H8Zm5-9h5l-2-4h-4l1 4Zm5 0 3-3 3 3" fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';



  function icon(svg, size, className){

    return L.divIcon({html:svg,className:className,iconSize:[size,size],iconAnchor:[size/2,size/2],popupAnchor:[0,-size/2]});

  }

  const passengerIcon = icon(passengerSvg, 24, "passenger-icon");

  const carIcon = icon(carSvg, 24, "vehicle-icon");

  const motoIcon = icon(motoSvg, 23, "vehicle-icon");



  function valid(p){

    if(!p) return false;

    return Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude));

  }

  function point(p){ return [Number(p.latitude), Number(p.longitude)]; }

  function idOf(d){ return String(d && (d.id || d.docId || d.userId || d.phone || "unknown")); }

  function vehicleIcon(d){ return String(d && d.vehicleType).toLowerCase() === "car" ? carIcon : motoIcon; }



  function showPassenger(){

    if(!valid(PASSENGER)) return;

    if(passengerMarker.layer){ map.removeLayer(passengerMarker.layer); }

    passengerMarker.layer = L.marker(point(PASSENGER), {icon:passengerIcon, zIndexOffset:1000}).addTo(map);

    debug("Marqueur passager créé");

  }



  function popupFor(d){

    const name = d && d.name ? String(d.name) : "Conducteur";

    return '<b>'+name+'</b>';

  }



  function trimRouteBehindDriver(points, layer, progressKey, lat, lng){

    if(!Array.isArray(points) || points.length < 2 || !layer) return;

    let startIndex = progressKey === "pickup" ? pickupRouteIndex : destinationRouteIndex;
    let nearestIndex = startIndex;
    let best = Infinity;

    for(let i=startIndex; i<points.length; i++){
      const p = points[i];
      const dLat = Number(p[0]) - lat;
      const dLng = Number(p[1]) - lng;
      const d = dLat*dLat + dLng*dLng;
      if(d < best){
        best = d;
        nearestIndex = i;
      }
    }

    if(nearestIndex < startIndex) nearestIndex = startIndex;

    if(progressKey === "pickup") pickupRouteIndex = nearestIndex;
    else destinationRouteIndex = nearestIndex;

    const remaining = points.slice(nearestIndex);
    if(remaining.length < 2) return;

    remaining[0] = [lat, lng];
    layer.setLatLngs(remaining);
  }



  function hidePassengerAtPickup(){

    if(passengerMarker.layer){
      try { map.removeLayer(passengerMarker.layer); } catch(e) {}
      passengerMarker.layer = null;
    }

    if(pickupRouteLayer){
      try { map.removeLayer(pickupRouteLayer); } catch(e) {}
      pickupRouteLayer = null;
    }

    pickupRoutePoints = null;
    pickupRouteIndex = 0;
    pickupRouteShown = true;
    debug("Passager arrivé : marqueur et route pickup supprimés");
  }



  function finishDestinationRoute(){

    if(destinationRouteLayer){
      try { map.removeLayer(destinationRouteLayer); } catch(e) {}
      destinationRouteLayer = null;
    }

    destinationRoutePoints = null;
    destinationRouteIndex = 0;
    destinationRouteShown = true;
    debug("Destination atteinte : route supprimée");
  }



  function animateMarker(marker, target, duration){

    if(!marker || !valid(target)) return;

    if(marker._animationFrame) cancelAnimationFrame(marker._animationFrame);

    const start = marker.getLatLng();
    const end = L.latLng(Number(target.latitude), Number(target.longitude));
    const ms = Math.max(250, Math.min(Number(duration)||650, 900));
    const started = performance.now();

    function frame(now){

      const t = Math.min(1, (now-started)/ms);
      const e = t*t*(3-2*t);
      const lat = start.lat + (end.lat-start.lat)*e;
      const lng = start.lng + (end.lng-start.lng)*e;

      marker.setLatLng([lat,lng]);

      if(marker._routeKind === "pickup" && pickupRouteLayer && pickupRoutePoints){
        trimRouteBehindDriver(pickupRoutePoints, pickupRouteLayer, "pickup", lat, lng);
        if(map.distance(L.latLng(lat,lng), L.latLng(point(PASSENGER)[0],point(PASSENGER)[1])) <= ARRIVAL_THRESHOLD_METERS){
          hidePassengerAtPickup();
        }
      }

      if(marker._routeKind === "destination" && destinationRouteLayer && destinationRoutePoints && valid(DESTINATION)){
        trimRouteBehindDriver(destinationRoutePoints, destinationRouteLayer, "destination", lat, lng);
        if(map.distance(L.latLng(lat,lng), L.latLng(point(DESTINATION)[0],point(DESTINATION)[1])) <= ARRIVAL_THRESHOLD_METERS){
          finishDestinationRoute();
        }
      }

      if(t<1) marker._animationFrame=requestAnimationFrame(frame);
      else {
        marker._animationFrame=null;
        marker.setLatLng(end);
      }
    }

    marker._animationFrame=requestAnimationFrame(frame);
  }


  function showDrivers(list, fit){

    const arr = Array.isArray(list) ? list : [];

    const active = new Set();

    arr.forEach(function(d){

      if(!valid(d)) return;

      const id = idOf(d);

      active.add(id);

      const pos = point(d);

      let marker = driverMarkers[id];

      if(!marker){

        marker = L.marker(pos, {icon:vehicleIcon(d), zIndexOffset:500}).addTo(map);

        marker._driverData = d;

        marker.bindPopup(popupFor(d));

        driverMarkers[id]=marker;

      } else {

        const distance = map.distance(marker.getLatLng(), L.latLng(pos[0],pos[1]));

        marker._driverData = d;

        marker.setPopupContent(popupFor(d));

        animateMarker(marker, d, distance > 100 ? 750 : 550);

      }

    });

    Object.keys(driverMarkers).forEach(function(id){

      if(!active.has(id) && MODE !== "tracking"){

        if(driverMarkers[id]._animationFrame) cancelAnimationFrame(driverMarkers[id]._animationFrame);

        map.removeLayer(driverMarkers[id]);

        delete driverMarkers[id];

      }

    });

    debug("Conducteurs affichés : " + active.size);

    if(fit && active.size){

      const points=[point(PASSENGER)];

      arr.filter(valid).forEach(function(d){points.push(point(d));});

      if(points.length>1) map.fitBounds(points,{padding:[35,35],maxZoom:16});

    }

  }



  function removeSearchingLine(){

    if(searchingAnimationFrame){

      try { cancelAnimationFrame(searchingAnimationFrame); } catch(e) {}

    }

    searchingAnimationFrame=null;

    if(searchingLineLayer){

      try { map.removeLayer(searchingLineLayer); } catch(e) {}

      searchingLineLayer=null;

    }

  }



  function drawSearchingLine(d){

    removeSearchingLine();

    if(!valid(PASSENGER)||!valid(d)) return;

    const a=point(PASSENGER), b=point(d);

    // Ligne de recherche statique : pas de requestAnimationFrame.

    // Cela évite les erreurs WebView et évite une boucle JS permanente.

    searchingLineLayer=L.polyline([a,b],{

      color:"#2563eb",

      weight:3,
      opacity:.9,

      lineCap:"butt"

    }).addTo(map);

    debug("Ligne de recherche affichée");

  }



  async function fetchRoute(from,to,kind){

    if(!valid(from)||!valid(to)) return;

    const url="https://router.project-osrm.org/route/v1/driving/"+Number(from.longitude)+","+Number(from.latitude)+";"+Number(to.longitude)+","+Number(to.latitude)+"?overview=full&geometries=geojson";

    try{

      const response=await fetch(url);

      if(!response.ok) throw new Error("OSRM HTTP "+response.status);

      const json=await response.json();

      const coords=json && json.routes && json.routes[0] && json.routes[0].geometry && json.routes[0].geometry.coordinates;

      if(!Array.isArray(coords)||coords.length<2) throw new Error("Aucun tracé OSRM");

      const latLngs=coords.map(function(c){return [Number(c[1]),Number(c[0])];});

      if(kind==="pickup"){

        pickupRoutePoints=latLngs;

        if(pickupRouteLayer) map.removeLayer(pickupRouteLayer);

        pickupRouteLayer=L.polyline(latLngs,{color:"#16a34a",weight:4,opacity:.95}).addTo(map);

      } else {

        destinationRoutePoints=latLngs;

        if(destinationRouteLayer) map.removeLayer(destinationRouteLayer);

        destinationRouteLayer=L.polyline(latLngs,{color:"#16a34a",weight:4,opacity:.95}).addTo(map);

      }

      send(kind==="pickup"?"route_info":"destination_route_info",{distance:json.routes[0].distance,duration:json.routes[0].duration});

      debug("Route "+kind+" créée UNE FOIS");

    }catch(e){
      const fallback = [point(from), point(to)];

      if(kind==="pickup"){
        pickupRoutePoints=fallback;
        pickupRouteIndex=0;
        if(pickupRouteLayer) map.removeLayer(pickupRouteLayer);
        pickupRouteLayer=L.polyline(fallback,{color:"#16a34a",weight:4,opacity:.95}).addTo(map);
      } else {
        destinationRoutePoints=fallback;
        destinationRouteIndex=0;
        if(destinationRouteLayer) map.removeLayer(destinationRouteLayer);
        destinationRouteLayer=L.polyline(fallback,{color:"#16a34a",weight:4,opacity:.95}).addTo(map);
      }

      debug("Route "+kind+" : tracé direct de secours");
      send("webview_js_error",{message:"OSRM indisponible pour "+kind+" : "+String(e)});
    }

  }



  function startPickupRoute(d){

    if(pickupRouteShown || routeRequestRunning || !valid(d)||!valid(PASSENGER)) return;

    routeRequestRunning=true;

    currentPhase="pickup";

    const id=idOf(d);

    if(!driverMarkers[id]) showDrivers([d],false);

    if(driverMarkers[id]) driverMarkers[id]._routeKind="pickup";

    fetchRoute(d,PASSENGER,"pickup").finally(function(){pickupRouteShown=true;routeRequestRunning=false;});

  }



  function startDestinationRoute(d){

    if(destinationRouteShown || destinationRequestRunning || !valid(d)||!valid(DESTINATION)) return;

    destinationRequestRunning=true;

    currentPhase="destination";

    removeSearchingLine();

    const id=idOf(d);

    if(!driverMarkers[id]) showDrivers([d],false);

    if(driverMarkers[id]) driverMarkers[id]._routeKind="destination";

    fetchRoute(d,DESTINATION,"destination").finally(function(){destinationRouteShown=true;destinationRequestRunning=false;});

  }



  function updateDriver(d){

    if(!valid(d)) return;

    const id=idOf(d);

    let marker=driverMarkers[id];

    if(!marker){

      showDrivers([d],false);

      marker=driverMarkers[id];

    }

    if(!marker) return;

    if(currentPhase==="pickup") marker._routeKind="pickup";

    if(currentPhase==="destination") marker._routeKind="destination";

    animateMarker(marker,d,650);

    marker._driverData=d;

  }



  function setPhase(phase){

    currentPhase=phase;

    if(phase==="searching"){

      pickupRouteShown=false;

      removeSearchingLine();

      Object.keys(driverMarkers).forEach(function(id){driverMarkers[id]._routeKind=null;});

    }

    if(phase==="pickup") removeSearchingLine();

    if(phase==="destination") removeSearchingLine();

  }



  function receive(message){

    try{

      const data=typeof message==="string"?JSON.parse(message):message;

      if(!data) return;

      if(data.type==="drivers_update"){

        showDrivers(data.drivers||[], MODE!=="tracking");

        if(MODE!=="tracking" && currentPhase==="searching"){

          const candidate=SEARCHING_DRIVER || (data.drivers||[])[0];

          if(candidate) drawSearchingLine(candidate);

        }

        return;

      }

      if(data.type==="searching_driver"){

        if(MODE!=="tracking"){

          currentPhase="searching";

          if(data.driver) drawSearchingLine(data.driver); else removeSearchingLine();

        }

        return;

      }

      if(data.type==="clear_search" || data.type==="stop_routes"){

        removeSearchingLine();

        return;

      }

      if(data.type==="set_phase"){

        setPhase(data.phase); return;

      }

      if(data.type==="driver_position"){

        updateDriver(data.driver); return;

      }

      if(data.type==="driver_route" || data.type==="show_driver_route"){

        setPhase("pickup");

        startPickupRoute(data.driver); return;

      }

      if(data.type==="start_destination_route"){

        setPhase("destination");

        if(data.destination) DESTINATION.latitude=Number(data.destination.latitude), DESTINATION.longitude=Number(data.destination.longitude);

        startDestinationRoute(data.driver); return;

      }

      if(data.type==="stop_destination_route"){

        if(destinationRouteLayer){map.removeLayer(destinationRouteLayer);destinationRouteLayer=null;}

        destinationRouteShown=false; destinationRoutePoints=null; return;

      }

    }catch(e){send("webview_js_error",{message:"Erreur réception message : "+String(e)});}

  }



  window.__ntaakataReceiveMessage=receive;

  document.addEventListener("message",function(e){receive(e.data);});

  window.addEventListener("message",function(e){receive(e.data);});



  showPassenger();

  // En mode tracking, Leaflet doit recevoir une vue initiale.
  // Sinon la carte peut rester vide après l'acceptation du conducteur.
  if(MODE==="tracking" && valid(PASSENGER)){
    map.setView(point(PASSENGER), 15);
    debug("Vue tracking initialisée sur le passager");
  }

  if(MODE==="drivers"){

    currentPhase="searching";

    showDrivers(INITIAL_DRIVERS,true);

    if(SEARCHING_DRIVER) drawSearchingLine(SEARCHING_DRIVER);

    else if(INITIAL_DRIVERS[0]) drawSearchingLine(INITIAL_DRIVERS[0]);

  } else {

    currentPhase="pickup";

    if(INITIAL_DRIVER){

      showDrivers([INITIAL_DRIVER],false);

      if(driverMarkers[idOf(INITIAL_DRIVER)]) driverMarkers[idOf(INITIAL_DRIVER)]._routeKind="pickup";

      if(valid(INITIAL_DRIVER) && valid(PASSENGER)){
        map.fitBounds(
          [point(PASSENGER), point(INITIAL_DRIVER)],
          {padding:[35,35], maxZoom:16}
        );
        debug("Vue tracking cadrée sur passager + conducteur");
      }

    }

  }



  map.whenReady(function(){send("ready");debug("WebView Leaflet prête");});

})();

</script>

</body>

</html>`;

}
