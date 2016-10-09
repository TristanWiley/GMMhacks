(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var AVS = require('../');
var player = AVS.Player;

var avs = new AVS({
  debug: true,
  clientId: 'amzn1.application-oa2-client.3cc591847d7141698f6260e2db61d885',
  deviceId: 'test_device',
  deviceSerialNumber: 1234,
  redirectUri: 'https://localhost:9745/authresponse'
});
window.avs = avs;

avs.on(AVS.EventTypes.TOKEN_SET, function () {
  loginBtn.disabled = true;
  logoutBtn.disabled = false;
  startRecording.disabled = false;
  stopRecording.disabled = true;
});

avs.on(AVS.EventTypes.RECORD_START, function () {
  startRecording.disabled = true;
  stopRecording.disabled = false;
});

avs.on(AVS.EventTypes.RECORD_STOP, function () {
  startRecording.disabled = false;
  stopRecording.disabled = true;
});

avs.on(AVS.EventTypes.LOGOUT, function () {
  loginBtn.disabled = false;
  logoutBtn.disabled = true;
  startRecording.disabled = true;
  stopRecording.disabled = true;
});

avs.on(AVS.EventTypes.TOKEN_INVALID, function () {
  avs.logout().then(login);
});

avs.on(AVS.EventTypes.LOG, log);
avs.on(AVS.EventTypes.ERROR, logError);

avs.player.on(AVS.Player.EventTypes.LOG, log);
avs.player.on(AVS.Player.EventTypes.ERROR, logError);

avs.player.on(AVS.Player.EventTypes.PLAY, function () {
  playAudio.disabled = true;
  replayAudio.disabled = true;
  pauseAudio.disabled = false;
  stopAudio.disabled = false;
});

avs.player.on(AVS.Player.EventTypes.ENDED, function () {
  playAudio.disabled = true;
  replayAudio.disabled = false;
  pauseAudio.disabled = true;
  stopAudio.disabled = true;
});

avs.player.on(AVS.Player.EventTypes.STOP, function () {
  playAudio.disabled = true;
  replayAudio.disabled = false;
  pauseAudio.disabled = false;
  stopAudio.disabled = false;
});

avs.player.on(AVS.Player.EventTypes.PAUSE, function () {
  playAudio.disabled = false;
  replayAudio.disabled = false;
  pauseAudio.disabled = true;
  stopAudio.disabled = true;
});

avs.player.on(AVS.Player.EventTypes.REPLAY, function () {
  playAudio.disabled = true;
  replayAudio.disabled = true;
  pauseAudio.disabled = false;
  stopAudio.disabled = false;
});

function log(message) {
  logOutput.innerHTML = '<li>LOG: ' + message + '</li>' + logOutput.innerHTML;
}

function logError(error) {
  logOutput.innerHTML = '<li>ERROR: ' + error + '</li>' + logOutput.innerHTML;
}

function logAudioBlob(blob, message) {
  return new Promise(function (resolve, reject) {
    var a = document.createElement('a');
    var aDownload = document.createElement('a');
    var url = window.URL.createObjectURL(blob);
    var ext = blob.type.indexOf('mpeg') > -1 ? 'mp3' : 'wav';
    var filename = Date.now() + '.' + ext;
    a.href = url;
    a.target = '_blank';
    aDownload.href = url;
    a.textContent = filename;
    aDownload.download = filename;
    aDownload.textContent = 'download';

    audioLogOutput.innerHTML = '<li>' + message + ': ' + a.outerHTML + ' ' + aDownload.outerHTML + '</li>' + audioLogOutput.innerHTML;
    resolve(blob);
  });
}

var loginBtn = document.getElementById('login');
var logoutBtn = document.getElementById('logout');
var logOutput = document.getElementById('log');
var audioLogOutput = document.getElementById('audioLog');
var startRecording = document.getElementById('startRecording');
var stopRecording = document.getElementById('startRecording');
var stopAudio = document.getElementById('stopAudio');
var pauseAudio = document.getElementById('pauseAudio');
var playAudio = document.getElementById('playAudio');
var replayAudio = document.getElementById('replayAudio');

var activated = false;

/*
// If using client secret
avs.getCodeFromUrl()
 .then(code => avs.getTokenFromCode(code))
.then(token => localStorage.setItem('token', token))
.then(refreshToken => localStorage.setItem('refreshToken', refreshToken))
.then(() => avs.requestMic())
.then(() => avs.refreshToken())
.catch(() => {

});
*/

avs.getTokenFromUrl().then(function () {
  return avs.getToken();
}).then(function (token) {
  return localStorage.setItem('token', token);
}).then(function () {
  return avs.requestMic();
}).catch(function () {
  var cachedToken = localStorage.getItem('token');

  if (cachedToken) {
    avs.setToken(cachedToken);
    return avs.requestMic();
  }
});

function login(event) {
  return avs.login().then(function () {
    return avs.requestMic();
  }).catch(function () {});

  /*
  // If using client secret
  avs.login({responseType: 'code'})
  .then(() => avs.requestMic())
  .catch(() => {});
  */
}

login();

function logout() {
  return avs.logout().then(function () {
    localStorage.removeItem('token');
    window.location.hash = '';
  });
}

startRecording.addEventListener('click', function () {
  avs.startRecording();
  console.log("Recording...");
  activated = true;
});

stopRecording.addEventListener('click', function () {
  if (activated == false)
    return;

    console.log("Not recording...");

  avs.stopRecording().then(function (dataView) {
    avs.player.emptyQueue().then(function () {
      return avs.audioToBlob(dataView);
    }).then(function (blob) {
      return logAudioBlob(blob, 'VOICE');
    }).then(function () {
      return avs.player.enqueue(dataView);
    }).then(function () {
      return avs.player.play();
    }).catch(function (error) {
      console.error(error);
    });

    var ab = false;
    //sendBlob(blob);
    avs.sendAudio(dataView).then(function (_ref) {
      var xhr = _ref.xhr;
      var response = _ref.response;


      var promises = [];
      var audioMap = {};
      var directives = null;

      if (response.multipart.length) {
        (function () {
          var findAudioFromContentId = function findAudioFromContentId(contentId) {
            contentId = contentId.replace('cid:', '');
            for (var key in audioMap) {
              if (key.indexOf(contentId) > -1) {
                return audioMap[key];
              }
            }
          };

          response.multipart.forEach(function (multipart) {
            var body = multipart.body;
            if (multipart.headers && multipart.headers['Content-Type'] === 'application/json') {
              try {
                body = JSON.parse(body);
              } catch (error) {
                console.error(error);
              }

              if (body && body.messageBody && body.messageBody.directives) {
                directives = body.messageBody.directives;
              }
            } else if (multipart.headers['Content-Type'] === 'audio/mpeg') {
              var start = multipart.meta.body.byteOffset.start;
              var end = multipart.meta.body.byteOffset.end;

              /**
               * Not sure if bug in buffer module or in http message parser
               * because it's joining arraybuffers so I have to this to
               * seperate them out.
               */
              var slicedBody = xhr.response.slice(start, end);

              //promises.push(avs.player.enqueue(slicedBody));
              audioMap[multipart.headers['Content-ID']] = slicedBody;
            }
          });

          directives.forEach(function (directive) {
            if (directive.namespace === 'SpeechSynthesizer') {
              if (directive.name === 'speak') {
                var contentId = directive.payload.audioContent;
                var audio = findAudioFromContentId(contentId);
                if (audio) {
                  avs.audioToBlob(audio).then(function (blob) {
                    return logAudioBlob(blob, 'RESPONSE');
                  });
                  promises.push(avs.player.enqueue(audio));
                }
              }
            } else if (directive.namespace === 'AudioPlayer') {
              if (directive.name === 'play') {
                var streams = directive.payload.audioItem.streams;
                streams.forEach(function (stream) {
                  var streamUrl = stream.streamUrl;

                  var audio = findAudioFromContentId(streamUrl);
                  if (audio) {
                    avs.audioToBlob(audio).then(function (blob) {
                      return logAudioBlob(blob, 'RESPONSE');
                    });
                    promises.push(avs.player.enqueue(audio));
                  } else if (streamUrl.indexOf('http') > -1) {
                    var _xhr = new XMLHttpRequest();
                    var url = '/parse-m3u?url=' + streamUrl.replace(/!.*$/, '');
                    _xhr.open('GET', url, true);
                    _xhr.responseType = 'json';
                    _xhr.onload = function (event) {
                      var urls = event.currentTarget.response;

                      urls.forEach(function (url) {
                        avs.player.enqueue(url);
                      });
                    };
                    _xhr.send();
                  }
                });
              } else if (directive.namespace === 'SpeechRecognizer') {
                if (directive.name === 'listen') {
                  var timeout = directive.payload.timeoutIntervalInMillis;
                  // enable mic
                }
              }
            }
          });

          if (promises.length) {
            Promise.all(promises).then(function () {
              avs.player.playQueue();
            });
          }
        })();
      }
    }).catch(function (error) {
      console.error(error);
    });
  });
});

stopAudio.addEventListener('click', function (event) {
  avs.player.stop();
});

pauseAudio.addEventListener('click', function (event) {
  avs.player.pause();
});

playAudio.addEventListener('click', function (event) {
  avs.player.play();
});

replayAudio.addEventListener('click', function (event) {
  avs.player.replay();
});

function sendBlob(blob) {
  var xhr = new XMLHttpRequest();
  var fd = new FormData();

  fd.append('fname', 'audio.wav');
  fd.append('data', blob);

  xhr.open('POST', 'http://localhost:5555/audio', true);
  xhr.responseType = 'blob';

  xhr.onload = function (event) {
    if (xhr.status == 200) {
      console.log(xhr.response);
      //const responseBlob = new Blob([xhr.response], {type: 'audio/mp3'});
    }
  };

  xhr.send(fd);
}

},{"../":6}],2:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */
function Buffer (arg) {
  if (!(this instanceof Buffer)) {
    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
    if (arguments.length > 1) return new Buffer(arg, arguments[1])
    return new Buffer(arg)
  }

  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    this.length = 0
    this.parent = undefined
  }

  // Common case.
  if (typeof arg === 'number') {
    return fromNumber(this, arg)
  }

  // Slightly less common case.
  if (typeof arg === 'string') {
    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
  }

  // Unusual.
  return fromObject(this, arg)
}

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function fromNumber (that, length) {
  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < length; i++) {
      that[i] = 0
    }
  }
  return that
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

  // Assumption: byteLength() return value is always < kMaxLength.
  var length = byteLength(string, encoding) | 0
  that = allocate(that, length)

  that.write(string, encoding)
  return that
}

