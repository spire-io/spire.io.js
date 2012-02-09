var _ = require('underscore')
  , Shred = require('shred')
  , shred = new Shred()
  , ResponseError = require('./response_error')
  ;

var Resource = function (spire) {
  this.spire = spire;
};

Resource.prototype.request = function () {
  var args = Array.prototype.slice.call(arguments);
  var reqName = args.shift();
  var cb = args[args.length - 1];
  if (typeof this.requests[reqName] !== 'function') {
    return cb(new Error("No request defined for " + reqName));
  }
  this.requests[reqName].apply(this, args);
};

Resource.defineRequest = function (obj, name, fn) {
  obj.prototype.requests ||= {};
  obj.prototype.requests[name] = function () {
    var spire = this.spire;

    var args = Array.prototype.slice.call(arguments);
    var cb = args.pop();

    var req = fn.call(obj, args)

    shred.request(req)
      .on('error', function (res) {
        var error = new ResponseError(response);
        callback(error);
      })
      .on('success', function (res) {
        callback(null, response.body.data);
      });
  };
};


