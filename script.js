// Creacion del mapa
const mymap = L.map('sample_map').setView([40.741, -3.884], 15);
// Openstreetmap Tile
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
  maxZoom: 18
}).addTo(mymap);

// Icono personaizado localizacion usuario
const userIcon = L.icon({
    iconUrl: 'media/user.png',
    iconSize: [25, 60],
    iconAnchor: [12, 60],
    popupAnchor: [-1, -74],
    //shadowUrl: 'my-icon-shadow.png',
    //shadowSize: [68, 95],
    //shadowAnchor: [22, 94]
});
// ##########################Variables##########################
// Distancia al destino
let distance = 0;

// Coordenadas usuario
let userLatitude = 0;
let userLongitude = 0;

// Coordenadas destino
let latitude = 0;
let longitude = 0;

// Marcadores para el usuario
const userMarker = L.marker([0,0], {icon: userIcon}).addTo(mymap);
// Circulo de precision
const accurayRadius = L.circle([0,0], {fillOpacity:0.1}).addTo(mymap);

// Chincheta de destino
const myMarker = L.marker([0,0]).addTo(mymap)
      .bindPopup("<button id='destino' onclick = destination()>Fijar Destino</button>");

// Circulos de proximidad al destino 200m, 500m y 1000m/1km
const destinationRadius200 = L.circle([0,0], {radius: 200}, {fillOpacity:0.15}).addTo(mymap)
  .setStyle({color: '#ff3300'});
const destinationRadius500 = L.circle([0,0], {radius: 500}, {fillOpacity:0.1}).addTo(mymap)
  .setStyle({color: '#ff9933'});;
const destinationRadius1000 = L.circle([0,0], {radius: 1000}, {fillOpacity:0.05}).addTo(mymap)
  .setStyle({color: '#ffcc00'});;

// Booleanos para controlar la vibracion segun la proximidad
let checkPoint200 = false;
let checkPoint500 = false;
let checkPoint1000 = false;