function fromObject (that, object) {
  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

  if (isArray(object)) return fromArray(that, object)

  if (object == null) {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (typeof ArrayBuffer !== 'undefined') {
    if (object.buffer instanceof ArrayBuffer) {
      return fromTypedArray(that, object)
    }
    if (object instanceof ArrayBuffer) {
      return fromArrayBuffer(that, object)
    }
  }

  if (object.length) return fromArrayLike(that, object)

  return fromJsonObject(that, object)
}

function fromBuffer (that, buffer) {
  var length = checked(buffer.length) | 0
  that = allocate(that, length)
  buffer.copy(that, 0, 0, length)
  return that
}

function fromArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Duplicate of fromArray() to keep fromArray() monomorphic.
function fromTypedArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  // Truncating the elements is probably not what people expect from typed
  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
  // of the old Buffer constructor.
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(array)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromTypedArray(that, new Uint8Array(array))
  }
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
// Returns a zero-length buffer for inputs that don't conform to the spec.
function fromJsonObject (that, object) {
  var array
  var length = 0

  if (object.type === 'Buffer' && isArray(object.data)) {
    array = object.data
    length = checked(array.length) | 0
  }
  that = allocate(that, length)

  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
} else {
  // pre-set for values that may exist in the future
  Buffer.prototype.length = undefined
  Buffer.prototype.parent = undefined
}

function allocate (that, length) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that.length = length
  }

  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
  if (fromPool) that.parent = rootParent

  return that
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buf = new Buffer(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

function byteLength (string, encoding) {
  if (typeof string !== 'string') string = '' + string

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  start = start | 0
  end = end === undefined || end === Infinity ? this.length : end | 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    var swap = encoding
    encoding = offset
    offset = length | 0
    length = swap
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"base64-js":3,"ieee754":4,"isarray":5}],3:[function(require,module,exports){
'use strict'

exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

function init () {
  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i]
    revLookup[code.charCodeAt(i)] = i
  }

  revLookup['-'.charCodeAt(0)] = 62
  revLookup['_'.charCodeAt(0)] = 63
}

init()

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0

  // base64 is 4/3 + up to two characters of the original data
  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],4:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],5:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],6:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

(function () {
  'use strict';

  var AVS = require('./lib/AVS');

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = AVS;
    }
    exports.AVS = AVS;
  }

  if (typeof define === 'function' && define.amd) {
    define([], function () {
      return AVS;
    });
  }

  if ((typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object') {
    window.AVS = AVS;
  }
})();

},{"./lib/AVS":7}],7:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Buffer = require('buffer').Buffer;
var qs = require('qs');
var httpMessageParser = require('http-message-parser');

var AMAZON_ERROR_CODES = require('./AmazonErrorCodes.js');
var Observable = require('./Observable.js');
var Player = require('./Player.js');
var arrayBufferToString = require('./utils/arrayBufferToString.js');
var writeUTFBytes = require('./utils/writeUTFBytes.js');
var mergeBuffers = require('./utils/mergeBuffers.js');
var interleave = require('./utils/interleave.js');
var downsampleBuffer = require('./utils/downsampleBuffer.js');

