export default function generateLeafletHtml(
    currentLocation,
    drivers,
    icons
) {

    let markers = "";
  function updateDrivers(drivers){

  const activeIds = [];

  drivers.forEach(driver=>{

    activeIds.push(driver.id);

    if(markers[driver.id]){

      markers[driver.id].setLatLng([
        driver.latitude,
        driver.longitude
      ]);

    }else{

      createMarker(driver);

    }

  });

  Object.keys(markers).forEach(id=>{

    if(!activeIds.includes(id)){

      removeMarker(id);

    }

  });

}
    drivers.forEach((driver) => {
        const iconUrl =
            driver.vehicleType === "moto"
                ? icons.moto
                : icons.car;

        markers += `

      const icon${driver.id} = L.icon({
        iconUrl: "${iconUrl}",
        iconSize: [40,40],
        iconAnchor: [20,40],
        popupAnchor: [0,-35]
      });
markers["${driver.id}"] =
L.marker(
[
${driver.latitude},
${driver.longitude}
],
{
icon:icon${driver.id}
}
)
.addTo(map);

markers["${driver.id}"]
.bindPopup(
"<b>${driver.name}</b><br>${driver.vehicleType}"
);

    `;
    });

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

<script>

const map = L.map("map").setView(
[
${currentLocation.latitude},
${currentLocation.longitude}
],
15
);
const markers = {};
function createMarker(driver){

  const icon = L.icon({

    iconUrl:
      driver.vehicleType === "moto"
      ? driver.iconMoto
      : driver.iconCar,

    iconSize:[40,40],
    iconAnchor:[20,40],
    popupAnchor:[0,-35]

  });

  markers[driver.id] =
    L.marker(
      [
        driver.latitude,
        driver.longitude
      ],
      {
        icon
      }
    )
    .addTo(map);

  markers[driver.id]
    .bindPopup(
      "<b>"+driver.name+"</b><br>"+driver.vehicleType
    );

}
    function removeMarker(id){

  if(markers[id]){

    map.removeLayer(markers[id]);

    delete markers[id];

  }

}
L.tileLayer(
"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
{
  maxZoom:19
}
).addTo(map);

const passengerIcon = L.icon({

  iconUrl:"${icons.passenger}",

  iconSize:[42,42],

  iconAnchor:[21,42],

  popupAnchor:[0,-35]

});

L.marker(
[
${currentLocation.latitude},
${currentLocation.longitude}
],
{
icon:passengerIcon
}
)
.addTo(map)
.bindPopup("📍 Vous êtes ici")
.openPopup();

${markers}
window.addEventListener("message", function(event){

  try{

    const drivers = JSON.parse(event.data);

    updateDrivers(drivers);

  }catch(e){
    console.log(e);
  }

});
</script>

</body>

</html>
`;
}