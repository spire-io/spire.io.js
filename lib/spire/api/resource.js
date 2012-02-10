var _ = require('underscore')
  , Shred = require('shred')
  , shred = new Shred()
  , ResponseError = require('./response_error')
  ;

function Resource (spire, data) {
  this.spire = spire;
  this.data = data;
};

Resource.prototype.resourceName = function () {
  return this.constructor.name.toLowerCase();
};

Resource.defineRequest = function (obj, name, fn) {
  obj['_req_' + name] = function () {
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
};

Resource.prototype.request = function () {
  var args = Array.prototype.slice.call(arguments);
  var reqName = args.shift();
  var cb = args[args.length - 1];
  if (typeof this.['_req_' + reqName] !== 'function') {
    return cb(new Error("No request defined for " + reqName));
  }
  this[reqName].apply(this, args);
};

Resource.defineRequest(Resource.prototype, 'get', function () {
  return {
    method: 'get',
    url: this.url(),
    headers: {
      'Authorization': this.authorization(),
      'Accept': this.mediaType()
      'Content-Type': this.mediaType()
    }
  };
});

Resource.defineRequest(Resource.prototype, 'update', function (data) {
  return {
    method: 'get',
    url: this.url(),
    content: data,
    headers: {
      'Authorization': this.authorization(),
      'Accept': this.mediaType()
      'Content-Type': this.mediaType()
    }
  };
});
  
Resource.defineRequest(Resource.prototype, 'delete', function () {
  return {
    method: 'get',
    url: this.url(),
    headers: {
      'Authorization': this.authorization(),
      'Accept': this.mediaType()
      'Content-Type': this.mediaType()
    }
  };
});

Resource.prototype.get = function (cb) {
  var resource = this;
  this.request('get', function (err, data) {
    if (err) return cb(err);
    resource.data = data;
    cb(null, resource);
  });
};

Resource.prototype.update = function (data, cb) {
  var resource = this;
  this.request('update', data, function (err, data) {
    if (err) return cb(err);
    resource.data = data;
    cb(null, resource);
  });
};

Resource.prototype.delete = function (data, cb) {
  var resource = this;
  this.request('delete', data, function (err, data) {
    if (err) return cb(err);
    delete resource.data;
    cb(null, resource);
  });
};

Resource.prototype.url = function () {
  return this.data.url;
};

Resource.prototype.capability = function () {
  return this.data.capability;
};

Resource.prototype.authorization = function (cap) {
  cap ||= this.capability();
  return "Capability: " + this.capability();
};

Resource.prototype.key = function () {
  return this.data.key;
};

Resource.prototye.schema = function (name) {
  return this.spire.schema[name || this.resourceName];
};

Resource.prototype.mediaType = function (name) {
  return this.schema(name).mediaType;
};