var AVS = function () {
  function AVS() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, AVS);

    Observable(this);

    this._bufferSize = 2048;
    this._inputChannels = 1;
    this._outputChannels = 1;
    this._leftChannel = [];
    this._rightChannel = [];
    this._audioContext = null;
    this._recorder = null;
    this._sampleRate = null;
    this._outputSampleRate = 16000;
    this._audioInput = null;
    this._volumeNode = null;
    this._debug = false;
    this._token = null;
    this._refreshToken = null;
    this._clientId = null;
    this._clientSecret = null;
    this._deviceId = null;
    this._deviceSerialNumber = null;
    this._redirectUri = null;
    this._audioQueue = [];

    if (options.token) {
      this.setToken(options.token);
    }

    if (options.refreshToken) {
      this.setRefreshToken(options.refreshToken);
    }

    if (options.clientId) {
      this.setClientId(options.clientId);
    }

    if (options.clientSecret) {
      this.setClientSecret(options.clientSecret);
    }

    if (options.deviceId) {
      this.setDeviceId(options.deviceId);
    }

    if (options.deviceSerialNumber) {
      this.setDeviceSerialNumber(options.deviceSerialNumber);
    }

    if (options.redirectUri) {
      this.setRedirectUri(options.redirectUri);
    }

    if (options.debug) {
      this.setDebug(options.debug);
    }

    this.player = new Player();
  }

  _createClass(AVS, [{
    key: '_log',
    value: function _log(type, message) {
      var _this = this;

      if (type && !message) {
        message = type;
        type = 'log';
      }

      setTimeout(function () {
        _this.emit(AVS.EventTypes.LOG, message);
      }, 0);

      if (this._debug) {
        console[type](message);
      }
    }
  }, {
    key: 'login',
    value: function login() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      return this.promptUserLogin(options);
    }
  }, {
    key: 'logout',
    value: function logout() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        _this2._token = null;
        _this2._refreshToken = null;
        _this2.emit(AVS.EventTypes.LOGOUT);
        _this2._log('Logged out');
        resolve();
      });
    }
  }, {
    key: 'promptUserLogin',
    value: function promptUserLogin() {
      var _this3 = this;

      var options = arguments.length <= 0 || arguments[0] === undefined ? { responseType: 'token', newWindow: false } : arguments[0];

      return new Promise(function (resolve, reject) {
        if (typeof options.responseType === 'undefined') {
          options.responseType = 'token';
        }

        if (typeof options.responseType !== 'string') {
          var error = new Error('`responseType` must a string.');
          _this3._log(error);
          return reject(error);
        }

        var newWindow = !!options.newWindow;

        var responseType = options.responseType;

        if (!(responseType === 'code' || responseType === 'token')) {
          var _error = new Error('`responseType` must be either `code` or `token`.');
          _this3._log(_error);
          return reject(_error);
        }

        var scope = 'alexa:all';
        var scopeData = _defineProperty({}, scope, {
          productID: _this3._deviceId,
          productInstanceAttributes: {
            deviceSerialNumber: _this3._deviceSerialNumber
          }
        });

        var authUrl = 'https://www.amazon.com/ap/oa?client_id=' + _this3._clientId + '&scope=' + encodeURIComponent(scope) + '&scope_data=' + encodeURIComponent(JSON.stringify(scopeData)) + '&response_type=' + responseType + '&redirect_uri=' + encodeURI(window.location.href + "authresponse");

        if (newWindow) {
          window.open(authUrl);
        } else {
          window.location.href = authUrl;
        }
      });
    }
  }, {
    key: 'getTokenFromCode',
    value: function getTokenFromCode(code) {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        if (typeof code !== 'string') {
          var error = new TypeError('`code` must be a string.');
          _this4._log(error);
          return reject(error);
        }

        var grantType = 'authorization_code';
        var postData = 'grant_type=' + grantType + '&code=' + code + '&client_id=' + _this4._clientId + '&client_secret=' + _this4._clientSecret + '&redirect_uri=' + encodeURIComponent(_this4._redirectUri);
        var url = 'https://api.amazon.com/auth/o2/token';

        var xhr = new XMLHttpRequest();

        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
        xhr.onload = function (event) {
          var response = xhr.response;

          try {
            response = JSON.parse(xhr.response);
          } catch (error) {
            _this4._log(error);
            return reject(error);
          }

          var isObject = response instanceof Object;
          var errorDescription = isObject && response.error_description;

          if (errorDescription) {
            var _error2 = new Error(errorDescription);
            _this4._log(_error2);
            return reject(_error2);
          }

          var token = response.access_token;
          var refreshToken = response.refresh_token;
          var tokenType = response.token_type;
          var expiresIn = response.expiresIn;

          _this4.setToken(token);
          _this4.setRefreshToken(refreshToken);

          _this4.emit(AVS.EventTypes.LOGIN);
          _this4._log('Logged in.');
          resolve(response);
        };

        xhr.onerror = function (error) {
          _this4._log(error);
          reject(error);
        };

        xhr.send(postData);
      });
    }
  }, {
    key: 'refreshToken',
    value: function refreshToken() {
      var _this5 = this;

      return this.getTokenFromRefreshToken(this._refreshToken).then(function () {
        return {
          token: _this5._token,
          refreshToken: _this5._refreshToken
        };
      });
    }
  }, {
    key: 'getTokenFromRefreshToken',
    value: function getTokenFromRefreshToken() {
      var _this6 = this;

      var refreshToken = arguments.length <= 0 || arguments[0] === undefined ? this._refreshToken : arguments[0];

      return new Promise(function (resolve, reject) {
        if (typeof refreshToken !== 'string') {
          var error = new Error('`refreshToken` must a string.');
          _this6._log(error);
          return reject(error);
        }

        var grantType = 'refresh_token';
        var postData = 'grant_type=' + grantType + '&refresh_token=' + refreshToken + '&client_id=' + _this6._clientId + '&client_secret=' + _this6._clientSecret + '&redirect_uri=' + encodeURIComponent(_this6._redirectUri);
        var url = 'https://api.amazon.com/auth/o2/token';
        var xhr = new XMLHttpRequest();

        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
        xhr.responseType = 'json';
        xhr.onload = function (event) {
          var response = xhr.response;

          if (response.error) {
            var _error3 = response.error.message;
            _this6.emit(AVS.EventTypes.ERROR, _error3);

            return reject(_error3);
          } else {
            var token = response.access_token;
            var _refreshToken = response.refresh_token;

            _this6.setToken(token);
            _this6.setRefreshToken(_refreshToken);

            return resolve(token);
          }
        };

        xhr.onerror = function (error) {
          _this6._log(error);
          reject(error);
        };

        xhr.send(postData);
      });
    }
  }, {
    key: 'getTokenFromUrl',
    value: function getTokenFromUrl() {
      var _this7 = this;

      return new Promise(function (resolve, reject) {
        var hash = window.location.hash.substr(1);

        var query = qs.parse(hash);
        var token = query.access_token;
        var refreshToken = query.refresh_token;
        var tokenType = query.token_type;
        var expiresIn = query.expiresIn;

        if (token) {
          _this7.setToken(token);
          _this7.emit(AVS.EventTypes.LOGIN);
          _this7._log('Logged in.');

          if (refreshToken) {
            _this7.setRefreshToken(refreshToken);
          }

          return resolve(token);
        }

        return reject();
      });
    }
  }, {
    key: 'getCodeFromUrl',
    value: function getCodeFromUrl() {
      return new Promise(function (resolve, reject) {
        var query = qs.parse(window.location.search.substr(1));
        var code = query.code;

        if (code) {
          return resolve(code);
        }

        return reject(null);
      });
    }
  }, {
    key: 'setToken',
    value: function setToken(token) {
      var _this8 = this;

      return new Promise(function (resolve, reject) {
        if (typeof token === 'string') {
          _this8._token = token;
          _this8.emit(AVS.EventTypes.TOKEN_SET);
          _this8._log('Token set.');
          resolve(_this8._token);
        } else {
          var error = new TypeError('`token` must be a string.');
          _this8._log(error);
          reject(error);
        }
      });
    }
  }, {
    key: 'setRefreshToken',
    value: function setRefreshToken(refreshToken) {
      var _this9 = this;

      return new Promise(function (resolve, reject) {
        if (typeof refreshToken === 'string') {
          _this9._refreshToken = refreshToken;
          _this9.emit(AVS.EventTypes.REFRESH_TOKEN_SET);
          _this9._log('Refresh token set.');
          resolve(_this9._refreshToken);
        } else {
          var error = new TypeError('`refreshToken` must be a string.');
          _this9._log(error);
          reject(error);
        }
      });
    }
  }, {
    key: 'setClientId',
    value: function setClientId(clientId) {
      var _this10 = this;

      return new Promise(function (resolve, reject) {
        if (typeof clientId === 'string') {
          _this10._clientId = clientId;
          resolve(_this10._clientId);
        } else {
          var error = new TypeError('`clientId` must be a string.');
          _this10._log(error);
          reject(error);
        }
      });
    }
  }, {
    key: 'setClientSecret',
    value: function setClientSecret(clientSecret) {
      var _this11 = this;

      return new Promise(function (resolve, reject) {
        if (typeof clientSecret === 'string') {
          _this11._clientSecret = clientSecret;
          resolve(_this11._clientSecret);
        } else {
          var error = new TypeError('`clientSecret` must be a string');
          _this11._log(error);
          reject(error);
        }
      });
    }
  }, {
    key: 'setDeviceId',
    value: function setDeviceId(deviceId) {
      var _this12 = this;

      return new Promise(function (resolve, reject) {
        if (typeof deviceId === 'string') {
          _this12._deviceId = deviceId;
          resolve(_this12._deviceId);
        } else {
          var error = new TypeError('`deviceId` must be a string.');
          _this12._log(error);
          reject(error);
        }
      });
    }
  }, {
    key: 'setDeviceSerialNumber',
    value: function setDeviceSerialNumber(deviceSerialNumber) {
      var _this13 = this;

      return new Promise(function (resolve, reject) {
        if (typeof deviceSerialNumber === 'number' || typeof deviceSerialNumber === 'string') {
          _this13._deviceSerialNumber = deviceSerialNumber;
          resolve(_this13._deviceSerialNumber);
        } else {
          var error = new TypeError('`deviceSerialNumber` must be a number or string.');
          _this13._log(error);
          reject(error);
        }
      });
    }
  }, {
    key: 'setRedirectUri',
    value: function setRedirectUri(redirectUri) {
      var _this14 = this;

      return new Promise(function (resolve, reject) {
        if (typeof redirectUri === 'string') {
          _this14._redirectUri = redirectUri;
          resolve(_this14._redirectUri);
        } else {
          var error = new TypeError('`redirectUri` must be a string.');
          _this14._log(error);
          reject(error);
        }
      });
    }
  }, {
    key: 'setDebug',
    value: function setDebug(debug) {
      var _this15 = this;

      return new Promise(function (resolve, reject) {
        if (typeof debug === 'boolean') {
          _this15._debug = debug;
          resolve(_this15._debug);
        } else {
          var error = new TypeError('`debug` must be a boolean.');
          _this15._log(error);
          reject(error);
        }
      });
    }
  }, {
    key: 'getToken',
    value: function getToken() {
      var _this16 = this;

      return new Promise(function (resolve, reject) {
        var token = _this16._token;

        if (token) {
          return resolve(token);
        }

        return reject();
      });
    }
  }, {
    key: 'getRefreshToken',
    value: function getRefreshToken() {
      var _this17 = this;

      return new Promise(function (resolve, reject) {
        var refreshToken = _this17._refreshToken;

        if (refreshToken) {
          return resolve(refreshToken);
        }

        return reject();
      });
    }
  }, {
    key: 'requestMic',
    value: function requestMic() {
      var _this18 = this;

      return new Promise(function (resolve, reject) {
        _this18._log('Requesting microphone.');

        // Ensure that the file can be loaded in environments where navigator is not defined (node servers)
        if (!navigator.getUserMedia) {
          navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
        }

        navigator.getUserMedia({
          audio: true
        }, function (stream) {
          _this18._log('Microphone connected.');
          return _this18.connectMediaStream(stream).then(resolve);
        }, function (error) {
          _this18._log('error', error);
          _this18.emit(AVS.EventTypes.ERROR, error);
          return reject(error);
        });
      });
    }
  }, {
    key: 'connectMediaStream',
    value: function connectMediaStream(stream) {
      var _this19 = this;

      return new Promise(function (resolve, reject) {
        var isMediaStream = Object.prototype.toString.call(stream) === '[object MediaStream]';

        if (!isMediaStream) {
          var error = new TypeError('Argument must be a `MediaStream` object.');
          _this19._log('error', error);
          _this19.emit(AVS.EventTypes.ERROR, error);
          return reject(error);
        }

        _this19._audioContext = new AudioContext();
        _this19._sampleRate = _this19._audioContext.sampleRate;

        _this19._log('Sample rate: ' + _this19._sampleRate + '.');

        _this19._volumeNode = _this19._audioContext.createGain();
        _this19._audioInput = _this19._audioContext.createMediaStreamSource(stream);

        _this19._audioInput.connect(_this19._volumeNode);

        _this19._recorder = _this19._audioContext.createScriptProcessor(_this19._bufferSize, _this19._inputChannels, _this19._outputChannels);

        _this19._recorder.onaudioprocess = function (event) {
          if (!_this19._isRecording) {
            return false;
          }

          var left = event.inputBuffer.getChannelData(0);
          _this19._leftChannel.push(new Float32Array(left));

          if (_this19._inputChannels > 1) {
            var right = event.inputBuffer.getChannelData(1);
            _this19._rightChannel.push(new Float32Array(right));
          }

          _this19._recordingLength += _this19._bufferSize;
        };

        _this19._volumeNode.connect(_this19._recorder);
        _this19._recorder.connect(_this19._audioContext.destination);
        _this19._log('Media stream connected.');

        return resolve(stream);
      });
    }
  }, {
    key: 'startRecording',
    value: function startRecording() {
      var _this20 = this;

      return new Promise(function (resolve, reject) {
        if (!_this20._audioInput) {
          var error = new Error('No Media Stream connected.');
          _this20._log('error', error);
          _this20.emit(AVS.EventTypes.ERROR, error);
          return reject(error);
        }

        _this20._isRecording = true;
        _this20._leftChannel.length = _this20._rightChannel.length = 0;
        _this20._recordingLength = 0;
        _this20._log('Recording started.');
        _this20.emit(AVS.EventTypes.RECORD_START);

        return resolve();
      });
    }
  }, {
    key: 'stopRecording',
    value: function stopRecording() {
      var _this21 = this;

      return new Promise(function (resolve, reject) {
        if (!_this21._isRecording) {
          _this21.emit(AVS.EventTypes.RECORD_STOP);
          _this21._log('Recording stopped.');
          return resolve();
        }

        _this21._isRecording = false;

        var leftBuffer = mergeBuffers(_this21._leftChannel, _this21._recordingLength);
        var interleaved = null;

        if (_this21._outputChannels > 1) {
          var rightBuffer = mergeBuffers(_this21._rightChannel, _this21._recordingLength);
          interleaved = interleave(leftBuffer, rightBuffer);
        } else {
          interleaved = interleave(leftBuffer);
        }

        interleaved = downsampleBuffer(interleaved, _this21._sampleRate, _this21._outputSampleRate);

        var buffer = new ArrayBuffer(44 + interleaved.length * 2);
        var view = new DataView(buffer);

        /**
         * @credit https://github.com/mattdiamond/Recorderjs
         */
        writeUTFBytes(view, 0, 'RIFF');
        view.setUint32(4, 44 + interleaved.length * 2, true);
        writeUTFBytes(view, 8, 'WAVE');
        writeUTFBytes(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, _this21._outputChannels, true);
        view.setUint32(24, _this21._outputSampleRate, true);
        view.setUint32(28, _this21._outputSampleRate * 4, true);
        view.setUint16(32, 4, true);
        view.setUint16(34, 16, true);
        writeUTFBytes(view, 36, 'data');
        view.setUint32(40, interleaved.length * 2, true);

        var length = interleaved.length;
        var volume = 1;
        var index = 44;

        for (var i = 0; i < length; i++) {
          view.setInt16(index, interleaved[i] * (0x7FFF * volume), true);
          index += 2;
        }

        _this21._log('Recording stopped.');
        _this21.emit(AVS.EventTypes.RECORD_STOP);
        return resolve(view);
      });
    }
  }, {
    key: 'sendAudio',
    value: function sendAudio(dataView) {
      var _this22 = this;

      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        var url = 'https://access-alexa-na.amazon.com/v1/avs/speechrecognizer/recognize';

        xhr.open('POST', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function (event) {
          var buffer = new Buffer(xhr.response);

          if (xhr.status === 200) {
            var parsedMessage = httpMessageParser(buffer);
            resolve({ xhr: xhr, response: parsedMessage });
          } else {
            var error = new Error('An error occured with request.');
            var response = {};

            if (!xhr.response.byteLength) {
              error = new Error('Empty response.');
            } else {
              try {
                response = JSON.parse(arrayBufferToString(buffer));
              } catch (err) {
                error = err;
              }
            }

            if (response.error instanceof Object) {
              if (response.error.code === AMAZON_ERROR_CODES.InvalidAccessTokenException) {
                _this22.emit(AVS.EventTypes.TOKEN_INVALID);
              }

              error = response.error.message;
            }

            _this22.emit(AVS.EventTypes.ERROR, error);
            return reject(error);
          }
        };

        xhr.onerror = function (error) {
          _this22._log(error);
          reject(error);
        };

        var BOUNDARY = 'BOUNDARY1234';
        var BOUNDARY_DASHES = '--';
        var NEWLINE = '\r\n';
        var METADATA_CONTENT_DISPOSITION = 'Content-Disposition: form-data; name="metadata"';
        var METADATA_CONTENT_TYPE = 'Content-Type: application/json; charset=UTF-8';
        var AUDIO_CONTENT_TYPE = 'Content-Type: audio/L16; rate=16000; channels=1';
        var AUDIO_CONTENT_DISPOSITION = 'Content-Disposition: form-data; name="audio"';

        var metadata = {
          messageHeader: {},
          messageBody: {
            profile: 'alexa-close-talk',
            locale: 'en-us',
            format: 'audio/L16; rate=16000; channels=1'
          }
        };

        var postDataStart = [NEWLINE, BOUNDARY_DASHES, BOUNDARY, NEWLINE, METADATA_CONTENT_DISPOSITION, NEWLINE, METADATA_CONTENT_TYPE, NEWLINE, NEWLINE, JSON.stringify(metadata), NEWLINE, BOUNDARY_DASHES, BOUNDARY, NEWLINE, AUDIO_CONTENT_DISPOSITION, NEWLINE, AUDIO_CONTENT_TYPE, NEWLINE, NEWLINE].join('');

        var postDataEnd = [NEWLINE, BOUNDARY_DASHES, BOUNDARY, BOUNDARY_DASHES, NEWLINE].join('');

        var size = postDataStart.length + dataView.byteLength + postDataEnd.length;
        var uint8Array = new Uint8Array(size);
        var i = 0;

        for (; i < postDataStart.length; i++) {
          uint8Array[i] = postDataStart.charCodeAt(i) & 0xFF;
        }

        for (var j = 0; j < dataView.byteLength; i++, j++) {
          uint8Array[i] = dataView.getUint8(j);
        }

        for (var _j = 0; _j < postDataEnd.length; i++, _j++) {
          uint8Array[i] = postDataEnd.charCodeAt(_j) & 0xFF;
        }

        var payload = uint8Array.buffer;

        xhr.setRequestHeader('Authorization', 'Bearer ' + _this22._token);
        xhr.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + BOUNDARY);
        xhr.send(payload);
      });
    }
  }, {
    key: 'audioToBlob',
    value: function audioToBlob(audio) {
      return new Promise(function (resolve, reject) {
        var blob = new Blob([audio], { type: 'audio/mpeg' });

        resolve(blob);
      });
    }
  }], [{
    key: 'EventTypes',
    get: function get() {
      return {
        LOG: 'log',
        ERROR: 'error',
        LOGIN: 'login',
        LOGOUT: 'logout',
        RECORD_START: 'recordStart',
        RECORD_STOP: 'recordStop',
        TOKEN_SET: 'tokenSet',
        REFRESH_TOKEN_SET: 'refreshTokenSet',
        TOKEN_INVALID: 'tokenInvalid'
      };
    }
  }, {
    key: 'Player',
    get: function get() {
      return Player;
    }
  }]);

  return AVS;
}();

