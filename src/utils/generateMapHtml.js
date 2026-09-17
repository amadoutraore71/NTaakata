export default function generateMapHtml({
  mode = "tracking",
  passengerLocation = null,
  driverLocation = null,
  destinationLocation = null,
  drivers = [],
  passengerLabel = "Moi",
}) {
  const normalize = (p) => {
    if (!p) return null;
    const latitude = Number(p.latitude);
    const longitude = Number(p.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  };

  const passenger = normalize(passengerLocation);
  const destination = normalize(destinationLocation);
  const driver = normalize(driverLocation);

  const normalizedDrivers = Array.isArray(drivers)
    ? drivers.map((d) => {
        const p = normalize(d);
        if (!p) return null;
        return {
          ...d,
          id: String(d.id ?? d.docId ?? d.userId ?? "driver"),
          latitude: p.latitude,
          longitude: p.longitude,
        };
      }).filter(Boolean)
    : [];

  const initialDriver = driver
    ? {
        ...(normalizedDrivers[0] || {}),
        ...driverLocation,
        id: String(
          driverLocation?.id ??
          driverLocation?.docId ??
          driverLocation?.userId ??
          normalizedDrivers[0]?.id ??
          "driver"
        ),
        latitude: driver.latitude,
        longitude: driver.longitude,
      }
    : normalizedDrivers[0] || null;

  const safe = (value) => JSON.stringify(value).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
html,body,#map{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#f5f6f7}
.nta-marker{background:transparent!important;border:0!important;box-shadow:none!important}
.driver-marker{width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:transparent;filter:drop-shadow(0 1px 2px rgba(0,0,0,.28))}
.driver-marker{transform-origin:center center;will-change:transform}
.driver-marker svg{width:34px;height:34px;display:block}
.passenger-marker{
  width:22px;
  height:27px;
  background:transparent;
  position:relative;
  filter:drop-shadow(0 2px 3px rgba(0,0,0,.22));
}
.passenger-pin{
  position:absolute;
  top:0;
  left:0px;
  width:17px;
  height:17px;
  background:#1677e8;
  border:2px solid #fff;
  border-radius:50% 50% 50% 0;
  transform:rotate(-45deg);
  display:flex;
  align-items:center;
  justify-content:center;
}
.passenger-pin-label{
  transform:rotate(45deg);
  color:#fff;
  font-size:10px;
  font-weight:700;
  line-height:1;
  letter-spacing:-.2px;
}
.passenger-pin-point{
  display:none;
}
.destination-marker{width:22px;height:27px;display:flex;align-items:flex-start;justify-content:center;filter:drop-shadow(0 1px 2px rgba(0,0,0,.22))}
.destination-marker .pin{width:17px;height:17px;background:#ef4444;border:2px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center}
.destination-marker .pin-dot{width:4px;height:4px;background:#fff;border-radius:50%;transform:rotate(45deg)}
.leaflet-control-zoom{margin-top:8px!important}
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function(){
  const MODE=${safe(mode)};
  const INITIAL_PASSENGER=${safe(passenger)};
  const INITIAL_DESTINATION=${safe(destination)};
  const INITIAL_DRIVER=${safe(initialDriver)};
  const INITIAL_DRIVERS=${safe(normalizedDrivers)};

  let map=null;
  let passengerMarker=null;
  let destinationMarker=null;
  let driverMarker=null;

  let activeRouteLayer=null;
  let activeRoutePoints=[];
  let activeRouteKind=null;

  let animationFrame=null;
  let animationToken=0;
  let lastDriverPosition=null;
  let driverHeading=0;
  let headingInitialized=false;

  function calculateHeading(from,to){
    if(!valid(from)||!valid(to))return null;
    const lat1=Number(from.latitude)*Math.PI/180;
    const lat2=Number(to.latitude)*Math.PI/180;
    const dLon=(Number(to.longitude)-Number(from.longitude))*Math.PI/180;
    const y=Math.sin(dLon)*Math.cos(lat2);
    const x=Math.cos(lat1)*Math.sin(lat2)-
      Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
    const angle=Math.atan2(y,x)*180/Math.PI;
    return (angle+360)%360;
  }

  function shortestAngle(from,to){
    return ((to-from+540)%360)-180;
  }

  function setDriverHeading(angle, immediate=false){
    if(!Number.isFinite(angle)||!driverMarker)return;
    const element=driverMarker.getElement();
    const icon=element?.querySelector?.('.driver-marker');
    if(!icon)return;

    if(!headingInitialized || immediate){
      driverHeading=angle;
      headingInitialized=true;
    }else{
      const delta=shortestAngle(driverHeading,angle);
      // Rotation progressive : on ne saute jamais brutalement d'un angle à l'autre.
      driverHeading+=delta*0.18;
    }

    icon.style.transform=\`rotate(\${driverHeading}deg)\`;
  }

  function send(data){
    try{window.ReactNativeWebView.postMessage(JSON.stringify(data));}catch(e){}
  }
  function debug(message){send({type:"debug",message});}
  function valid(p){
    return p && Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude));
  }
  function ll(p){return [Number(p.latitude),Number(p.longitude)];}

  function vehicleSvg(type){
    const isMoto=String(type||"").trim().toLowerCase().includes("moto");

    if(isMoto){
      // Moto dessinée avec l'avant vers le HAUT.
      // Ainsi 0° = Nord et la rotation suit directement le heading GPS.
      return '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">'+
        '<circle cx="16" cy="6" r="3.1" stroke="#111827" stroke-width="2.2"/>'+
        '<circle cx="16" cy="26" r="3.1" stroke="#111827" stroke-width="2.2"/>'+
        '<path d="M16 9v4.2l-4.2 5.1v4.1h8.4v-4.1L16 13.2" stroke="#16A34A" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>'+
        '<path d="M13.1 18.3h5.8M13.8 13.1h4.4" stroke="#16A34A" stroke-width="2.2" stroke-linecap="round"/>'+
        '<path d="M18.8 10.2l2.1-2.3" stroke="#111827" stroke-width="2" stroke-linecap="round"/>'+
        '</svg>';
    }

    // Voiture dessinée avec l'avant vers le HAUT.
    return '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">'+
      '<path d="M9 9.5h14l2.7 7.1v8.1H6.3v-8.1L9 9.5Z" stroke="#16A34A" stroke-width="2.2" stroke-linejoin="round"/>'+
      '<path d="M10.5 9.5 12.1 6.8h7.8l1.6 2.7" stroke="#16A34A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'+
      '<path d="M10 15.2h12" stroke="#16A34A" stroke-width="2.1" stroke-linecap="round"/>'+
      '<circle cx="8.2" cy="24.1" r="2.4" fill="#111827"/>'+
      '<circle cx="23.8" cy="24.1" r="2.4" fill="#111827"/>'+
      '<path d="M11 19.2h10" stroke="#111827" stroke-width="1.7" stroke-linecap="round"/>'+
      '</svg>';
  }

  function passengerHtml(){
    return '<div class="passenger-marker">'+
      '<div class="passenger-pin">'+
       '<div class="passenger-pin-label"></div>'+
        '<div class="passenger-pin-point"></div>'+
      '</div>'+
    '</div>';
  }

  function driverIcon(type){
    return L.divIcon({
      className:"nta-marker",
      html:'<div class="driver-marker">'+vehicleSvg(type)+'</div>',
      iconSize:[29,29],
iconAnchor:[14.5,14.5]
    });
  }
  function passengerIcon(){
    return L.divIcon({
      className:"nta-marker",
      html:passengerHtml(),
      iconSize: [22, 27],
      iconAnchor: [11, 26],
    });
  }
  function destinationIcon(){
    return L.divIcon({
      className:"nta-marker",
      html:'<div class="destination-marker"><div class="pin"><div class="pin-dot"></div></div></div>',
      iconSize:[22,27],
      iconAnchor:[11,25]
    });
  }

  function showPassenger(p){
    if(!valid(p))return;
    if(!passengerMarker){
      passengerMarker=L.marker(ll(p),{icon:passengerIcon(),zIndexOffset:1000}).addTo(map);
      debug("👤 Passager visible");
    }else passengerMarker.setLatLng(ll(p));
  }
  function hidePassenger(){
    if(passengerMarker){
      map.removeLayer(passengerMarker);
      passengerMarker=null;
      debug("👤 Passager masqué");
    }
  }
  function showDestination(p){
    if(!valid(p))return;
    if(!destinationMarker){
      destinationMarker=L.marker(ll(p),{icon:destinationIcon(),zIndexOffset:900}).addTo(map);
      debug("📍 Destination visible");
    }else destinationMarker.setLatLng(ll(p));
  }
  function hideDestination(){
    if(destinationMarker){
      map.removeLayer(destinationMarker);
      destinationMarker=null;
    }
  }
  function showDriver(d){
    if(!valid(d))return;
    const type=String(d.vehicleType||d.driverVehicleType||"car").trim().toLowerCase();
    if(!driverMarker){
      driverMarker=L.marker(ll(d),{icon:driverIcon(type),zIndexOffset:1200}).addTo(map);
      debug("🚗 Conducteur visible");
    }else{
      driverMarker.setLatLng(ll(d));
    }
    lastDriverPosition={latitude:Number(d.latitude),longitude:Number(d.longitude)};

    // À l'affichage initial, on conserve l'orientation actuelle sans provoquer de rotation.
    const initialHeading = Number(d.heading);
    if(Number.isFinite(initialHeading)) setDriverHeading(initialHeading,true);
  }

  function clearRoute(){
    if(activeRouteLayer){
      map.removeLayer(activeRouteLayer);
      activeRouteLayer=null;
    }
    activeRoutePoints=[];
    activeRouteKind=null;
  }

  function drawRoute(points,kind){
    clearRoute();
    activeRoutePoints=points.slice();
    activeRouteKind=kind;
    activeRouteLayer=L.polyline(activeRoutePoints,{
      color:"#16A34A",
      weight:3,
      opacity:.95,
      lineCap:"round",
      lineJoin:"round"
    }).addTo(map);
  }

  function distance(a,b){
    const latScale=111320;
    const lonScale=111320*Math.cos(((Number(a[0])+Number(b[0]))/2)*Math.PI/180);
    const dy=(Number(b[0])-Number(a[0]))*latScale;
    const dx=(Number(b[1])-Number(a[1]))*lonScale;
    return Math.sqrt(dx*dx+dy*dy);
  }

  function projectOnSegment(p,a,b){
    const latScale=111320;
    const lonScale=111320*Math.cos(Number(p[0])*Math.PI/180);
    const ax=Number(a[1])*lonScale, ay=Number(a[0])*latScale;
    const bx=Number(b[1])*lonScale, by=Number(b[0])*latScale;
    const px=Number(p[1])*lonScale, py=Number(p[0])*latScale;
    const dx=bx-ax,dy=by-ay;
    const len2=dx*dx+dy*dy;
    let t=len2?((px-ax)*dx+(py-ay)*dy)/len2:0;
    t=Math.max(0,Math.min(1,t));
    return [
      Number(a[0])+(Number(b[0])-Number(a[0]))*t,
      Number(a[1])+(Number(b[1])-Number(a[1]))*t
    ];
  }

  function projectOnRoute(p,points){
    if(!points.length)return null;
    if(points.length===1)return {point:points[0],distance:0,index:0};
    const target=ll(p);
    let best={point:points[0],distance:Infinity,index:0};
    let travelled=0;
    for(let i=0;i<points.length-1;i++){
      const a=points[i],b=points[i+1];
      const proj=projectOnSegment(target,a,b);
      const d=distance(target,proj);
      if(d<best.distance){
        best={point:proj,distance:d,index:i};
      }
      travelled+=distance(a,b);
    }
    return best;
  }

  function routeTotal(points){
    let total=0;
    for(let i=0;i<points.length-1;i++)total+=distance(points[i],points[i+1]);
    return total;
  }

  function routePositionAt(points,meters){
    if(!points.length)return null;
    if(points.length===1)return points[0];
    let remaining=Math.max(0,Math.min(meters,routeTotal(points)));
    for(let i=0;i<points.length-1;i++){
      const seg=distance(points[i],points[i+1]);
      if(remaining<=seg){
        const t=seg?remaining/seg:0;
        return [
          points[i][0]+(points[i+1][0]-points[i][0])*t,
          points[i][1]+(points[i+1][1]-points[i][1])*t
        ];
      }
      remaining-=seg;
    }
    return points[points.length-1];
  }

  function cumulativeDistanceToProjection(points,projection){
    if(!points.length)return 0;
    if(points.length===1)return 0;
    let total=0;
    for(let i=0;i<points.length-1;i++){
      const a=points[i],b=points[i+1];
      const proj=projectOnSegment(projection,a,b);
      const d=distance(projection,proj);
      if(d<1.5){
        return total+distance(a,proj);
      }
      total+=distance(a,b);
    }
    return total;
  }

  function trimRoute(position){
    if(!activeRouteLayer||activeRoutePoints.length<2)return;
    const target=ll(position);
    let bestIndex=0,bestDist=Infinity,bestPoint=activeRoutePoints[0];
    for(let i=0;i<activeRoutePoints.length-1;i++){
      const proj=projectOnSegment(target,activeRoutePoints[i],activeRoutePoints[i+1]);
      const d=distance(target,proj);
      if(d<bestDist){
        bestDist=d;
        bestIndex=i;
        bestPoint=proj;
      }
    }
    const remaining=[target];
    if(bestDist>250){
      // If a Firestore point is temporarily off-route, do not distort the line.
      return;
    }
    remaining.push(bestPoint);
    for(let i=bestIndex+1;i<activeRoutePoints.length;i++)remaining.push(activeRoutePoints[i]);
    activeRouteLayer.setLatLngs(remaining);
  }

  function animateDriverTo(target,duration){
    if(!valid(target)||!driverMarker)return;

    const token=++animationToken;
    if(animationFrame)cancelAnimationFrame(animationFrame);

    const start=lastDriverPosition
      ? [lastDriverPosition.latitude,lastDriverPosition.longitude]
      : driverMarker.getLatLng();

    const targetLL=[Number(target.latitude),Number(target.longitude)];

    let useRoute=false;
    let startM=0,endM=0;

    if(activeRoutePoints.length>=2){
      const s=projectOnRoute({latitude:start[0],longitude:start[1]},activeRoutePoints);
      const e=projectOnRoute(target,activeRoutePoints);
      if(s&&e&&s.distance<150&&e.distance<150){
        startM=cumulativeDistanceToProjection(activeRoutePoints,s.point);
        endM=cumulativeDistanceToProjection(activeRoutePoints,e.point);
        useRoute=true;
      }
    }

    const t0=performance.now();
    const ease=(x)=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;

    let previousAnimatedPos={latitude:start[0],longitude:start[1]};

    function frame(now){
      if(token!==animationToken)return;
      const progress=Math.min(1,(now-t0)/duration);
      const e=ease(progress);
      let pos;

      if(useRoute){
        const meters=startM+(endM-startM)*e;
        pos=routePositionAt(activeRoutePoints,meters);
      }else{
        pos=[
          start[0]+(targetLL[0]-start[0])*e,
          start[1]+(targetLL[1]-start[1])*e
        ];
      }

      const previousPos=previousAnimatedPos;
      const currentPos={latitude:pos[0],longitude:pos[1]};

      // L'orientation suit la trajectoire réelle. Quand on suit une route OSRM,
      // on regarde légèrement devant le véhicule pour anticiper les virages.
      let heading=null;
      if(useRoute && activeRoutePoints.length>=2){
        const lookAheadMeters=Math.max(8, Math.min(25, Math.abs(endM-startM)*0.08));
        const currentMeters=startM+(endM-startM)*e;
        const aheadMeters=Math.min(routeTotal(activeRoutePoints), currentMeters+lookAheadMeters);
        const ahead=routePositionAt(activeRoutePoints,aheadMeters);
        if(ahead){
          heading=calculateHeading(currentPos,{latitude:ahead[0],longitude:ahead[1]});
        }
      }
      if(heading===null) heading=calculateHeading(previousPos,currentPos);
      if(heading!==null) setDriverHeading(heading);

      driverMarker.setLatLng(pos);
      lastDriverPosition=currentPos;
      previousAnimatedPos=currentPos;
      trimRoute({latitude:pos[0],longitude:pos[1]});

      if(progress<1){
        animationFrame=requestAnimationFrame(frame);
      }else{
        const finalPosition={latitude:targetLL[0],longitude:targetLL[1]};
        const finalHeading=calculateHeading(lastDriverPosition,finalPosition);
        if(finalHeading!==null) setDriverHeading(finalHeading);
        driverMarker.setLatLng(targetLL);
        lastDriverPosition=finalPosition;
        trimRoute(target);
        animationFrame=null;
      }
    }

    animationFrame=requestAnimationFrame(frame);
  }

  async function fetchRoute(start,end){
    const a=ll(start),b=ll(end);
    const direct=map.distance(a,b);
    if(direct<2)return {points:[a,b],distance:direct};

    const url="https://router.project-osrm.org/route/v1/driving/"+
      a[1]+","+a[0]+";"+b[1]+","+b[0]+"?overview=full&geometries=geojson";
    const response=await fetch(url);
    if(!response.ok)throw new Error("OSRM HTTP "+response.status);
    const data=await response.json();
    const coords=data.routes?.[0]?.geometry?.coordinates;
    if(!coords?.length)throw new Error("Réponse OSRM invalide");
    return {
      points:coords.map(c=>[Number(c[1]),Number(c[0])]),
      distance:Number(data.routes[0].distance||direct)
    };
  }

  async function showPickupRoute(d){
    if(!valid(d)||!valid(INITIAL_PASSENGER))return;
    try{
      const route=await fetchRoute(d,INITIAL_PASSENGER);
      drawRoute(route.points,"pickup");
      const bounds=activeRouteLayer.getBounds();
      if(bounds.isValid())map.fitBounds(bounds,{padding:[45,45],maxZoom:17});
      send({type:"route_info",distance:route.distance});
      debug("🟢 Route conducteur → passager tracée");
    }catch(e){
      drawRoute([ll(d),ll(INITIAL_PASSENGER)],"pickup");
      debug("⚠️ Route directe conducteur → passager utilisée");
    }
  }

  async function showDestinationRoute(d,destination){
    if(!valid(d)||!valid(destination))return;
    hidePassenger();
    showDestination(destination);
    try{
      const route=await fetchRoute(d,destination);
      drawRoute(route.points,"destination");
      const bounds=activeRouteLayer.getBounds();
      if(bounds.isValid())map.fitBounds(bounds,{padding:[45,45],maxZoom:17});
      send({type:"destination_route_info",distance:route.distance});
      debug("🟢 Route conducteur → destination tracée");
    }catch(e){
      drawRoute([ll(d),ll(destination)],"destination");
      debug("⚠️ Route directe conducteur → destination utilisée");
    }
  }

  function fitInitial(){
    const pts=[];
    if(valid(INITIAL_PASSENGER))pts.push(ll(INITIAL_PASSENGER));
    if(valid(INITIAL_DRIVER))pts.push(ll(INITIAL_DRIVER));
    if(pts.length===1)map.setView(pts[0],15);
    else if(pts.length>1)map.fitBounds(pts,{padding:[45,45],maxZoom:16});
  }

  function initialize(){
    map=L.map("map",{zoomControl:true,attributionControl:true});
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
      maxZoom:19,
      attribution:"&copy; OpenStreetMap contributors"
    }).addTo(map);

    // Début de course : destination volontairement cachée.
    showPassenger(INITIAL_PASSENGER);
    hideDestination();

    if(MODE==="tracking")showDriver(INITIAL_DRIVER);
    else INITIAL_DRIVERS.forEach(showDriver);

    fitInitial();
    send({type:"ready"});
    debug("✅ Carte créée une seule fois");
  }

  window.__ntaakataReceiveMessage=async function(payload){
    try{
      const m=typeof payload==="string"?JSON.parse(payload):payload;
      if(!m?.type)return;

      if(m.type==="driver_position"){
        if(valid(m.driver)){
          if(!driverMarker)showDriver(m.driver);
          else animateDriverTo(m.driver,900);
        }
        return;
      }

      if(m.type==="show_driver_route"){
        await showPickupRoute(m.driver);
        return;
      }

      if(m.type==="start_destination_route"){
        await showDestinationRoute(m.driver,m.destinationLocation||INITIAL_DESTINATION);
        return;
      }

      if(m.type==="hide_passenger"){
        hidePassenger();
        return;
      }

      if(m.type==="clear_driver_route"){
        clearRoute();
        return;
      }
    }catch(e){
      debug("❌ Erreur Leaflet : "+e.message);
    }
  };

  window.addEventListener("error",e=>{
    send({type:"webview_js_error",message:e.message||"Erreur JavaScript"});
  });

  initialize();
})();
</script>
</body>
</html>`;
}
