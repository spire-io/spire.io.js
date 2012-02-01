if (typeof module === 'object' && module.exports) {
  var Spire = require('../../lib/spire.io.js');
  module.exports.spire = new Spire();
  var spire_url;
  if (spire_url = process.env["SPIRE_URL"]) {
    module.exports.spire.options.url = spire_url;
  }
}
