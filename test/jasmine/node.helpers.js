if (typeof module === 'object' && module.exports) {
  var Spire = require('../../lib/spire.io.js');

  var spireUrl = process.env["SPIRE_URL"] || 'http://build.spire.io';

  module.exports.Spire = function (opts) {
    opts = opts || {};
    opts.url = spireUrl;
    return new Spire(opts);
  };

  module.exports.createSpire = function () {
    return module.exports.Spire();
  };
}
