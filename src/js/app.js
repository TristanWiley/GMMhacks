//This is just code for animation stuff.

//This is where the code for doing stuff starts
var path = document.getElementById('debug');

function startRecording(id) {
  gm.speech.startRecording(function (audio) {
    path.innerHTML = audio;

    gm.communication.sendFile(function () {
      path.innerHTML = "Success!";
    }, function (e, e2) {
      path.innerHTML = e + ": " + e2;
    }, {
        "fileURL": "camera/" + audio.replace(/^.*[\\\/]/, ''),
        "uploadURL": "http://requestb.in/oqws4coq",
    });

    gm.speech.stopRecording(function () { }, function () { }, id);
  }, function (e, e2) {
    path.innerHTML = "FCB: " + e2;
  }, {
      "intro": "Hello",
      "silenceLength": 1000,
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