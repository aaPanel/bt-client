var {buildRdpFile,getRdpFileContent} = require('./rdp-file');
var rdpConnect = require('./rdp-connect');

/**
 * Connects to a RDP server based on a configuration file.
 * The return value is a {Q.promise} that will be resolved:
 *   - with any value when the connection has terminated, if config.safeMode is false
 *   - with a {Q.defer} object as soon as the connection is initiated, if config.safeMode is true
 * The {Q.defer} object can be manually rejected in order to manually terminate the connection.
 *
 * @param config The configuration object
 * @returns {Q.promise} The promise that will be resolved when the connection is terminated
 * or when the connection is initiated.
 */
function rdp(config) {
  return buildRdpFile(config)
    .then(function(filePath) {
      return rdpConnect(config, filePath);
    });
}

module.exports = rdp;
module.exports.getRdpFileContent = getRdpFileContent;