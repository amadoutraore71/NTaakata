export function mapTemplate(
  currentLocation,
  icons
) {
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

</style>

</head>

<body>

<div id="map"></div>

<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>

<script src="https://unpkg.com/leaflet-rotatedmarker@0.2.0/leaflet.rotatedMarker.js"></script>

<script>

const map = L.map("map").setView(
[
${currentLocation.latitude},
${currentLocation.longitude}
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

let selectedDriver = null;
let routeLayer = null;

const passengerIcon = L.icon({

iconUrl: "${icons.passenger}",

iconSize: [42,42],

iconAnchor: [21,42],

popupAnchor: [0,-35]

});

L.marker(
[
${currentLocation.latitude},
${currentLocation.longitude}
],
{
icon: passengerIcon
}
)
.addTo(map)
.bindPopup("📍 Vous êtes ici")
.openPopup();

`;
}