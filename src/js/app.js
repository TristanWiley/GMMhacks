var vinElem = document.getElementById('vin');

function startSession() {
  var retObj = gmint.speech.createStartSpeechRecSession();
  var session = gmint[retObj.objName].StartSpeechRecSessionInternal();

  return gmint[retObj.objName].getId();
}

function startRecording() {
  var retObj = gmint.speech.createStartRecording();
  gmint[retObj.objName].StartRecordingInternal({
    "intro": "Hello from the world!",
    "maxRecordingWindow": 10000,
  });

  return gmint[retObj.objName].getId();
}

var session = startSession();


/*
gm.speech.startSpeechRecSession(function () {
  vinElem.innerHTML = gmint.appmanager.getAppsList();

  gm.speech.startRecording(function () {
    vinElem.innerHTML = "9";
  }, function (e) {
    vinElem.innerHTML = e + " potato";
  }, {

  });
});

gm.info.getCurrentPosition(function (position) {
  console.log("Current Position " + position);
  vinElem.innerHTML = 'Lat: ' + position.coords.latitude + ' Long: ' + position.coords.longitude;
});

var id = gm.info.watchPosition(processPosition, processFailure, true);

function processPosition(position){
  var lat = position.coords.latitude;
  var lng = position.coords.longitude;
  console.log(lat + " " + lng);
  vinElem.innerHTML = 'Lat: ' + lat + ' Long: ' + lng;
}

function processFailure(){
  console.log("GPS FAILURE");
}
*/