module.exports = AVS;

},{"./AmazonErrorCodes.js":8,"./Observable.js":9,"./Player.js":10,"./utils/arrayBufferToString.js":12,"./utils/downsampleBuffer.js":13,"./utils/interleave.js":14,"./utils/mergeBuffers.js":15,"./utils/writeUTFBytes.js":16,"buffer":2,"http-message-parser":17,"qs":18}],8:[function(require,module,exports){
'use strict';

module.exports = {
  InvalidAccessTokenException: 'com.amazon.alexahttpproxy.exceptions.InvalidAccessTokenException'
};

},{}],9:[function(require,module,exports){
'use strict';

function Observable(el) {
  var callbacks = {};

  el.on = function (name, fn) {
    if (typeof fn !== 'function') {
      throw new TypeError('Second argument for "on" method must be a function.');
    }

    (callbacks[name] = callbacks[name] || []).push(fn);

    return el;
  };

  el.one = function (name, fn) {
    fn.one = true;
    return el.on.call(el, name, fn);
  };

  el.off = function (name, fn) {
    if (name === '*') {
      callbacks = {};
      return callbacks;
    }

    if (!callbacks[name]) {
      return false;
    }

    if (fn) {
      if (typeof fn !== 'function') {
        throw new TypeError('Second argument for "off" method must be a function.');
      }

      callbacks[name] = callbacks[name].map(function (fm, i) {
        if (fm === fn) {
          callbacks[name].splice(i, 1);
        }
      });
    } else {
      delete callbacks[name];
    }
  };

  el.emit = function (name /*, args */) {
    if (!callbacks[name] || !callbacks[name].length) {
      return;
    }

    var args = [].slice.call(arguments, 1);

    callbacks[name].forEach(function (fn, i) {
      if (fn) {
        fn.apply(fn, args);
        if (fn.one) {
          callbacks[name].splice(i, 1);
        }
      }
    });

    return el;
  };

  return el;
}

module.exports = Observable;

},{}],10:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Observable = require('./Observable');
var arrayBufferToAudioBuffer = require('./utils/arrayBufferToAudioBuffer');
var toString = Object.prototype.toString;

