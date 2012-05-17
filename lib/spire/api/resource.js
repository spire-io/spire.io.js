/**
 * @fileOverview Resource class definition
 */

var _ = require('underscore')
  , ResponseError = require('./response_error')
  , EventEmitter = require('events').EventEmitter
  ;

/**
 * Base class for objects repreenting resources in the spire api.  It is meant
 * to be extended by other classes.
 *
 * <p>Resources have methods for making requests to the spire api.  These methods
 * are defined with `Request.defineRequest`.  Note that this is a method on the
 * Request object itself, not the prototype.  It is used to create methods on
 * the prototype of Resource classes.</p>
 *
 * <p>The `Resource` class provides default requests for the `get`, `put`,
 * `delete`, and `post` methods.  These methods can be overwritten by
 * subclasses.</p>
 *
 * <p>Once a request method has been defined, it can be run with
 * <pre><code>
 *   resource.request(<request name>);
 * </code></pre>
 * </p>
 *
 * <p>Such request methods have no side effects, and return JSON objects direct
 * from the spire api.</p>
 *
 * @class Base class for Spire API Resources
 *
 * @constructor
 * @extends EventEmitter
 * @param {object} spire Spire object
 * @param {object} data Resource data from the spire api
 */
function Resource(spire, data) {
  this.spire = spire;
  this.data = data;
}

Resource.prototype = new EventEmitter();

module.exports = Resource;

/**
 * Creates a request method on given object.
 *
 * `name` is the name of the request.  This is what gets passed to the `request`
 * method when actually calling the request.
 *
 * For instance, a request defined with
 * <pre><code>
 *   defineRequest(somePrototype, 'get', createGetReq);
 * </code></pre>
 *
 * is run by calling
 * <pre><code>
 *   resource.request('get', callback);
 * </code></pre>
 *
 * `fn` is a function that takes any number of arguments and returns a hash
 * describing the http request we are about to send.  Any arguments to this
 * function can be passed to the `request` method.
 *
 * For example, suppose `createGetReq` from above is the following function,
 * which takes an id number as argument as puts it in the query params:
 *
 * <pre><code>
 *   function createGetReq (id) {
 *     return {
 *       method: 'get',
 *       url: this.url(),
 *       query: { id: id },
 *      };
 *   };
 * </code></pre>
 *
 *  You would call that request like this:
 *  <code>resource.request('get', id, callback);</code>
 *
 * @param {object} obj Object to add the request method to.
 * @param {string} name Name of the request method
 * @param {function (*args)} fn Function taking any number of arguments, returning an object describing the HTTP request.
 */
Resource.defineRequest = function (obj, name, fn) {
  obj['_req_' + name] = function () {
    var shred = this.spire.shred;

    var args = Array.prototype.slice.call(arguments);
    var callback = args.pop();

    var req = fn.apply(this, args);

    return shred.request(req)
      .on('error', function (res) {
        var error = new ResponseError(res, req);
        callback(error);
      })
      .on('success', function (res) {
        callback(null, res.body.data);
      });
  };
};

/**
 * <p>Makes the request with the given name.
 *
 * <p>Arguments are the request name, followed by any number of arguments that will
 * be passed to the function which creates the request description, and a
 * callback.
 */
Resource.prototype.request = function () {
  var args = Array.prototype.slice.call(arguments);
  var reqName = args.shift();
  var cb = args[args.length - 1];
  if (typeof this['_req_' + reqName] !== 'function') {
    return cb(new Error("No request defined for " + reqName));
  }
  return this['_req_' + reqName].apply(this, args);
};

/**
 * <p>Gets the resource.
 *
 * <p>Default method that may be overwritten by subclasses.
 *
 * @param {function (err, resource)} cb Callback
 */
Resource.prototype.get = function (cb) {
  var resource = this;
  this.request('get', function (err, data) {
    if (err) return cb(err);
    resource.data = data;
    cb(null, resource);
  });
};

/**
 * <p>Gets the resource if we have the get capability.  Otherwise just return the resource.
 *
 * <p>Default method that may be overwritten by subclasses.
 *
 * @param {function (err, resource)} cb Callback
 */
