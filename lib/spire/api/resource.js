var _ = require('underscore')
  , Shred = require('shred')
  , shred = new Shred()
  , ResponseError = require('./response_error')
  , EventEmitter = require('events').EventEmitter
  ;

// # Resource Class
//
// This is the base class for objects repreenting resources in the spire api.
// It is meant to be extended by other classes.
//
// Resources have methods for making requests to the spire api.  These methods
// are defined with `Request.defineRequest`.  Note that this is a method on the
// Request object itself, not the prototype.  It is used to create methods on
// the prototype of Resource classes.
//
// The `Resource` class provides default requests for the `get`, `put`,
// `delete`, and `post` methods.  These methods can be overwritten by
// subclasses.
//
// Once a request method has been defined, it can be run with
//     resource.request(<request name>);
//
// Such request methods have no side effects, and return JSON objects direct
// from the spire api.
//
// Resources inherit from EventEmitter.
//
// @constructor
// @param spire {object} Spire object
// @param data {object} Resource data from the spire api
function Resource (spire, data) {
  this.spire = spire;
  this.data = data;
};

Resource.prototype = new EventEmitter();

module.exports = Resource;

// ## Class Methods

// ### Resource.defineRequest
// Creates a request method on given object.
//
// `name` is the name of the request.  This is what gets passed to the `request`
// method when actually calling the request.
//
// For instance, a request defined with
//     defineRequest(somePrototype, 'get', createGetReq);
// is run by calling
//     resource.request('get', callback);
//
// `fn` is a function that takes any number of arguments and returns a hash
// describing the http request we are about to send.  Any arguments to this
// function can be passed to the `request` method.
//
// For example, suppose `createGetReq` from above is the following function,
// which takes an id number as argument as puts it in the query params:
//     function createGetReq (id) {
//       return {
//         method: 'get',
//         url: this.url(),
//         query: { id: id },
//        };
//     };
//
//  You would call that request like this:
//      resource.request('get', id, callback);
//
// @param obj {object} Object to add the request method to.
// @param name {string} Name of the request method
// @param fn {function (*args)} Function taking any number of arguments,
// returning an object describing the HTTP request.
Resource.defineRequest = function (obj, name, fn) {
  obj['_req_' + name] = function () {
    var args = Array.prototype.slice.call(arguments);
    var callback = args.pop();

    var req = fn.apply(this, args)

    shred.request(req)
      .on('error', function (res) {
        var error = new ResponseError(res);
        callback(error);
      })
      .on('success', function (res) {
        callback(null, res.body.data);
      });
  };
};

// ## Public Interface
//
// Resource.prototype.request
// Makes the request with the given name.
//
// Arguments are the request name, followed by any number of arguments that will
// be passed to the function which creates the request description, and a
// callback.
Resource.prototype.request = function () {
  var args = Array.prototype.slice.call(arguments);
  var reqName = args.shift();
  var cb = args[args.length - 1];
  if (typeof this['_req_' + reqName] !== 'function') {
    return cb(new Error("No request defined for " + reqName));
  }
  this['_req_' + reqName].apply(this, args);
};

// ### Resource.prototype.get
// Gets the resource.
//
// Default method that may be overwritten by subclasses.
//
// @param cb {function (err, resource)} Callback
Resource.prototype.get = function (cb) {
  var resource = this;
  this.request('get', function (err, data) {
    if (err) return cb(err);
    resource.data = data;
    cb(null, resource);
  });
};

// ### Resource.prototype.update
// Updates (puts to) the resource.
//
// Default method that may be overwritten by subclasses.
//
// @param data {object} Resource data
// @param cb {function (err, resource)} Callback
Resource.prototype.update = function (data, cb) {
  var resource = this;
  this.request('update', data, function (err, data) {
    if (err) return cb(err);
    resource.data = data;
    cb(null, resource);
  });
};

// ### Resource.prototype.delete
// Delete the resource.
//
// Default method that may be overwritten by subclasses.
//
// @param cb {function (err)} Callback
Resource.prototype.delete = function (data, cb) {
  var resource = this;
  this.request('delete', data, function (err, data) {
    if (err) return cb(err);
    delete resource.data;
    cb(null);
  });
};

// ### Resource.prototype.url
// Returns the url for the resource.
Resource.prototype.url = function () {
  return this.data.url;
};

// ### Resource.prototype.capability
// Returns the capability for the resource.
Resource.prototype.capability = function () {
  return this.data.capability;
};

// ### Resource.prototype.authorization.
// Returns the Authorization header for this resource, or for another capability
// if one is passed in.
//
// @param [cap] {string} Optional capability string
Resource.prototype.authorization = function (cap) {
  cap = cap || this.capability();
  return "Capability " + cap;
};

// ### Resource.prototype.key
// Returns the resource key.
//
// Note that this is a getter and not a function, so you can access it with just
// `resource.key`.
Resource.prototype.__defineGetter__('key', function () {
  return this.data.key;
});

// ### Resource.prototype.schema
// Returns the resource schema for this resource the resource of a given name.
//
// @param [name] {string} Optional name of the resource schema to return
Resource.prototype.schema = function (name) {
  return this.spire.api.schema[name || this.resourceName];
};

// ### Resource.prototype.mediaType
// Returns the MIME type for this resource or the resource of a given name.
//
// @param [name] {string} Optional name of the resource MIME type to return
Resource.prototype.mediaType = function (name) {
  return this.schema(name).mediaType;
};

// ## Requests
// These define API calls and have no side effects.  They can be run by calling
//     this.request(<request name>);
//
// The requests defined on the Resource class are defaults.  They can be
// overwritten by subclasses.

// ### get
// Gets the resource.
Resource.defineRequest(Resource.prototype, 'get', function () {
  return {
    method: 'get',
    url: this.url(),
    headers: {
      'Authorization': this.authorization(),
      'Accept': this.mediaType(),
      'Content-Type': this.mediaType()
    }
  };
});

// ### update
// Updates (puts) to the resouce.
Resource.defineRequest(Resource.prototype, 'update', function (data) {
  return {
    method: 'put',
    url: this.url(),
    content: data,
    headers: {
      'Authorization': this.authorization(),
      'Accept': this.mediaType(),
      'Content-Type': this.mediaType()
    }
  };
});

// ### delete
// Deletes a resource.
Resource.defineRequest(Resource.prototype, 'delete', function () {
  return {
    method: 'delete',
    url: this.url(),
    headers: {
      'Authorization': this.authorization(),
      'Accept': this.mediaType(),
      'Content-Type': this.mediaType()
    }
  };
});

