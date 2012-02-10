var Resource = require('./api/resource')
  , Account = require('./api/account')
  , Billing = require('./api/billing')
  , Channel = require('./api/channel')
  , Session = require('./api/session')
  , Subscription = require('./api/subscription')
  ;

var API = function (spire, opts) {
  this.spire = spire;

  opts |= {};
  this.url = opts.url || 'https://api.spire.io';
  this.version = opts.version || '1.0';
  this.timeout = opts.timout || 30 * 1000;

  this.description = null;
  this.schema = null;
};

module.exports = API;

Resource.defineRequest(API.prototype, 'discover', function () {
  return {
    method: 'get',
    url: this.spire.options.url,
    headers: {
      accept: "application/json"
    }
  };
});

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

Resource.defineRequest(API.prototype, 'login', function (email, password) {
  var spire = this.spire;
  return {
    method: 'post',
    url: spire.resources.sessions.url,
    headers: {
      'Content-Type': spire.headers.mediaType('account'),
      'Accept': spire.headers.mediaType('session')
    },
    content: {
      email: email,
      password: password
    }
  }
});

Resource.defineRequest(API.prototype, 'create_account', function (account) {
  return {
    method: 'post',
    url: this.description.resources.account.url,
    headers: {
      'Content-Type': this.mediaType('account'),
      'Accept': this.mediaType('session')
    },
    content: account,
  };
});

Resource.defineRequest(API.prototype, 'password_reset', function (email) {
  return {
    method: 'post',
    url: this.description.resources.accounts.url,
    content: "",
    query: { email: email }
  };
});

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

API.prototype.request = Resource.prototype.request;

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

API.prototype.createSession = function (key, cb) {
  this.request('create_session', key, function (err, sessionData) {
    if (err) return cb(err);
    session = new Session(api.spire, sessionData);
    cb(null, session);
  });
};

API.prototype.login = function (email, password, cb) {
  this.request('login', email, password, function (err, sessionData) {
    if (err) return cb(err);
    session = new Session(api.spire, sessionData);
    cb(null, session);
  });
};

API.prototype.createAccount = function (info, cb) {
  this.request('create_account', info, function (err, sessionData) {
    if (err) return cb(err);
    session = new Session(api.spire, sessionData);
    cb(null, session);
  });
};

API.prototype.passwordResetRequest = function (cb) {
  this.request('password_reset_request', cb);
};

API.prototype.billing = function (cb) {
  var api = this;
  this.request('billing', function (err, billingData) {
    if (err) return cb(err);
    var billing = new Billing(api.spire, billingData);
    cb(null, billing);
  });
};

// ## API.prototype.mediaType
//
// Generate either a 'content-type' or 'authorization' header, requires a
// string with the name of the resource so it can extract the media type
// from the API's schema.
//
//     spire.api.mediaType('channel');
//     //=> 'application/vnd.spire-io.channel+json;version=1.0'
API.prototype.mediaType = function(resourceName){
  return this.schema[resourceName].mediaType;
};

// ## API.prototype.authorization
//
// Generate the authorization header for a resource with a capability.
// Requires a resource object with a `capability` key.
//
//     authorization = spire.headers.authorization(subscription);
//     //=> 'Capability 5iyTrZrcGw/X4LxhXJRIEn4HwFKSFB+iulVKkUjqxFq30cFBqEm'
//
API.prototype.authorization = function(resource){
  return ['Capability', resource.capability].join(' ');
};