Resource.prototype.getIfCapable = function(cb){
  if(this.capability('get')){
    this.get(cb);
  } else {
    cb(null, this);
  }
}

/**
 * <p>Updates (puts to) the resource.
 *
 * <p>Default method that may be overwritten by subclasses.
 *
 * @param {object} data Resource data
 * @param {function (err, resource)} cb Callback
 */
Resource.prototype.update = function (data, cb) {
  var resource = this;
  this.request('update', data, function (err, data) {
    if (err) return cb(err);
    resource.data = data;
    cb(null, resource);
  });
};

/**
 * <p>Delete the resource.
 *
 * <p>Default method that may be overwritten by subclasses.
 *
 * @param {function (err, resource)} cb Callback
 */
Resource.prototype['delete'] = function (cb) {
  cb = cb || function (err) { if (err) { throw err; } };
  var resource = this;
  this.request('delete', function (err, data) {
    if (err) return cb(err);
    delete resource.data;
    cb(null);
  });
};

/**
 * Returns the url for the resource.
 *
 * @returns {string} url
 */
Resource.prototype.url = function () {
  return this.data.url;
};

/**
 * Returns the capabilities for the resource.
 *
 * @returns {object} Capabilities
 */
Resource.prototype.capabilities = function () {
  return this.data.capabilities;
};

/**
 * Returns the capability for the resource and method
 *
 * @returns {string} Capability
 */
Resource.prototype.capability = function (method) {
  return this.capabilities()[method];
};

/**
 * Returns the Authorization header for this resource, or for another capability
 * if one is passed in.
 *
 * @param {Resource} [resource] Optional resource
 * @param {string} method Method
 * @returns {string} Authorization header
 */
Resource.prototype.authorization = function (method, resource) {
  var cap;
  if (resource) {
    if (typeof resource.capability === 'function') {
      cap = resource.capability(method);
    } else {
      cap = resource.capabilities[method];
    }
  } else {
    cap = this.capability(method);
  }
  return "Capability " + cap;
};

/**
 * Returns the resource schema for this resource the resource of a given name.
 *
 * @param {string} [name] Optional name of the resource schema to return
 * @returns {string} Schema
 */
Resource.prototype.schema = function (name) {
  name = name || this.resourceName;

  if (!this.spire.api.schema) {
    throw "No description object.  Run `spire.api.discover` first.";
  }

  if (!this.spire.api.schema[name]) {
    throw "No schema for resource " + name;
  }

  return this.spire.api.schema[name];
};

/**
 * Returns the MIME type for this resource or the resource of a given name.
 *
 * @param {string} [name] Optional name of the resource MIME type to return
 * @returns {string} MIME type
 */
Resource.prototype.mediaType = function (name) {
  return this.schema(name).mediaType;
};

/**
 * Requests
 * These define API calls and have no side effects.  They can be run by calling
 *     this.request(<request name>);
 *
 * The requests defined on the Resource class are defaults.  They can be
 * overwritten by subclasses.
 */

/**
 * Gets the resource.
 * @name get
 * @ignore
 */
Resource.defineRequest(Resource.prototype, 'get', function () {
  return {
    method: 'get',
    url: this.url(),
    headers: {
      'Authorization': this.authorization('get'),
      'Accept': this.mediaType(),
      'Content-Type': this.mediaType()
    }
  };
});

/**
 * Updates (puts) to the resouce.
 * @name update
 * @ignore
 */
Resource.defineRequest(Resource.prototype, 'update', function (data) {
  return {
    method: 'put',
    url: this.url(),
    content: data,
    headers: {
      'Authorization': this.authorization('update'),
      'Accept': this.mediaType(),
      'Content-Type': this.mediaType()
    }
  };
});

/**
 * Deletes a resource.
 * @name delete
 * @ignore
 */
Resource.defineRequest(Resource.prototype, 'delete', function () {
  return {
    method: 'delete',
    url: this.url(),
    headers: {
      'Authorization': this.authorization('delete'),
      'Accept': this.mediaType(),
      'Content-Type': this.mediaType()
    }
  };
});
