// spire.io.js is a library designed to help you get your client-side web applications up and running with the high level services provided by the spire.io API. This plugin also exposes a methodology for directly interfacing with the spire.io REST interface.

// You can learn more about spire.io and it's services at http://spire.io, or find help with the following things:

// * [source code](http://github.com/spire-io/spire.io.js)
// * [issues](http://github.com/spire-io/spire.io.js/issues)
// * [contact spire.io](http://spire.io/contact.html)

var async = require('async')
  , API = require('./spire/api')
  , Accounts = require('./spire/accounts')
  , Billing = require('./spire/billing')
  , Channels = require('./spire/channels')
  , Subscriptions = require('./spire/subscriptions')
  ;

// How many times we will try to fetch a channel or subscription after
// getting a 409 Conflict.
var RETRY_CREATION_LIMIT = 3

// # Spire
// Creates a new instance of Spire client
//
// @constructor
// @param opts Options for Spire
// @param opts.url Spire url do use (defaults to 'https://api.spire.io')
// @param opts.version Version of Spire api to use (defaults to '1.0')
// @param opts.timeout Timeout for requests (defaults to 30 seconds)
var Spire = function (opts) {
  this.api = new API(spire, opts);

  this.session = null;
};

module.exports = Spire;

// ## Spire.prototype.key
// Returns the account key
Spire.prototype.key = function () {
  this._ensureSession();
  return this.session.resources.account.key;
};

// ## Spire.prototype.discover
// Discovers urls from Spire API
//
// @param cb {function(err, spire)} Callback
Spire.prototype.discover = function (cb) {
  var spire = this;
  API.discover(function (err, discovered) {
    if (err) return cb(err);
    // TODO
    // Instantiate objects and stick em in spire.session
    cb(spire);
  });
};

// ## Spire.prototype.start
// Starts the Spire session with the given account key.
//
// @param key {string} The acccount key
// @param cb {function(err, spire)} Callback
Spire.prototype.start = function (key, cb) {
  var spire = this;
  API.sessions.create(key, function (err, session) {
    if (err) return cb(err);
    spire.session = session;
    cb(null, spire);
  });
};

// ## Spire.prototype.login
// Starts the Spire session with the given username and password
//
// @param email {string}
// @param password {string}
// @param cb {function(err, spire)} Callback
Spire.prototype.login = function (email, password, cb) {
  var spire = this;
  API.sessions.login(email, password, function (err, session) {
    if (err) return cb(err);
    spire.session = session;
    cb(null, spire);
  });
};

// ## Spire.prototype.register
// Register for a new spire account, and authenticates as the newly created account
//
// @param user {object} User info
// @param user.email {string}
// @param user.password {string}
// @param user.password_confirmation {string} (optional)
// @param cb {function (err, spire)}
Spire.prototype.register = function (user, cb) {
  var spire = this;
  API.createAccount(user, function (err, session) {
    if (err) return cb(err);
    spire.session = session;
    cb(null, spire);
  });
};

// ## Spire.prototype.channel
// Gets a channel (creates if necessary)
//
// @param name {string} Channel name to get or create
// @param cb {function(err, channel)} Callback
Spire.prototype.channel = function (name, cb) {
  Channels.findOrCreate(name, cb);
};


// ## Spire.prototype.channels
// Gets all channels for an account
//
// @param cb {function (err, channels)} Callback
Spire.prototype.channels = function (cb) {
  Channels.getAll(cb);
};

// ## Spire.prototype.subscribe
// Create a new subscription for the given channels
//
// @param name {string} Subscription name
// @param channels {array} Channel names for the subscription to listen // on
// @param cb {function (err, subscription)} Callback
Spire.prototype.subscribe = function (name, channels, cb) {
  var spire = this;
  async.forEach(
    channels,
    function (channel, innerCB) {
      spire.channels.findOrCreate(name, innerCB);
    },
    function (err) {
      if (err) return cb(err);
      spire.subscriptions.findOrCreate(name, channels, cb);
    }
  );
};

// ## Spire.prototype.subscriptions
// Get the subscriptions for an account
//
// @param cb {function (err, subscriptions)} Callback
Spire.prototype.subscriptions = function (cb) {
  Subscriptions.getAll(cb);
};

// ## Spire.prototype._hasSession
// Whether or not we have a Spire session.  Can run sync and async.
//
// @private
// @param cb {function(err, bool)} Callback (optional)
Spire.prototype._hasSession = function (cb) {
  var res = !!this.session;
  if (cb) return cb(res);
  return res;
};

// ## Spire.prototype._ensureSession
// Throws (or passes) error if we don't have a session.
//
// @private
// @param cb {function(err)} Callback (optional)
Spire.prototype._ensureSession = function (cb) {
  if (this._hasSession()) return;
  var err = new Error('No session!');
  if (cb) return cb(err);
  throw err;
};
