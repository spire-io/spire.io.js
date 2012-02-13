// spire.io.js is a library designed to help you get your client-side web applications up and running with the high level services provided by the spire.io API. This plugin also exposes a methodology for directly interfacing with the spire.io REST interface.

// You can learn more about spire.io and it's services at http://spire.io, or find help with the following things:

// * [source code](http://github.com/spire-io/spire.io.js)
// * [issues](http://github.com/spire-io/spire.io.js/issues)
// * [contact spire.io](http://spire.io/contact.html)

var async = require('async')
  , API = require('./spire/api')
  ;

var CREATION_RETRY_LIMIT = 5;

// # Spire
// Creates a new instance of Spire client
//
// @constructor
// @param opts Options for Spire
// @param opts.url Spire url do use (defaults to 'https://api.spire.io')
// @param opts.version Version of Spire api to use (defaults to '1.0')
// @param opts.timeout Timeout for requests (defaults to 30 seconds)
var Spire = function (opts) {
  this.api = new API(this, opts);

  this.session = null;
};

module.exports = Spire;

// ## Spire.prototype.key
// Returns the account key
Spire.prototype.__defineGetter__('key', function () {
  if (this.session && this.session.resources && this.session.resources.account) {
    return this.session.resources.account.key;
  }
  return null;
});

// ## Spire.prototype.discover
// Discovers urls from Spire API
//
// @param cb {function(err, discovered)} Callback
Spire.prototype.discover = function (cb) {
  this.api.discover(cb);
};

// ## Spire.prototype.start
// Starts the Spire session with the given account key.
//
// @param key {string} The acccount key
// @param cb {function(err)} Callback
Spire.prototype.start = function (key, cb) {
  var spire = this;
  this.discover(function () {
    spire.api.createSession(key, function (err, session) {
      if (err) return cb(err);
      spire.session = session;
      cb(null);
    });
  });
};

// ## Spire.prototype.login
// Starts the Spire session with the given username and password
//
// @param email {string}
// @param password {string}
// @param cb {function(err)} Callback
Spire.prototype.login = function (email, password, cb) {
  var spire = this;
  this.discover(function () {
    spire.api.login(email, password, function (err, session) {
      if (err) return cb(err);
      spire.session = session;
      cb(null);
    });
  });
};

// ## Spire.prototype.register
// Register for a new spire account, and authenticates as the newly created account
//
// @param user {object} User info
// @param user.email {string}
// @param user.password {string}
// @param user.password_confirmation {string} (optional)
// @param cb {function (err)}
Spire.prototype.register = function (user, cb) {
  var spire = this;
  this.discover(function () {
    spire.api.createAccount(user, function (err, session) {
      if (err) return cb(err);
      spire.session = session;
      cb(null);
    });
  });
};

// ## Spire.prototype.update
// Update your account info
//
// @param user {object} User info
// @param user.email {string}
// @param user.password {string}
// @param user.password_confirmation {string} (optional)
// @param cb {function (err)}
Spire.prototype.update = function (user, cb) {
  this.session.resources.account.update(user, cb);
};

// ## Spire.prototype.passwordResetRequest
// Request a password reset for email
//
// @param email {string}
// @param cb {function (err)}
Spire.prototype.passwordResetRequest = function (email, cb) {
  var spire = this;
  this.discover(function () {
    spire.api.passwordResetRequest(email, cb);
  });
};

// ## Spire.prototype.channel
// Gets a channel (creates if necessary)
//
// @param name {string} Channel name to get or create
// @param cb {function(err, channel)} Callback
Spire.prototype.channel = function (name, cb) {
  if (this.session._channels[name]) {
    return cb(null, this.session._channels[name]);
  }
  this.findOrCreateChannel(name, cb);
};


// ## Spire.prototype.channels
// Gets a list of all channels.  Will return cached data if it is available,
// otherwise will make a request.
//
// @param cb {function (err, channels)} Callback
Spire.prototype.channels = function (cb) {
  this.spire.session.channels(cb);
};

