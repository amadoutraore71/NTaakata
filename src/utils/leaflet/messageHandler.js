export function messageHandler() {

return `

window.addEventListener("message", function(event){

  try{

    const drivers = JSON.parse(event.data);

    updateDrivers(drivers);

  }catch(error){

    console.log(error);

  }

});

document.addEventListener("message", function(event){

  try{

    const drivers = JSON.parse(event.data);

    updateDrivers(drivers);

  }catch(error){

    console.log(error);

  }

});

window.onerror = function(message, source, line){

  window.ReactNativeWebView.postMessage(

    JSON.stringify({

      type:"error",

      message,

      line

    })

  );

};

window.ReactNativeWebView.postMessage("Leaflet prêt");

`;

}