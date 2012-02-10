if (typeof module === 'object' && module.exports) {
  var Spire = require('../../lib/spire.io.js');
  var opts = {};
  if (process.env["SPIRE_URL"]) {
    opts.url = process.env["SPIRE_URL"];
  }

  function createSpire() {
    return new Spire({ url: 'http://build.spire.io' });
  };

  module.exports.createSpire = createSpire;
}