var Player = function () {
  function Player() {
    _classCallCheck(this, Player);

    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    this._queue = [];
    this._currentSource = null;
    this._currentBuffer = null;
    this._context = new AudioContext();

    Observable(this);
  }

  _createClass(Player, [{
    key: '_log',
    value: function _log(type, message) {
      var _this = this;

      if (type && !message) {
        message = type;
        type = 'log';
      }

      setTimeout(function () {
        _this.emit(Player.EventTypes.LOG, message);
      }, 0);

      if (this._debug) {
        console[type](message);
      }
    }
  }, {
    key: 'emptyQueue',
    value: function emptyQueue() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        _this2._queue = [];
        _this2._audio = null;
        _this2._currentBuffer = null;
        _this2._currentSource = null;
        resolve();
      });
    }
  }, {
    key: 'enqueue',
    value: function enqueue(item) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        if (!item) {
          var error = new Error('argument cannot be empty.');
          _this3._log(error);
          return reject(error);
        }

        var stringType = toString.call(item).replace(/\[.*\s(\w+)\]/, '$1');

        var proceed = function proceed(audioBuffer) {
          _this3._queue.push(audioBuffer);
          _this3._log('Enqueue audio');
          _this3.emit(Player.EventTypes.ENQUEUE);
          return resolve(audioBuffer);
        };

        if (stringType === 'DataView' || stringType === 'Uint8Array') {
          return arrayBufferToAudioBuffer(item.buffer, _this3._context).then(proceed);
        } else if (stringType === 'AudioBuffer') {
          return proceed(item);
        } else if (stringType === 'ArrayBuffer') {
          return arrayBufferToAudioBuffer(item, _this3._context).then(proceed);
        } else if (stringType === 'String') {
          return proceed(item);
        } else {
          var _error = new Error('Invalid type.');
          _this3.emit('error', _error);
          return reject(_error);
        }
      });
    }
  }, {
    key: 'deque',
    value: function deque() {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        var item = _this4._queue.shift();

        if (item) {
          _this4._log('Deque audio');
          _this4.emit(Player.EventTypes.DEQUE);
          return resolve(item);
        }

        return reject();
      });
    }
  }, {
    key: 'play',
    value: function play() {
      var _this5 = this;

      return new Promise(function (resolve, reject) {
        if (_this5._context.state === 'suspended') {
          _this5._context.resume();

          _this5._log('Play audio');
          _this5.emit(Player.EventTypes.PLAY);
          resolve();
        } else if (_this5._audio && _this5._audio.paused) {
          _this5._log('Play audio');
          _this5.emit(Player.EventTypes.PLAY);
          _this5._audio.play();
          resolve();
        } else {
          return _this5.deque().then(function (audioBuffer) {
            _this5._log('Play audio');
            _this5.emit(Player.EventTypes.PLAY);
            if (typeof audioBuffer === 'string') {
              return _this5.playUrl(audioBuffer);
            }
            return _this5.playAudioBuffer(audioBuffer);
          }).then(resolve);
        }
      });
    }
  }, {
    key: 'playQueue',
    value: function playQueue() {
      var _this6 = this;

      return this.play().then(function () {
        if (_this6._queue.length) {
          return _this6.playQueue();
        }
      });
    }
  }, {
    key: 'stop',
    value: function stop() {
      var _this7 = this;

      return new Promise(function (resolve, reject) {
        if (_this7._currentSource) {
          _this7._currentSource.onended = function () {};
          _this7._currentSource.stop();
        }

        if (_this7._audio) {
          _this7._audio.onended = function () {};
          _this7._audio.currentTime = 0;
          _this7._audio.pause();
        }

        _this7._log('Stop audio');
        _this7.emit(Player.EventTypes.STOP);
      });
    }
  }, {
    key: 'pause',
    value: function pause() {
      var _this8 = this;

      return new Promise(function (resolve, reject) {
        if (_this8._currentSource && _this8._context.state === 'running') {
          _this8._context.suspend();
        }

        if (_this8._audio) {
          _this8._audio.pause();
        }

        _this8._log('Pause audio');
        _this8.emit(Player.EventTypes.PAUSE);
      });
    }
  }, {
    key: 'replay',
    value: function replay() {
      var _this9 = this;

      return new Promise(function (resolve, reject) {
        if (_this9._currentBuffer) {
          _this9._log('Replay audio');
          _this9.emit(Player.EventTypes.REPLAY);

          if (_this9._context.state === 'suspended') {
            _this9._context.resume();
          }

          if (_this9._currentSource) {
            _this9._currentSource.stop();
            _this9._currentSource.onended = function () {};
          }
          return _this9.playAudioBuffer(_this9._currentBuffer);
        } else if (_this9._audio) {
          _this9._log('Replay audio');
          _this9.emit(Player.EventTypes.REPLAY);
          return _this9.playUrl(_this9._audio.src);
        } else {
          var error = new Error('No audio source loaded.');
          _this9.emit('error', error);
          reject();
        }
      });
    }
  }, {
    key: 'playBlob',
    value: function playBlob(blob) {
      var _this10 = this;

      return new Promise(function (resolve, reject) {
        if (!blob) {
          reject();
        }

        var objectUrl = URL.createObjectURL(blob);
        var audio = new Audio();
        audio.src = objectUrl;
        _this10._currentBuffer = null;
        _this10._currentSource = null;
        _this10._audio = audio;

        audio.onended = function () {
          _this10._log('Audio ended');
          _this10.emit(Player.EventTypes.ENDED);
          resolve();
        };

        audio.onerror = function (error) {
          _this10.emit('error', error);
          reject(error);
        };

        audio.onload = function (event) {
          URL.revokeObjectUrl(objectUrl);
        };

        audio.play();
      });
    }
  }, {
    key: 'playAudioBuffer',
    value: function playAudioBuffer(buffer) {
      var _this11 = this;

      return new Promise(function (resolve, reject) {
        if (!buffer) {
          reject();
        }

        var source = _this11._context.createBufferSource();
        source.buffer = buffer;
        source.connect(_this11._context.destination);
        source.start(0);
        _this11._currentBuffer = buffer;
        _this11._currentSource = source;
        _this11._audio = null;

        source.onended = function (event) {
          _this11._log('Audio ended');
          _this11.emit(Player.EventTypes.ENDED);
          resolve();
        };

        source.onerror = function (error) {
          _this11.emit('error', error);
          reject(error);
        };
      });
    }
  }, {
    key: 'playUrl',
    value: function playUrl(url) {
      var _this12 = this;

      return new Promise(function (resolve, reject) {
        var audio = new Audio();
        audio.src = url;
        _this12._currentBuffer = null;
        _this12._currentSource = null;
        _this12._audio = audio;

        audio.onended = function (event) {
          _this12._log('Audio ended');
          _this12.emit(Player.EventTypes.ENDED);
          resolve();
        };

        audio.onerror = function (error) {
          _this12.emit('error', error);
          reject(error);
        };

        audio.play();
      });
    }
  }], [{
    key: 'EventTypes',
    get: function get() {
      return {
        LOG: 'log',
        ERROR: 'error',
        PLAY: 'play',
        REPLAY: 'replay',
        PAUSE: 'pause',
        STOP: 'pause',
        ENQUEUE: 'enqueue',
        DEQUE: 'deque'
      };
    }
  }]);

  return Player;
}();

