//This is where the code for doing stuff starts
var path = document.getElementById('debug');

function startRecording(id) {
  gm.speech.startRecording(function (audio) {
    path.innerHTML = "Uploading...";

    gm.communication.sendFile(function () {
      path.innerHTML = "Success!";
    }, function (e, e2) {
      path.innerHTML = e + ": " + e2;
    }, {
        "fileURL": "camera/" + audio.replace(/^.*[\\\/]/, ''),
        "uploadURL": "http://requestb.in/oqws4coq",
    });

    gm.speech.stopRecording(function () { }, function () { }, id);

    path.disabled = null;
  }, function (e, e2) {
    path.innerHTML = "FCB: " + e2;
  }, {
      "intro": "Hello",
      "silenceLength": 10000,
      "silenceDetection": true,
      "maxRecordingWindow": 15000,
      "noiseSuppression": gm.constants.noiseSuppression.STANDARD,
    });
}

document.getElementById("button").onclick = function () {
  path.innerHTML = "Listening...";
  path.disabled = "disabled";

  var sessionId = gm.speech.startSpeechRecSession(function () {
    startRecording(sessionId);
  });
};

document.getElementById("die").onclick = function () {
  gm.appmanager.closeApp();
};