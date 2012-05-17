/**
 * @fileOverview API class definition
 */

var Resource = require('./api/resource')
  , Account = require('./api/account')
  , Billing = require('./api/billing')
  , Channel = require('./api/channel')
  , Message = require('./api/message')
  , Session = require('./api/session')
  , Subscription = require('./api/subscription')
  , Application = require('./api/application')
  , Member = require('./api/member')
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
function API(spire, opts) {
  this.spire = spire;

  opts = opts || {};
  this.url = opts.url || 'https://api.spire.io';
  this.version = opts.version || '1.0';
  this.timeout = opts.timeout || 30 * 1000;

  this.description = null;
  this.schema = null;
}

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
    return process.nextTick(function () {
      cb(null, api.description);
    });
  }

  this.request('discover', function (err, description) {
    if (err) return cb(err);
    api.description = description;
    api.schema = description.schema[api.version];
    cb(null, description);
  });
};

/**
 * Creates a spire session from an account secret.
 *
 * @param {string} secret The acccount secret
 * @param {function(err)} cb Callback
 */
API.prototype.createSession = function (secret, cb) {
  var api = this;
  this.discover(function (err) {
    if (err) return cb(err);
    api.request('create_session', secret, function (err, sessionData) {
      if (err) return cb(err);
      var session = new Session(api.spire, sessionData);
      cb(null, session);
    });
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
  this.discover(function (err) {
    if (err) return cb(err);
    api.request('login', email, password, function (err, sessionData) {
      if (err) return cb(err);
      var session = new Session(api.spire, sessionData);
      cb(null, session);
    });
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
  this.discover(function (err) {
    if (err) return cb(err);
    api.request('create_account', info, function (err, sessionData) {
      if (err) return cb(err);
      var session = new Session(api.spire, sessionData);
      cb(null, session);
    });
  });
};

/**
 * Request a password reset for email.
 *
 * @param {string} email Email
 * @param {function (err)} cb Callback
 */
API.prototype.passwordResetRequest = function (email, cb) {
  var api = this;
  this.discover(function (err) {
    if (err) return cb(err);
    api.request('password_reset', email, cb);
  });
};

/**
 * Get billing information for the account.
 *
 * @param {function (err, billingResource)} cb Callback
 */
API.prototype.billing = function (cb) {
  var api = this;
  this.discover(function (err) {
    if (err) return cb(err);
    api.request('billing', function (err, billingData) {
      if (err) return cb(err);
      var billing = new Billing(api.spire, billingData);
      cb(null, billing);
    });
  });
};

/**
 * Get Account from url and capabilities.
 *
 * Use this method to get the account without starting a spire session.
 *
 * If you have a spire session, you should use <code>spire.session.account</code>.
 *
 * @example
 * var spire = new Spire();
 * spire.api.accountFromUrlAndCapabilities({
 *   url: account_url,
 *   capabilities: account_capabilities
 * }, function (err, account) {
 *   if (!err) {
 *     // ...
 *   }
 * })
 *
 * @param {object} creds Url and Capabilities
 * @param {string} creds.url Url
 * @param {string} creds.capabilities Capabilities
 * @param {function (err, account)} cb Callback
 */
API.prototype.accountFromUrlAndCapabilities = function (creds, cb) {
  var api = this;
  this.discover(function (err) {
    if (err) return cb(err);
    var account = new Account(api.spire, creds);
    account.get(cb);
  });
};

/**
 * Update Account from url and capability.
 *
 * @param {object} account Must contain at least Url and Capability
 * @param {string} creds.url Url
 * @param {string} creds.capability Capability
 * @param {function (err, account)} cb Callback
 */
API.prototype.updateAccountWithUrlAndCapability = function (accountData, cb) {
  var api = this;
  this.discover(function (err) {
    if (err) return cb(err);
    api.request('update_account', accountData, function (err, acc) {
      if (err) return cb(err);
      var account = new Account(api.spire, acc);
      cb(null, account);
    });
  });
};

/**
 * Get Channel from url and capabilities.
 *
 * Use this method to get a channel without starting a spire session.
 *
 * If you have a spire session, you should use <code>spire.channel</code>.
 *
 * @example
 * var spire = new Spire();
 * spire.api.channelFromUrlAndCapabilities({
 *   url: channel_url,
 *   capabilities: channel_capabilities
 * }, function (err, channel) {
 *   if (!err) {
 *     // ...
 *   }
 * })
 *
 * @param {object} creds Url and Capabilities
 * @param {string} creds.url Url
 * @param {string} creds.capabilities Capabilities
 * @param {function (err, channel)} cb Callback
 */
API.prototype.channelFromUrlAndCapabilities = function (creds, cb) {
  var api = this;
  this.discover(function (err) {
    if (err) return cb(err);
    var channel = new Channel(api.spire, creds);
    channel.getIfCapable(cb);
  });
};

/**
 * Get Session from url and capabilities.
 *
 * @param {object} creds Url and Capabilities
 * @param {string} creds.url Url
 * @param {string} creds.capabilities Capabilities
 * @param {function (err, subscription)} cb Callback
 */
API.prototype.sessionFromUrlAndCapabilities = function (creds, cb) {
  var api = this;
  this.discover(function (err) {
    if (err) return cb(err);
    var session = new Session(api.spire, creds);
    api.spire.session = session;
    session.getIfCapable(cb);
  });
};

/**
 * Get Subscription from url and capabilities.
 *
 * Use this method to get a subscription without starting a spire session.
 *
 * If you have a spire session, you should use <code>spire.subscription</code>.
 *
 * @example
 * var spire = new Spire();
 * spire.api.subscriptionFromUrlAndCapabilities({
 *   url: subscription_url,
 *   capabilities: subscription_capabilities
 * }, function (err, subscription) {
 *   if (!err) {
 *     // ...
 *   }
 * })
 *
 * @param {object} creds Url and Capabilities
 * @param {string} creds.url Url
 * @param {string} creds.capabilities Capabilities
 * @param {function (err, subscription)} cb Callback
 */
API.prototype.subscriptionFromUrlAndCapabilities = function (creds, cb) {
  var api = this;
  this.discover(function (err) {
    if (err) return cb(err);
    var subscription = new Subscription(api.spire, creds);
    process.nextTick(function () {
      cb(null, subscription);
    });
  });
};

/**
 * Returns the MIME type for resourceName.
 *
 * @param {string} [name] Name of the resource MIME type to return
 * @returns {string} MIME type of the resource
 */
API.prototype.mediaType = function (resourceName) {
  if (!this.schema) {
    throw "No description object.  Run `spire.api.discover` first.";
  }

  if (!this.schema[resourceName]) {
    throw "No schema for resource " + resourceName;
  }

  return this.schema[resourceName].mediaType;
};

/**
 * Returns the Authorization header for the resource and method.
 *
 * @param {Resource} resource Resource
 * @param {string} method Method
 * @returns {string} Authorization header for the resource
 */
API.prototype.authorization = function (method, resource) {
  return ['Capability', resource.capabilities[method]].join(' ');
};

/**
 * Returns an application when passed an application key.
 *
 * @param {string} key Application key
 * @param {function(err)} cb Callback
 */
API.prototype.getApplication = function (key, cb) {
  var api = this;
  this.discover(function (err) {
    if (err) return cb(err);
    api.request('get_application', key, function (err, appData) {
      if (err) return cb(err);
      var application = new Application(api.spire, appData);
      cb(null, application);
    });
  });
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
 * Posts to sessions url with the accont secret.
 * @name create_session
 * @ignore
 */
Resource.defineRequest(API.prototype, 'create_session', function (secret) {
  return {
    method: 'post',
    url: this.description.resources.sessions.url,
    headers: {
      'Content-Type': this.mediaType('account'),
      'Accept': this.mediaType('session')
    },
    content: {secret: secret}
  };
});

/**
 * Posts to sessions url with email and password.
 * @name login
 * @ignore
 */
Resource.defineRequest(API.prototype, 'login', function (email, password) {
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
  };
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
    content: account
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
    headers: {
      'Accept': 'application/json'
    }
  };
});

/**
 * Updates (puts) to the resouce.
 * @name update
 * @ignore
 */
Resource.defineRequest(API.prototype, 'update_account', function (data) {
  return {
    method: 'put',
    url: data.url,
    content: data,
    headers: {
      'Authorization': "Capability " + data.capability,
      'Accept': this.mediaType('account'),
      'Content-Type': this.mediaType('account')
    }
  };
});

/**
 * Gets an application resource.
 * @name application
 * @ignore
 */
Resource.defineRequest(API.prototype, 'get_application', function (app_key) {
  return {
    method: 'get',
    url: this.description.resources.applications.url,
    content: "",
    query: { application_key: app_key },
    headers: {
      'Accept': this.mediaType('applications'),
      'Content-Type': this.mediaType('applications')
    }
  };
});
