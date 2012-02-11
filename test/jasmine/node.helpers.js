if (typeof module === 'object' && module.exports) {
  var Spire = require('../../lib/spire.io.js');
  var opts = {};
  opts.url = process.env["SPIRE_URL"] || 'http://build.spire.io';

  function createSpire() {
    return new Spire(opts);
  };

  module.exports.createSpire = createSpire;
}