module.exports = Player;

},{"./Observable":9,"./utils/arrayBufferToAudioBuffer":11}],11:[function(require,module,exports){
'use strict';

function arrayBufferToAudioBuffer(arrayBuffer, context) {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;

  return new Promise(function (resolve, reject) {
    if (context) {
      if (Object.prototype.toString.call(context) !== '[object AudioContext]') {
        throw new TypeError('`context` must be an AudioContext');
      }
    } else {
      context = new AudioContext();
    }

    context.decodeAudioData(arrayBuffer, function (data) {
      resolve(data);
    }, reject);
  });
}

module.exports = arrayBufferToAudioBuffer;

},{}],12:[function(require,module,exports){
'use strict';

/**
 * @credit https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String?hl=en
 */

function arrayBufferToString(buffer) {
  return String.fromCharCode.apply(null, new Uint16Array(buffer));
}

module.exports = arrayBufferToString;

},{}],13:[function(require,module,exports){
'use strict';

/**
 * @credit http://stackoverflow.com/a/26245260
 */

function downsampleBuffer(buffer, inputSampleRate, outputSampleRate) {
  if (inputSampleRate === outputSampleRate) {
    return buffer;
  }

  if (inputSampleRate < outputSampleRate) {
    throw new Error('Output sample rate must be less than input sample rate.');
  }

  var sampleRateRatio = inputSampleRate / outputSampleRate;
  var newLength = Math.round(buffer.length / sampleRateRatio);
  var result = new Float32Array(newLength);
  var offsetResult = 0;
  var offsetBuffer = 0;

  while (offsetResult < result.length) {
    var nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    var accum = 0;
    var count = 0;

    for (var i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }

    result[offsetResult] = accum / count;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }

  return result;
}

module.exports = downsampleBuffer;

},{}],14:[function(require,module,exports){
'use strict';

/**
 * @credit https://github.com/mattdiamond/Recorderjs
 */

function interleave(leftChannel, rightChannel) {
  if (leftChannel && !rightChannel) {
    return leftChannel;
  }

  var length = leftChannel.length + rightChannel.length;
  var result = new Float32Array(length);
  var inputIndex = 0;

  for (var index = 0; index < length;) {
    result[index++] = leftChannel[inputIndex];
    result[index++] = rightChannel[inputIndex];
    inputIndex++;
  }

  return result;
}

module.exports = interleave;

},{}],15:[function(require,module,exports){
'use strict';

/**
 * @credit https://github.com/mattdiamond/Recorderjs
 */

function mergeBuffers(channelBuffer, recordingLength) {
  var result = new Float32Array(recordingLength);
  var length = channelBuffer.length;
  var offset = 0;

  for (var i = 0; i < length; i++) {
    var buffer = channelBuffer[i];

    result.set(buffer, offset);
    offset += buffer.length;
  }

  return result;
}

module.exports = mergeBuffers;

},{}],16:[function(require,module,exports){
'use strict';

/**
 * @credit https://github.com/mattdiamond/Recorderjs
 */

function writeUTFBytes(view, offset, string) {
  var length = string.length;

  for (var i = 0; i < length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

module.exports = writeUTFBytes;

},{}],17:[function(require,module,exports){
(function (global,Buffer){
(function(root) {
  'use strict';

  function httpMessageParser(message) {
    const result = {
      httpVersion: null,
      statusCode: null,
      statusMessage: null,
      method: null,
      url: null,
      headers: null,
      body: null,
      boundary: null,
      multipart: null
    };

    var messageString = '';
    var headerNewlineIndex = 0;
    var fullBoundary = null;

    if (httpMessageParser._isBuffer(message)) {
      messageString = message.toString();
    } else if (typeof message === 'string') {
      messageString = message;
      message = httpMessageParser._createBuffer(messageString);
    } else {
      return result;
    }

    /*
     * Strip extra return characters
     */
    messageString = messageString.replace(/\r\n/gim, '\n');

    /*
     * Trim leading whitespace
     */
    (function() {
      const firstNonWhitespaceRegex = /[\w-]+/gim;
      const firstNonWhitespaceIndex = messageString.search(firstNonWhitespaceRegex);
      if (firstNonWhitespaceIndex > 0) {
        message = message.slice(firstNonWhitespaceIndex, message.length);
        messageString = message.toString();
      }
    })();

    /* Parse request line
     */
    (function() {
      const possibleRequestLine = messageString.split(/\n|\r\n/)[0];
      const requestLineMatch = possibleRequestLine.match(httpMessageParser._requestLineRegex);

      if (Array.isArray(requestLineMatch) && requestLineMatch.length > 1) {
        result.httpVersion = parseFloat(requestLineMatch[1]);
        result.statusCode = parseInt(requestLineMatch[2]);
        result.statusMessage = requestLineMatch[3];
      } else {
        const responseLineMath = possibleRequestLine.match(httpMessageParser._responseLineRegex);
        if (Array.isArray(responseLineMath) && responseLineMath.length > 1) {
          result.method = responseLineMath[1];
          result.url = responseLineMath[2];
          result.httpVersion = parseFloat(responseLineMath[3]);
        }
      }
    })();

    /* Parse headers
     */
    (function() {
      headerNewlineIndex = messageString.search(httpMessageParser._headerNewlineRegex);
      if (headerNewlineIndex > -1) {
        headerNewlineIndex = headerNewlineIndex + 1; // 1 for newline length
      } else {
        /* There's no line breaks so check if request line exists
         * because the message might be all headers and no body
         */
        if (result.httpVersion) {
          headerNewlineIndex = messageString.length;
        }
      }

      const headersString = messageString.substr(0, headerNewlineIndex);
      const headers = httpMessageParser._parseHeaders(headersString);

      if (Object.keys(headers).length > 0) {
        result.headers = headers;

        // TOOD: extract boundary.
      }
    })();

    /* Try to get boundary if no boundary header
     */
    (function() {
      if (!result.boundary) {
        const boundaryMatch = messageString.match(httpMessageParser._boundaryRegex);

        if (Array.isArray(boundaryMatch) && boundaryMatch.length) {
          fullBoundary = boundaryMatch[0].replace(/[\r\n]+/gi, '');
          const boundary = fullBoundary.replace(/^--/,'');
          result.boundary = boundary;
        }
      }
    })();

    /* Parse body
     */
    (function() {
      var start = headerNewlineIndex;
      var end = message.length;
      const firstBoundaryIndex = messageString.indexOf(fullBoundary);

      if (firstBoundaryIndex > -1) {
        start = headerNewlineIndex;
        end = firstBoundaryIndex;
      }

      if (headerNewlineIndex > -1) {
        const body = message.slice(start, end);

        if (body && body.length) {
          result.body = httpMessageParser._isFakeBuffer(body) ? body.toString() : body;
        }
      }
    })();

    /* Parse multipart sections
     */
    (function() {
      if (result.boundary) {
        const multipartStart = messageString.indexOf(fullBoundary) + fullBoundary.length;
        const multipartEnd = messageString.lastIndexOf(fullBoundary);
        const multipartBody = messageString.substr(multipartStart, multipartEnd);
        const parts = multipartBody.split(fullBoundary);

        result.multipart = parts.filter(httpMessageParser._isTruthy).map(function(part, i) {
          const result = {
            headers: null,
            body: null,
            meta: {
              body: {
                byteOffset: {
                  start: null,
                  end: null
                }
              }
            }
          };

          const newlineRegex = /\n\n|\r\n\r\n/gim;
          var newlineIndex = 0;
          var newlineMatch = newlineRegex.exec(part);
          var body = null;

          if (newlineMatch) {
            newlineIndex = newlineMatch.index;
            if (newlineMatch.index <= 0) {
              newlineMatch = newlineRegex.exec(part);
              if (newlineMatch) {
                newlineIndex = newlineMatch.index;
              }
            }
          }

          const possibleHeadersString = part.substr(0, newlineIndex);

          let startOffset = null;
          let endOffset = null;

          if (newlineIndex > -1) {
            const headers = httpMessageParser._parseHeaders(possibleHeadersString);
            if (Object.keys(headers).length > 0) {
              result.headers = headers;

              var boundaryIndexes = [];
              for (var j = 0; j < message.length; j++) {
                var boundaryMatch = message.slice(j, j + fullBoundary.length).toString();

                if (boundaryMatch === fullBoundary) {
                  boundaryIndexes.push(j);
                }
              }

              var boundaryNewlineIndexes = [];
              boundaryIndexes.slice(0, boundaryIndexes.length - 1).forEach(function(m, k) {
                const partBody = message.slice(boundaryIndexes[k], boundaryIndexes[k + 1]).toString();
                var headerNewlineIndex = partBody.search(/\n\n|\r\n\r\n/gim) + 2;
                headerNewlineIndex  = boundaryIndexes[k] + headerNewlineIndex;
                boundaryNewlineIndexes.push(headerNewlineIndex);
              });

              startOffset = boundaryNewlineIndexes[i];
              endOffset = boundaryIndexes[i + 1];
              body = message.slice(startOffset, endOffset);
            } else {
              body = part;
            }
          } else {
            body = part;
          }

          result.body = httpMessageParser._isFakeBuffer(body) ? body.toString() : body;
          result.meta.body.byteOffset.start = startOffset;
          result.meta.body.byteOffset.end = endOffset;

          return result;
        });
      }
    })();

    return result;
  }

  httpMessageParser._isTruthy = function _isTruthy(v) {
    return !!v;
  };

  httpMessageParser._isNumeric = function _isNumeric(v) {
    if (typeof v === 'number' && !isNaN(v)) {
      return true;
    }

    v = (v||'').toString().trim();

    if (!v) {
      return false;
    }

    return !isNaN(v);
  };

  httpMessageParser._isBuffer = function(item) {
    return ((httpMessageParser._isNodeBufferSupported() &&
            typeof global === 'object' &&
            global.Buffer.isBuffer(item)) ||
            (item instanceof Object &&
             item._isBuffer));
  };

  httpMessageParser._isNodeBufferSupported = function() {
    return (typeof global === 'object' &&
            typeof global.Buffer === 'function' &&
            typeof global.Buffer.isBuffer === 'function');
  };

  httpMessageParser._parseHeaders = function _parseHeaders(body) {
    const headers = {};

    if (typeof body !== 'string') {
      return headers;
    }

    body.split(/[\r\n]/).forEach(function(string) {
      const match = string.match(/([\w-]+):\s*(.*)/i);

      if (Array.isArray(match) && match.length === 3) {
        const key = match[1];
        const value = match[2];

        headers[key] = httpMessageParser._isNumeric(value) ? Number(value) : value;
      }
    });

    return headers;
  };

  httpMessageParser._requestLineRegex = /HTTP\/(1\.0|1\.1|2\.0)\s+(\d+)\s+([\w\s-_]+)/i;
  httpMessageParser._responseLineRegex = /(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD|TRACE|CONNECT)\s+(.*)\s+HTTP\/(1\.0|1\.1|2\.0)/i;
  httpMessageParser._headerNewlineRegex = /^[\r\n]+/gim;
  httpMessageParser._boundaryRegex = /(\n|\r\n)+--[\w-]+(\n|\r\n)+/g;

  httpMessageParser._createBuffer = function(data) {
    if (httpMessageParser._isNodeBufferSupported()) {
      return new Buffer(data);
    }

    return new httpMessageParser._FakeBuffer(data);
  };

  httpMessageParser._isFakeBuffer = function isFakeBuffer(obj) {
    return obj instanceof httpMessageParser._FakeBuffer;
  };

  httpMessageParser._FakeBuffer = function FakeBuffer(data) {
    if (!(this instanceof httpMessageParser._FakeBuffer)) {
      return new httpMessageParser._FakeBuffer(data);
    }

    this.data = [];

    if (Array.isArray(data)) {
      this.data = data;
    } else if (typeof data === 'string') {
      this.data = [].slice.call(data);
    }

    function LiveObject() {}
    Object.defineProperty(LiveObject.prototype, 'length', {
      get: function() {
        return this.data.length;
      }.bind(this)
    });

    this.length = (new LiveObject()).length;
  };

  httpMessageParser._FakeBuffer.prototype.slice = function slice() {
    var newArray = [].slice.apply(this.data, arguments);
    return new httpMessageParser._FakeBuffer(newArray);
  };

  httpMessageParser._FakeBuffer.prototype.search = function search() {
    return [].search.apply(this.data, arguments);
  };

  httpMessageParser._FakeBuffer.prototype.indexOf = function indexOf() {
    return [].indexOf.apply(this.data, arguments);
  };

  httpMessageParser._FakeBuffer.prototype.toString = function toString() {
    return this.data.join('');
  };

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = httpMessageParser;
    }
    exports.httpMessageParser = httpMessageParser;
  } else if (typeof define === 'function' && define.amd) {
    define([], function() {
      return httpMessageParser;
    });
  } else {
    root.httpMessageParser = httpMessageParser;
  }

})(this);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)

},{"buffer":2}],18:[function(require,module,exports){
'use strict';

var Stringify = require('./stringify');
var Parse = require('./parse');

module.exports = {
    stringify: Stringify,
    parse: Parse
};

},{"./parse":19,"./stringify":20}],19:[function(require,module,exports){
'use strict';

var Utils = require('./utils');

var internals = {
    delimiter: '&',
    depth: 5,
    arrayLimit: 20,
    parameterLimit: 1000,
    strictNullHandling: false,
    plainObjects: false,
    allowPrototypes: false,
    allowDots: false
};

internals.parseValues = function (str, options) {
    var obj = {};
    var parts = str.split(options.delimiter, options.parameterLimit === Infinity ? undefined : options.parameterLimit);

    for (var i = 0; i < parts.length; ++i) {
        var part = parts[i];
        var pos = part.indexOf(']=') === -1 ? part.indexOf('=') : part.indexOf(']=') + 1;

        if (pos === -1) {
            obj[Utils.decode(part)] = '';

            if (options.strictNullHandling) {
                obj[Utils.decode(part)] = null;
            }
        } else {
            var key = Utils.decode(part.slice(0, pos));
            var val = Utils.decode(part.slice(pos + 1));

            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                obj[key] = [].concat(obj[key]).concat(val);
            } else {
                obj[key] = val;
            }
        }
    }

    return obj;
};

internals.parseObject = function (chain, val, options) {
    if (!chain.length) {
        return val;
    }

    var root = chain.shift();

    var obj;
    if (root === '[]') {
        obj = [];
        obj = obj.concat(internals.parseObject(chain, val, options));
    } else {
        obj = options.plainObjects ? Object.create(null) : {};
        var cleanRoot = root[0] === '[' && root[root.length - 1] === ']' ? root.slice(1, root.length - 1) : root;
        var index = parseInt(cleanRoot, 10);
        if (
            !isNaN(index) &&
            root !== cleanRoot &&
            String(index) === cleanRoot &&
            index >= 0 &&
            (options.parseArrays && index <= options.arrayLimit)
        ) {
            obj = [];
            obj[index] = internals.parseObject(chain, val, options);
        } else {
            obj[cleanRoot] = internals.parseObject(chain, val, options);
        }
    }

    return obj;
};

internals.parseKeys = function (givenKey, val, options) {
    if (!givenKey) {
        return;
    }

    // Transform dot notation to bracket notation
    var key = options.allowDots ? givenKey.replace(/\.([^\.\[]+)/g, '[$1]') : givenKey;

    // The regex chunks

    var parent = /^([^\[\]]*)/;
    var child = /(\[[^\[\]]*\])/g;

    // Get the parent

    var segment = parent.exec(key);

    // Stash the parent if it exists

    var keys = [];
    if (segment[1]) {
        // If we aren't using plain objects, optionally prefix keys
        // that would overwrite object prototype properties
        if (!options.plainObjects && Object.prototype.hasOwnProperty(segment[1])) {
            if (!options.allowPrototypes) {
                return;
            }
        }

        keys.push(segment[1]);
    }

    // Loop through children appending to the array until we hit depth

    var i = 0;
    while ((segment = child.exec(key)) !== null && i < options.depth) {
        i += 1;
        if (!options.plainObjects && Object.prototype.hasOwnProperty(segment[1].replace(/\[|\]/g, ''))) {
            if (!options.allowPrototypes) {
                continue;
            }
        }
        keys.push(segment[1]);
    }

    // If there's a remainder, just add whatever is left

    if (segment) {
        keys.push('[' + key.slice(segment.index) + ']');
    }

    return internals.parseObject(keys, val, options);
};

module.exports = function (str, opts) {
    var options = opts || {};
    options.delimiter = typeof options.delimiter === 'string' || Utils.isRegExp(options.delimiter) ? options.delimiter : internals.delimiter;
    options.depth = typeof options.depth === 'number' ? options.depth : internals.depth;
    options.arrayLimit = typeof options.arrayLimit === 'number' ? options.arrayLimit : internals.arrayLimit;
    options.parseArrays = options.parseArrays !== false;
    options.allowDots = typeof options.allowDots === 'boolean' ? options.allowDots : internals.allowDots;
    options.plainObjects = typeof options.plainObjects === 'boolean' ? options.plainObjects : internals.plainObjects;
    options.allowPrototypes = typeof options.allowPrototypes === 'boolean' ? options.allowPrototypes : internals.allowPrototypes;
    options.parameterLimit = typeof options.parameterLimit === 'number' ? options.parameterLimit : internals.parameterLimit;
    options.strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : internals.strictNullHandling;

    if (
        str === '' ||
        str === null ||
        typeof str === 'undefined'
    ) {
        return options.plainObjects ? Object.create(null) : {};
    }

    var tempObj = typeof str === 'string' ? internals.parseValues(str, options) : str;
    var obj = options.plainObjects ? Object.create(null) : {};

    // Iterate over the keys and setup the new object

    var keys = Object.keys(tempObj);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var newObj = internals.parseKeys(key, tempObj[key], options);
        obj = Utils.merge(obj, newObj, options);
    }

    return Utils.compact(obj);
};

},{"./utils":21}],20:[function(require,module,exports){
'use strict';

var Utils = require('./utils');

var internals = {
    delimiter: '&',
    arrayPrefixGenerators: {
        brackets: function (prefix) {
            return prefix + '[]';
        },
        indices: function (prefix, key) {
            return prefix + '[' + key + ']';
        },
        repeat: function (prefix) {
            return prefix;
        }
    },
    strictNullHandling: false,
    skipNulls: false,
    encode: true
};

internals.stringify = function (object, prefix, generateArrayPrefix, strictNullHandling, skipNulls, encode, filter, sort, allowDots) {
    var obj = object;
    if (typeof filter === 'function') {
        obj = filter(prefix, obj);
    } else if (Utils.isBuffer(obj)) {
        obj = String(obj);
    } else if (obj instanceof Date) {
        obj = obj.toISOString();
    } else if (obj === null) {
        if (strictNullHandling) {
            return encode ? Utils.encode(prefix) : prefix;
        }

        obj = '';
    }

    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
        if (encode) {
            return [Utils.encode(prefix) + '=' + Utils.encode(obj)];
        }
        return [prefix + '=' + obj];
    }

    var values = [];

    if (typeof obj === 'undefined') {
        return values;
    }

    var objKeys;
    if (Array.isArray(filter)) {
        objKeys = filter;
    } else {
        var keys = Object.keys(obj);
        objKeys = sort ? keys.sort(sort) : keys;
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (skipNulls && obj[key] === null) {
            continue;
        }

        if (Array.isArray(obj)) {
            values = values.concat(internals.stringify(obj[key], generateArrayPrefix(prefix, key), generateArrayPrefix, strictNullHandling, skipNulls, encode, filter, sort, allowDots));
        } else {
            values = values.concat(internals.stringify(obj[key], prefix + (allowDots ? '.' + key : '[' + key + ']'), generateArrayPrefix, strictNullHandling, skipNulls, encode, filter, sort, allowDots));
        }
    }

    return values;
};

module.exports = function (object, opts) {
    var obj = object;
    var options = opts || {};
    var delimiter = typeof options.delimiter === 'undefined' ? internals.delimiter : options.delimiter;
    var strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : internals.strictNullHandling;
    var skipNulls = typeof options.skipNulls === 'boolean' ? options.skipNulls : internals.skipNulls;
    var encode = typeof options.encode === 'boolean' ? options.encode : internals.encode;
    var sort = typeof options.sort === 'function' ? options.sort : null;
    var allowDots = typeof options.allowDots === 'undefined' ? false : options.allowDots;
    var objKeys;
    var filter;
    if (typeof options.filter === 'function') {
        filter = options.filter;
        obj = filter('', obj);
    } else if (Array.isArray(options.filter)) {
        objKeys = filter = options.filter;
    }

    var keys = [];

    if (typeof obj !== 'object' || obj === null) {
        return '';
    }

    var arrayFormat;
    if (options.arrayFormat in internals.arrayPrefixGenerators) {
        arrayFormat = options.arrayFormat;
    } else if ('indices' in options) {
        arrayFormat = options.indices ? 'indices' : 'repeat';
    } else {
        arrayFormat = 'indices';
    }

    var generateArrayPrefix = internals.arrayPrefixGenerators[arrayFormat];

    if (!objKeys) {
        objKeys = Object.keys(obj);
    }

    if (sort) {
        objKeys.sort(sort);
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (skipNulls && obj[key] === null) {
            continue;
        }

        keys = keys.concat(internals.stringify(obj[key], key, generateArrayPrefix, strictNullHandling, skipNulls, encode, filter, sort, allowDots));
    }

    return keys.join(delimiter);
};

},{"./utils":21}],21:[function(require,module,exports){
'use strict';

var hexTable = (function () {
    var array = new Array(256);
    for (var i = 0; i < 256; ++i) {
        array[i] = '%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase();
    }

    return array;
}());

exports.arrayToObject = function (source, options) {
    var obj = options.plainObjects ? Object.create(null) : {};
    for (var i = 0; i < source.length; ++i) {
        if (typeof source[i] !== 'undefined') {
            obj[i] = source[i];
        }
    }

    return obj;
};

exports.merge = function (target, source, options) {
    if (!source) {
        return target;
    }

    if (typeof source !== 'object') {
        if (Array.isArray(target)) {
            target.push(source);
        } else if (typeof target === 'object') {
            target[source] = true;
        } else {
            return [target, source];
        }

        return target;
    }

    if (typeof target !== 'object') {
        return [target].concat(source);
    }

    var mergeTarget = target;
    if (Array.isArray(target) && !Array.isArray(source)) {
        mergeTarget = exports.arrayToObject(target, options);
    }

	return Object.keys(source).reduce(function (acc, key) {
        var value = source[key];

        if (Object.prototype.hasOwnProperty.call(acc, key)) {
            acc[key] = exports.merge(acc[key], value, options);
        } else {
            acc[key] = value;
        }
		return acc;
    }, mergeTarget);
};

exports.decode = function (str) {
    try {
        return decodeURIComponent(str.replace(/\+/g, ' '));
    } catch (e) {
        return str;
    }
};

exports.encode = function (str) {
    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
    // It has been adapted here for stricter adherence to RFC 3986
    if (str.length === 0) {
        return str;
    }

    var string = typeof str === 'string' ? str : String(str);

    var out = '';
    for (var i = 0; i < string.length; ++i) {
        var c = string.charCodeAt(i);

        if (
            c === 0x2D || // -
            c === 0x2E || // .
            c === 0x5F || // _
            c === 0x7E || // ~
            (c >= 0x30 && c <= 0x39) || // 0-9
            (c >= 0x41 && c <= 0x5A) || // a-z
            (c >= 0x61 && c <= 0x7A) // A-Z
        ) {
            out += string.charAt(i);
            continue;
        }

        if (c < 0x80) {
            out = out + hexTable[c];
            continue;
        }

        if (c < 0x800) {
            out = out + (hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        if (c < 0xD800 || c >= 0xE000) {
            out = out + (hexTable[0xE0 | (c >> 12)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        i += 1;
        c = 0x10000 + (((c & 0x3FF) << 10) | (string.charCodeAt(i) & 0x3FF));
        out += (hexTable[0xF0 | (c >> 18)] + hexTable[0x80 | ((c >> 12) & 0x3F)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
    }

    return out;
};

exports.compact = function (obj, references) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    var refs = references || [];
    var lookup = refs.indexOf(obj);
    if (lookup !== -1) {
        return refs[lookup];
    }

    refs.push(obj);

    if (Array.isArray(obj)) {
        var compacted = [];

        for (var i = 0; i < obj.length; ++i) {
            if (typeof obj[i] !== 'undefined') {
                compacted.push(obj[i]);
            }
        }

        return compacted;
    }

    var keys = Object.keys(obj);
    for (var j = 0; j < keys.length; ++j) {
        var key = keys[j];
        obj[key] = exports.compact(obj[key], refs);
    }

    return obj;
};

exports.isRegExp = function (obj) {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
};

exports.isBuffer = function (obj) {
    if (obj === null || typeof obj === 'undefined') {
        return false;
    }

    return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
};

},{}]},{},[1])