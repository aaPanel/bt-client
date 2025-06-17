var Q = require('q');
var fs = require('fs');
var os = require('os');
var path = require('path');
var defaults = require('lodash.defaults');
var sanitize = require("sanitize-filename");

var mappingStructure = {
  address: {
    def: '',
    name: 'full address:s:'
  },
  username: {
    def: '',
    name:'username:s:'
  },
  password: {
    def: ''
  },
  deleteCredentialsAfter: {
    def: true
  },
  safeMode: {
    def: false
  },
  autoReconnect: {
    def: true,
    name: 'autoreconnection enabled:i:',
    fn: arrayMatchTransform([false, true])
  },
  fullscreen: {
    def: true,
    name: 'screen mode id:i:',
    fn: arrayMatchTransform([false, true], 1)
  },
  smartSizing: {
    def: false,
    name: 'smart sizing:i:',
    fn: arrayMatchTransform([false, true],1)
  },
  dynamicResolution: {
    def: 1,
    name: 'dynamic resolution:i:',
    fn: arrayMatchTransform([0, 1], 1)
  },
  width: {
    def: 1024,
    name: 'desktopwidth:i:'
  },
  height: {
    def: 768,
    name: 'desktopheight:i:'
  },
  winposstr: {
    def: '0,1,0,0,8192,8192',
    name: 'winposstr:s:'
  },
  colors: {
    def: 32,
    name: 'session bpp:i:'
  },
  compression: {
    def: true,
    name: 'compression:i:',
    fn: arrayMatchTransform([false, true])
  },
  connectionType: {
    def: 'auto',
    name: 'connection type:i:',
    fn: arrayMatchTransform(['modem', 'low', 'satellite', 'high', 'wan', 'lan', 'auto'], 1)
  },
  networkAutoDetect: {
    def: true,
    name: 'networkautodetect:i:',
    fn: arrayMatchTransform([false, true])
  },
  bandwidthAutoDetect: {
    def: true,
    name: 'bandwidthautodetect:i:',
    fn: arrayMatchTransform([false, true])
  },
  showWallpaper: {
    def: false,
    name: 'disable wallpaper:i:',
    fn: arrayMatchTransform([true, false])
  },
  fontSmoothing: {
    def: false,
    name: 'allow font smoothing:i:',
    fn: arrayMatchTransform([false, true])
  },
  desktopComposition: {
    def: false,
    name: 'allow desktop composition:i:',
    fn: arrayMatchTransform([false, true])
  },
  showDraggedWindow: {
    def: false,
    name: 'disable full window drag:i:',
    fn: arrayMatchTransform([true, false])
  },
  showMenuAnimations: {
    def: false,
    name: 'disable menu anims:i:',
    fn: arrayMatchTransform([true, false])
  },
  showThemes: {
    def: true,
    name: 'disable themes:i:',
    fn: arrayMatchTransform([true, false])
  },
  showBlinkingCursor: {
    def: true,
    name: 'disable cursor setting:i:',
    fn: arrayMatchTransform([true, false])
  },
  audioPlayMode: {
    def: 'local',
    name: 'audiomode:i:',
    fn: arrayMatchTransform(['local', 'remote', 'none'], 0)
  },
  audioCaptureMode: {
    def: false,
    name: 'audiocapturemode:i:',
    fn: arrayMatchTransform([false, true])
  },
  enableLocalPrinters: {
    def: true,
    name: 'redirectprinters:i:',
    fn: arrayMatchTransform([false, true])
  },
  enableLocalCOMPorts: {
    def: false,
    name: 'redirectcomports:i:',
    fn: arrayMatchTransform([false, true])
  },
  enableSmartCards: {
    def: true,
    name: 'redirectsmartcards:i:',
    fn: arrayMatchTransform([false, true])
  },
  enableClipboard: {
    def: true,
    name: 'redirectclipboard:i:',
    fn: arrayMatchTransform([false, true])
  },
  enablePlugAndPlayDevices: {
    def: '',
    name: 'devicestoredirect:s:'
  },
  enableDrives: {
    def: '',
    name: 'drivestoredirect:s:'
  },
  enablePos: {
    def: false,
    name: 'redirectposdevices:i:',
    fn: arrayMatchTransform([false, true])
  },
  launch: {
    def: '',
    name: 'alternate shell:s:'
  },
  launchWorkingDirectory: {
    def: '',
    name: 'shell working directory:s:'
  }
};

var mapping = {};
for (var key in mappingStructure) {
  mapping[key] = mappingStructure[key].def;
  if (!mappingStructure[key].fn) {
    mappingStructure[key].fn = function(value) {
      return value;
    };
  }
}

function isNumber(value) {
  return (typeof(value) === 'number');
}

function isUndefined(value) {
  return (typeof(value) === 'undefined');
}

function arrayMatchTransform(array, increment, def) {
  return function(value) {
    var index;
    if (isUndefined(increment)) {
      increment = 0;
    }
    if (isNumber(value)) {
      index = value - increment;
    } else {
      index = array.indexOf(value);
    }
    if (index >= 0 && index <= array.length - 1) {
      return index + increment;
    }
    if (isUndefined(def)) {
      return array.length - 1 + increment;
    }
    return def;
  }
}

function getRdpFileContent(config) {
  defaults(config, mapping);
  var rdpConfigText = '';
  for (var key in config) {
    if (mappingStructure[key].name) {
      rdpConfigText += mappingStructure[key].name + mappingStructure[key].fn(config[key]) + '\n';
    }
  }
  return rdpConfigText;
}

/**
 * Returns a promise that will be resolved as soon as the file is created.
 * @param config
 * @returns {promise|*|Q.promise}
 */
function buildRdpFile(config) {
  var deferred = Q.defer();
  var fileContent = getRdpFileContent(config);
  var fileName = path.normalize(os.tmpdir() + '/' + sanitize(config.address) + '.rdp');
  Q.nfcall(fs.writeFile, fileName, fileContent)
    .then(function() {
      deferred.resolve(fileName);
    })
    .fail(deferred.reject);
  return deferred.promise;
}

module.exports.buildRdpFile = buildRdpFile;
module.exports.getRdpFileContent = getRdpFileContent;