// ## Spire.prototype.channels$
// Gets a list of all channels.  Ignores any cached data, and forces the
// request.
//
// @param cb {function (err, channels)} Callback
Spire.prototype.channels$ = function (cb) {
  this.spire.session.channels$(cb);
};

// ## Spire.prototype.findOrCreateChannel
// Returns the channel with name 'name', creating it if necessary.
//
// @param name {string} Channel name
// @param cb {function (err, channel)} Callback
Spire.prototype.findOrCreateChannel = function (name, cb) {
  var spire = this;
  var creationCount = 0;

  var createChannel = function () {
    creationCount++;
    spire.session.createChannel(name, function (err, channel) {
      if (!err) return cb(null, channel);
      if (err.status !== 409) return cb(err);
      if (creationCount >= CREATION_RETRY_LIMIT) {
        return cb(new Error("Could not create channel: " + name));
      }
      getChannel();
    });
  };

  var getChannel = function () {
    spire.session.channels$(function (err, channels) {
      if (!err && channels[name]) return cb(null, channels[name]);
      if (err && err.status !== 409) return cb(err);
      if (creationCount >= CREATION_RETRY_LIMIT) {
        return cb(new Error("Could not create channel: " + name));
      }
      createChannel();
    });
  };

  createChannel();
};

// ## Spire.prototype.subscribe
// Create a new subscription for the given channels
//
// @param name {string} Subscription name
// @param channelOrChannels {array} Either a single channel name, or an array of
//   channel names to subscribe to
// @param cb {function (err, subscription)} Callback
Spire.prototype.subscribe = function (name, channelOrChannels, cb) {
  var channelNames = (typeof channelOrChannels === 'string')
    ? [channelOrChannels]
    : channelOrChannels;

  var spire = this;
  async.forEach(
    channelNames,
    function (channelName, innerCB) {
      spire.findOrCreateChannel(channelName, function (err, channel) {
        innerCB();
      });
    },
    function (err) {
      if (err) return cb(err);
      spire.findOrCreateSubscription(name, channelNames, cb);
    }
  );
};

// ## Spire.prototype.findOrCreateSubscription
// Returns the subvscription with name 'name', creating it if necessary.
//
// @param name {string} Subscription name
// @param channelNames {string} Channel names
// @param cb {function (err, subscription)} Callback
Spire.prototype.findOrCreateSubscription = function (name, channelNames, cb) {
  var spire = this;
  var creationCount = 0;

  var createSubscription = function () {
    creationCount++;
    spire.session.createSubscription(name, channelNames, function (err, sub) {
      if (!err) return cb(null, sub);
      if (err.status !== 409) return cb(err);
      if (creationCount >= CREATION_RETRY_LIMIT) {
        return cb(new Error("Could not create subscription: " + name));
      }
      getSubscription();
    });
  };

  var getSubscription = function () {
    spire.session.subscriptions$(function (err, subscriptions) {
      if (!err && subscriptions[name]) return cb(null, subscriptions[name]);
      if (err && err.status !== 409) return cb(err);
      if (creationCount >= CREATION_RETRY_LIMIT) {
        return cb(new Error("Could not create subscription: " + name));
      }
      createSubscription();
    });
  };

  createSubscription();
};

// ## Spire.prototype.subscriptions
// Get the subscriptions for an account.  Will return cached data if it is
// available, otherwise makes a request.
//
// @param cb {function (err, subscriptions)} Callback
Spire.prototype.subscriptions = function (cb) {
  this.session.subscriptions(cb);
};

// ## Spire.prototype.subscriptions$
// Get the subscriptions for an account.  Ignores any cached data and always
// makes a request.
//
// @param cb {function (err, subscriptions)} Callback
Spire.prototype.subscriptions$ = function (cb) {
  this.session.subscriptions$(cb);
};