// Calcular la distancia entre la posicion de usuario y el destino
function calculateDistance(lat1, lon1, lat2, lon2) {
  let R = 6371; // Radio de la tierra en km
  let dLat = degToRads(lat2-lat1);  
  let dLon = degToRads(lon2-lon1); 
  let a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(degToRads(lat1)) * Math.cos(degToRads(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  let d = R * c; // Distancia en km
  return d;
}

function degToRads(deg) {
  return deg * (Math.PI/180)
}

//Funciones de localizacion
// GeoLocatioAPI
function success(position) {
  // Obtener el valor de la precision de la posicion, para crear un radio aproximado
  const radius = position.coords.accuracy;
  // Centrar vista en posicion del usuario
  mymap.setView([position.coords.latitude, position.coords.longitude], 14);

  // Colocar icono del usuario
  userMarker.setLatLng([position.coords.latitude, position.coords.longitude]);
  userMarker.bindPopup("You are within " + radius + " meters from this point").openPopup();
  accurayRadius.setLatLng([position.coords.latitude, position.coords.longitude]);
  accurayRadius.setRadius(radius);
  // Vibra al encontrar la posicion del dispositivo
  //navigator.vibrate(1000);
  userLatitude = position.coords.latitude;
  userLongitude = position.coords.longitude;
  updateDistance();// Actualizar la distancia al destino
  vibrateCheckPoints();// Comprobar si es el momento de vibrar
}
// Si no se puede obtener la ubicacion del dispositivo
function error() {
  alert('No position available.');
}
// Opciones para la localizacion
const options = {
  enableHighAccuracy: true,
  maximumAge: 30000,
  timeout: 27000
};

// Funcion que activa la localizacion
function locate(){
  // Event listener para actualizar la posicion del usuario segun este se mueva
  const watchID = navigator.geolocation.watchPosition(success, error, options);
};

// Actualizar la distancia al destino a medida que se actualiza la posicion del dispositivo
function updateDistance(){
  distance = calculateDistance(latitude, longitude, userLatitude, userLongitude);// Llamar a la funciona para calcular la distancia aproximada(linea recta)
  distance = Math.round((distance + Number.EPSILON) * 1000) / 1000;// Redondeo para reducir logitud del numero
  $("#destinationBox").html("<h1 id='destinationTitle'>Destino</h1><p id='distance'>"+ distance +" Km</p><p id='longlat'>Latitud:"+ latitude +" |Longitud:"+ longitude +"</p>");
  console.log(distance);
};

// Cuando se elige el destino
function destination(){
  myMarker.closePopup();// Cerrar el popup cuando se fija el destino
  if (document.getElementById('destinationBox')){
    $("#destinationBox").html("<h1 id='destinationTitle'>Destino</h1><p id='distance'>"+ distance +" Km</p><p id='longlat'>Latitud:"+ latitude +" |Longitud:"+ longitude +"</p>");
  }else{
    L.Control.textbox = L.Control.extend({
      onAdd: function(mymap) {
      // Caja de texto
      const text = L.DomUtil.create('div');
      text.id = "info_text";
      text.innerHTML = "<div id='destinationBox'><h1 id='destinationTitle'>Destino</h1><p id='distance'>"+ distance +" Km</p><p id='longlat'>Latitud:"+ latitude +" |Longitud:"+ longitude +"</p></div>"
      return text;
      },
    
      onRemove: function(mymap) {
        // Nothing to do here
      }
    });
    L.control.textbox = function(opts) { return new L.Control.textbox(opts);}
    L.control.textbox({ position: 'bottomleft' }).addTo(mymap);
  }
  console.log("distancia", Math.round((distance + Number.EPSILON) * 100) / 100 )
  if(Math.round((distance + Number.EPSILON) * 100) / 100 > 1){// La distancia es mayor de 1km se activan todos los marcadores
    checkPoint200 = true;
    checkPoint500 = true; 
    checkPoint1000 = true;
  }else if(Math.round((distance + Number.EPSILON) * 100) / 100  > 0.5){// Si la distancia es mayor de 500 metros pero menor a un 1km
    checkPoint200 = true;
    checkPoint500 = true;
  }else{// Si la distancia es menor a 500m
    checkPoint200 = true;
  }
  updateDistance();
  //console.log(distance);
};

// Funcion de vibracion segun la distancia al destino
function vibrateCheckPoints(){
  console.log("1000",checkPoint1000);
  console.log("500",checkPoint500);
  console.log("200",checkPoint200);
  console.log("distancia2", Math.round((distance + Number.EPSILON) * 100) / 100 )
  if(checkPoint1000 == true && Math.round((distance + Number.EPSILON) * 100) / 100  < 1){// Vibra si la distancia es menor a 1Km y el checkpoint esta activo
    checkPoint1000 = false;
    navigator.vibrate(1000);
  }else if(checkPoint500 == true && Math.round((distance + Number.EPSILON) * 100) / 100  < 0.5){// Vibra si la distancia es menor a 500m y el checkpoint esta activo
    checkPoint500 = false;
    navigator.vibrate([500,400,300,200]);
  }else if(checkPoint200 == true && Math.round((distance + Number.EPSILON) * 100) / 100  < 0.2){// Vibra si la distancia es menor a 200m y el checkpoint esta activo
    checkPoint200 = false;
    navigator.vibrate([300,300,300,300,300]);
  }
};


mymap.on('click', function(e) {
  console.log(e);
  // Actualizar chincheta
  myMarker.setLatLng(e.latlng).openPopup();
  destinationRadius200.setLatLng(e.latlng);
  destinationRadius500.setLatLng(e.latlng);
  destinationRadius1000.setLatLng(e.latlng);
  latitude = e.latlng.lat;
  longitude = e.latlng.lng;

})


