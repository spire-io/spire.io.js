var Resource = require('./api/resource')
  , Account = require('./api/account')
  , Billing = require('./api/billing')
  , Channel = require('./api/channel')
  , Session = require('./api/session')
  , Subscription = require('./api/subscription')
  ;

// # API
// Abstraction for the spire api.
//
//     @constructor
//     @param {object} spire Spire object
//     @param {object} [opts] Options
//     @param {string} [opts.url] Spire api url
//     @param {string} [opts.version] Version of the Spire api to use
//     @param {string} [opts.timeout] Timeout for requests
var API = function (spire, opts) {
  this.spire = spire;

  opts = opts || {};
  this.url = opts.url || 'https://api.spire.io';
  this.version = opts.version || '1.0';
  this.timeout = opts.timeout || 30 * 1000;

  this.description = null;
  this.schema = null;
};

module.exports = API;

// ## Public Interface

// ### API.prototype.request
// API doesn't inherit from Resource, but it does have requests.  So we just
// copy this one method.  See resource.js for usage
API.prototype.request = Resource.prototype.request;

// ### API.prototype.discover
// Discovers urls from Spire API.  Since this description does not change often,
// we only make the request once and cache the result for subsequent calls.
//
//     @param {function(err, discovered)} cb Callback
API.prototype.discover = function (cb) {
  var api = this;

  if (this.description) {
    return cb(null, this.description);
  }

  this.request('discover', function (err, description) {
    if (err) return cb(err);
    api.description = description;
    api.schema = description.schema[api.version];
    cb(null, description);
  });
};

// ### API.prototype.createSession
// Creates a spire session from an account key.
//
// You should probably call `spire.start` instead of this method.
//
//     @param {string} key The acccount key
//     @param {function(err)} cb Callback
API.prototype.createSession = function (key, cb) {
  var api = this;
  this.request('create_session', key, function (err, sessionData) {
    if (err) return cb(err);
    session = new Session(api.spire, sessionData);
    cb(null, session);
  });
};

// ### API.prototype.login
// Logs in with the given email and password.
//
// You should probably be using `spire.login` instead of this method.
//
//     @param {string} email Email
//     @param {string} password Password
//     @param {function(err)} cb Callback
API.prototype.login = function (email, password, cb) {
  var api = this;
  this.request('login', email, password, function (err, sessionData) {
    if (err) return cb(err);
    session = new Session(api.spire, sessionData);
    cb(null, session);
  });
};

// ### API.prototype.createAccount
// Register for a new spire account, and authenticates as the newly created account
//
// You should probably be using `spire.register` instead of this method.
//
//     @param {object} user User info
//     @param {string} user.email Email
//     @param {string} user.password Password
//     @param {string} [user.password_confirmation] Optional password confirmation
//     @param {function (err)} cb Callback
API.prototype.createAccount = function (info, cb) {
  var api = this;
  this.request('create_account', info, function (err, sessionData) {
    if (err) return cb(err);
    session = new Session(api.spire, sessionData);
    cb(null, session);
  });
};

// ### API.prototype.passwordResetRequest
// Request a password reset for email.
//
// You should probaby be using `spire.passwordResetRequest` instead of this method.
//
//     @param {string} email Email
//     @param {function (err)} cb Callback
API.prototype.passwordResetRequest = function (cb) {
  this.request('password_reset_request', cb);
};

// ### API.prototype.billing
// Get billing information for the account.
//
//     @param {function (err, billingResource)} cb Callback
API.prototype.billing = function (cb) {
  var api = this;
  this.request('billing', function (err, billingData) {
    if (err) return cb(err);
    var billing = new Billing(api.spire, billingData);
    cb(null, billing);
  });
};

// ### API.prototype.mediaType
// Returns the MIME type for resourceName.
//
//     @param {string} [name] Name of the resource MIME type to return
API.prototype.mediaType = function(resourceName){
  return this.schema[resourceName].mediaType;
};

// ### API.prototype.authorization
// Returns the Authorization header for the resource.
//
//     @param {object} resource Resource
API.prototype.authorization = function(resource){
  return ['Capability', resource.capability].join(' ');
};

// ## Requests
// These define API calls and have no side effects.  They can be run by calling
//     this.request(<request name>);

// ### discover
// Gets the api description resource.
Resource.defineRequest(API.prototype, 'discover', function () {
  return {
    method: 'get',
    url: this.url,
    headers: {
      accept: "application/json"
    }
  };
});

// ### create_session
// Post to sessions url with the accont key.
Resource.defineRequest(API.prototype, 'create_session', function (key) {
  var spire = this.spire;
  return {
    method: 'post',
    url: this.description.resources.sessions.url,
    headers: {
      'Content-Type': this.mediaType('account'),
      'Accept': this.mediaType('session')
    },
    content: {key: key}
  }
});

// ### login
// Post to sessions url with email and password.
Resource.defineRequest(API.prototype, 'login', function (email, password) {
  var spire = this.spire;
  return {
    method: 'post',
    url: this.description.resources.sessions.url,
    headers: {
      'Content-Type': this.mediaType('account'),
      'Accept': this.mediaType('session')
    },
    content: {
      email: email,
      password: password
    }
  }
});

// ### create_account
// Posts to accounts url with user info.
Resource.defineRequest(API.prototype, 'create_account', function (account) {
  return {
    method: 'post',
    url: this.description.resources.accounts.url,
    headers: {
      'Content-Type': this.mediaType('account'),
      'Accept': this.mediaType('session')
    },
    content: account,
  };
});

// ### password_reset
// Posts to accounts url with object containing email.
Resource.defineRequest(API.prototype, 'password_reset', function (email) {
  return {
    method: 'post',
    url: this.description.resources.accounts.url,
    content: "",
    query: { email: email }
  };
});

// ### billing
// Gets billing resource.
Resource.defineRequest(API.prototype, 'billing', function () {
  return {
    method: 'get',
    url: this.description.resources.billing.url,
    content: "",
    query: { email: email },
    headers: {
      'Accept': 'application/json'
    }
  };
});

