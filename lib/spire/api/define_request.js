var _ = require('underscore');

var ResponseError = require('./response_error');

var defineRequest = function (obj, name, fn) {
  obj.prototype[name] = function () {
    var spire = this.spire;

    var args = Array.prototype.slice.call(arguments);
    var cb = args.pop();

    var req = fn.call(obj, args)

    spire.shred.request(req)
      .on('error', function (res) {
        var error = new ResponseError(response);
        callback(error);
      })
      .on('success', function (res) {
        callback(null, response.body.data);
      });
  };
};

module.exports = defineRequest;

