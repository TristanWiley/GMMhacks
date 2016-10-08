var vinElem = document.getElementById('vin');

gm.info.getCurrentPosition(function (position) {
  vinElem.innerHTML = 'Lat: ' + position.coords.latitude + ' Long: ' + position.coords.longitude;
});

gm.info.watchPosition(function (position) {
  vinElem.innerHTML = 'Lat: ' + position.coords.latitude + ' Long: ' + position.coords.longitude;
}, function () {
  console.log("GPS failed!");
}, null, true);