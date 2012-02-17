/**
 * @fileOverview API class definition
 */

var Resource = require('./api/resource')
  , Account = require('./api/account')
  , Billing = require('./api/billing')
  , Channel = require('./api/channel')
  , Session = require('./api/session')
  , Subscription = require('./api/subscription')
  ;

/**
 * Abstraction for the Spire API
 *
 * @class Collection of API methods
 *
 * @example
 * var api = new API(options);
 *
 * @constructor
 * @param {object} spire Spire object
 * @param {object} [opts] Options
 * @param {string} [opts.url] Spire api url
 * @param {string} [opts.version] Version of the Spire api to use
 * @param {string} [opts.timeout] Timeout for requests
 */
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


/**
 * Make requests to the api.
 * @function
 * @see Resourse.prototype.request
 */
API.prototype.request = Resource.prototype.request;

/**
 * Discovers urls from Spire API.  Since this description does not change often,
 * we only make the request once and cache the result for subsequent calls.
 *
 * @example
 * api.discover(function (err, discovered) {
 *   if (!err) {
 *     // ...
 *   }
 * });
 *
 * @param {function(err, discovered)} cb Callback
 */
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

/**
 * Creates a spire session from an account key.
 *
 * @param {string} key The acccount key
 * @param {function(err)} cb Callback
 */
API.prototype.createSession = function (key, cb) {
  var api = this;
  this.request('create_session', key, function (err, sessionData) {
    if (err) return cb(err);
    session = new Session(api.spire, sessionData);
    cb(null, session);
  });
};

/**
 * Logs in with the given email and password.
 *
 * @param {string} email Email
 * @param {string} password Password
 * @param {function(err)} cb Callback
 */
API.prototype.login = function (email, password, cb) {
  var api = this;
  this.request('login', email, password, function (err, sessionData) {
    if (err) return cb(err);
    session = new Session(api.spire, sessionData);
    cb(null, session);
  });
};

/**
 * Register for a new spire account, and authenticates as the newly created account
 *
 * @param {object} user User info
 * @param {string} user.email Email
 * @param {string} user.password Password
 * @param {string} [user.password_confirmation] Optional password confirmation
 * @param {function (err)} cb Callback
 */
API.prototype.createAccount = function (info, cb) {
  var api = this;
  this.request('create_account', info, function (err, sessionData) {
    if (err) return cb(err);
    session = new Session(api.spire, sessionData);
    cb(null, session);
  });
};

/**
 * Request a password reset for email.
 *
 * @param {string} email Email
 * @param {function (err)} cb Callback
 */
API.prototype.passwordResetRequest = function (email, cb) {
  this.request('password_reset', email, cb);
};

/**
 * Get billing information for the account.
 *
 * @param {function (err, billingResource)} cb Callback
 */
API.prototype.billing = function (cb) {
  var api = this;
  this.request('billing', function (err, billingData) {
    if (err) return cb(err);
    var billing = new Billing(api.spire, billingData);
    cb(null, billing);
  });
};

/**
 * Get Account from url and capability.
 *
 * @param {object} creds Url and Capability
 * @param {string} creds.url Url
 * @param {string} creds.capability Capability
 * @param {function (err, account)} cb Callback
 */
API.prototype.accountFromUrlAndCapability = function (creds, cb) {
  var account = new Account(this.spire, creds);
  account.get(cb);
};

/**
 * Get Channel from url and capability.
 *
 * @param {object} creds Url and Capability
 * @param {string} creds.url Url
 * @param {string} creds.capability Capability
 * @param {function (err, channel)} cb Callback
 */
API.prototype.channelFromUrlAndCapability = function (creds, cb) {
  var channel = new Channel(this.spire, creds);
  channel.get(cb);
};

/**
 * Get Session from url and capability.
 *
 * @param {object} creds Url and Capability
 * @param {string} creds.url Url
 * @param {string} creds.capability Capability
 * @param {function (err, subscription)} cb Callback
 */
API.prototype.sessionFromUrlAndCapability = function (creds, cb) {
  var session = new Session(this.spire, creds);
  session.get(cb);
};

/**
 * Get Subscription from url and capability.
 *
 * @param {object} creds Url and Capability
 * @param {string} creds.url Url
 * @param {string} creds.capability Capability
 * @param {function (err, subscription)} cb Callback
 */
API.prototype.subscriptionFromUrlAndCapability = function (creds, cb) {
  var subscription = new Subscription(this.spire, creds);
  subscription.get(cb);
};

/**
 * Returns the MIME type for resourceName.
 *
 * @param {string} [name] Name of the resource MIME type to return
 * @returns {string} MIME type of the resource
 */
API.prototype.mediaType = function(resourceName){
  return this.schema[resourceName].mediaType;
};

/**
 * Returns the Authorization header for the resource.
 *
 * @param {Resource} resource Resource
 * @returns {string} Authorization header for the resource
 */
API.prototype.authorization = function(resource){
  return ['Capability', resource.capability].join(' ');
};

/**
 * Requests
 * These define API calls and have no side effects.  They can be run by calling
 *     this.request(<request name>);
 */

/**
 * Gets the api description resource.
 * @name discover
 * @ignore
 */
Resource.defineRequest(API.prototype, 'discover', function () {
  return {
    method: 'get',
    url: this.url,
    headers: {
      accept: "application/json"
    }
  };
});

/**
 * Posts to sessions url with the accont key.
 * @name create_session
 * @ignore
 */
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

/**
 * Posts to sessions url with email and password.
 * @name login
 * @ignore
 */
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

/**
 * Posts to accounts url with user info.
 * @name create_account
 * @ignore
 */
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

/**
 * Posts to accounts url with object containing email.
 * @name password_reset
 * @ignore
 */
Resource.defineRequest(API.prototype, 'password_reset', function (email) {
  return {
    method: 'post',
    url: this.description.resources.accounts.url,
    content: "",
    query: { email: email }
  };
});

/**
 * Gets billing resource.
 * @name billing
 * @ignore
 */
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
