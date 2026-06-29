export function markerManager(currentLocation) {

return `

function createMarker(driver) {

  const iconUrl =
    driver.vehicleType === "moto"
      ? driver.iconMoto
      : driver.iconCar;

  const driverIcon = L.icon({

    iconUrl: iconUrl,

    iconSize: [40,40],

    iconAnchor: [20,40],

    popupAnchor: [0,-35]

  });

  const marker = L.marker(

    [
      driver.latitude,
      driver.longitude
    ],

    {

      icon: driverIcon,

      rotationAngle: 0,

      rotationOrigin: "center center"

    }

  );

  marker
    .addTo(map)
    .bindPopup(

      "<b>" + driver.name + "</b><br>" +

      (driver.vehicleType === "moto"

        ? "🏍️ Moto"

        : "🚗 Voiture") +

      "<br>⭐ " +

      (driver.averageRating || 0) +

      "/5"

    );

  marker.on("click", function () {

    selectedDriver = driver;

    drawRoute(

      ${currentLocation.latitude},

      ${currentLocation.longitude},

      driver.latitude,

      driver.longitude

    );

    window.ReactNativeWebView.postMessage(

      JSON.stringify({

        type:"driver_selected",

        driver:driver

      })

    );

  });

  markers[driver.userId] = marker;

}

function removeMarker(id){

  if(!markers[id]) return;

  if(animations[markers[id]._leaflet_id]){

    cancelAnimationFrame(

      animations[markers[id]._leaflet_id]

    );

    delete animations[

      markers[id]._leaflet_id

    ];

  }

  map.removeLayer(markers[id]);

  delete markers[id];

}

`;
}