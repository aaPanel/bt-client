var Q = require('q');
var os =require ('os');
var fs = require('fs');
var childProcess = require('child_process');
var spawn = childProcess.spawn;
var spawnSync = childProcess.spawnSync;

function deleteRdpCredentials(ip) {
  if(os.type()==='Windows_NT'){
    return spawnSync('cmdkey.exe', ['/delete:TERMSRV/' + ip]);
  }
}

function storeRdpCredentials(ip, username, password) {
  if(os.type()==='Windows_NT'){
  // when saving credentials, ignore the IP or weird things will happen when multiple OSs are accessed via RDP
  ip = ip.replace(/:.*/g, '');
  return spawnSync('cmdkey.exe', ['/generic:TERMSRV/' + ip, '/user:' + username, '/pass:' + password]);
  }
}

function deleteRdpFile(filePath) {
  fs.unlinkSync(filePath);
}

function connect(config, filePath) {
  var deferred = Q.defer();
  var proc;
  if(os.type()==='Windows_NT'){
   proc = spawn('mstsc.exe', [filePath, '/admin', '/v', config.address]);
  }else {
    proc = spawn('open', [filePath]);
  }
  // when the process is closed, return the control to the pipe
  proc.on('exit', function() {
    deferred.resolve(true);
  });
  // force the disconnection when the promise is resolved
  deferred.promise.fail(function() {
    if (!proc.killed) {
      proc.kill();
    }
  });
  return deferred;
}

function cleanup(config, filePath) {
  if (typeof(config.deleteCredentialsAfter) === 'undefined' || config.deleteCredentialsAfter === true) {
    deleteRdpCredentials(config.address);
  }
  deleteRdpFile(filePath);
  return true;
}

function rdpConnect(config, filePath) {
  // update the latest RDP credentials for the connection
  deleteRdpCredentials(config.address);
  storeRdpCredentials(config.address, config.username, config.password);

  // connect to the given address
  var deferred = connect(config, filePath);

  // after everything, clear the credentials
  deferred.promise.then(function() {
    return cleanup(config, filePath);
  });

  // set this to true in order to get the handle of a deferred
  // when calling rdpConnect.
  // By manually rejecting the deferred object you can trigger
  // the closure of the spawned project, thus disconnecting.
  if (!config.safeMode) {
    return deferred.promise;
  }

  return deferred;
}

module.exports = rdpConnect;