var vinElem = document.getElementById('vin');

function startRecording(id) {
  gm.speech.startRecording(function (audio) {
    gm.io.readFile(function (f) {
      vinElem.innerHTML = f;
    }, null, audio);

    gm.speech.stopRecording(function () {}, function () {}, id);
  }, function (e, e2) {
    vinElem.innerHTML = "FCB: " + e2;
  }, {
    "intro": "Hello hello hello hello!",
    "silenceLength": 500,
    "silenceDetection": true,
    "maxRecordingWindow": 60000,
    "noiseSuppression": gm.constants.noiseSuppression.LOW,
  });
}

document.getElementById("button").onclick = function () {
  var sessionId = gm.speech.startSpeechRecSession(function () {
    startRecording(sessionId);
  });
};


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
