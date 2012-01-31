if (typeof module === 'object' && module.exports) {
  module.exports.spire = require('../../spire.io.js');
  var spire_url;
  if (spire_url = process.env["SPIRE_URL"]) {
    module.exports.spire.options.url = spire_url;
  }
}
