export function createMapTemplate(content) {
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

.driver-icon{
filter: drop-shadow(0 3px 8px rgba(0,0,0,.35));
animation:pulse 1.6s infinite;
}

@keyframes pulse{

0%{
transform:scale(1);
}

50%{
transform:scale(1.08);
}

100%{
transform:scale(1);
}

}

</style>

</head>

<body>

<div id="map"></div>

<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>

<script src="https://unpkg.com/leaflet-rotatedmarker@0.2.0/leaflet.rotatedMarker.js"></script>

<script>

${content}

</script>

</body>

</html>
`;
}