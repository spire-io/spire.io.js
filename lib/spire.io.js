// spire.io.js is a library designed to help you get your client-side web
// applications up and running with the high level services provided by the
// spire.io API. This plugin also exposes a methodology for directly interfacing
// with the spire.io REST interface.

// You can learn more about spire.io and it's services at http://spire.io, or
// find help with the following things:

// * [source code](http://github.com/spire-io/spire.io.js)
// * [issues](http://github.com/spire-io/spire.io.js/issues)
// * [contact spire.io](http://spire.io/contact.html)

var async = require('async')
  , API = require('./spire/api')
  ;


// # Spire
// Creates a new instance of Spire client.
//
// Usage:
//     var spire = new Spire();
//
// @constructor
// @param {object} opts Options for Spire
// @param {string} opts.url Spire url do use (defaults to 'https://api.spire.io')
// @param {string} opts.version Version of Spire api to use (defaults to '1.0')
// @param {number} opts.timeout Timeout for requests (defaults to 30 seconds)
var Spire = function (opts) {
  this.api = new API(this, opts);
  this.session = null;
};

module.exports = Spire;

// Spire.prototype.CREATION_RETRY_LIMIT
// Number of times to retry creating a channel or subscription before giving up.
Spire.prototype.CREATION_RETRY_LIMIT = 5;

// ## Public Interface

// ### Spire.prototype.key
// Returns the account key.
Spire.prototype.key = function () {
  if (this.session && this.session.resources && this.session.resources.account) {
    return this.session.resources.account.key();
  }
  return null;
};

// ### Spire.prototype.discover
// Discovers urls from Spire API.
//
// @param {function(err, discovered)} cb Callback
Spire.prototype.discover = function (cb) {
  this.api.discover(cb);
};

// ### Spire.prototype.start
// Starts the Spire session with the given account key.
//
// Usage:
//     var spire = new Spire();
//     spire.stark(your_api_key, function (err, session) {
//       if (!err) {
//         // You now have a spire session.  Start creating channels and subscripions.
//       }
//     });
//
// @param {string} key The acccount key
// @param {function(err)} cb Callback
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

// ### Spire.prototype.login
// Starts the Spire session with the given username and password.
//
// Usage:
//     var spire = new Spire();
//     spire.login({
//       email: 'you@email.com',
//       password: your_password
//     }, function (err, session) {
//       if (!err) {
//         // You now have a spire session.  Start creating channels and subscripions.
//       }
//     });
//
// @param {string} email Email
// @param {string} password Password
// @param {function(err)} cb Callback
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

// ### Spire.prototype.register
// Register for a new spire account, and authenticates as the newly created account
//
// Usage:
//     var spire = new Spire();
//     spire.register({
//       email: 'you@email.com',
//       password: your_password,
//       password_confirmation: your_password_confirmation
//     }, function (err, session) {
//       if (!err) {
//         // Your account has been registered, and you now have a spire session.  Start creating channels and subscripions.
//       }
//     });
//
// @param {object} user User info
// @param {string} user.email Email
// @param {string} user.password Password
// @param {string} [user.password_confirmation] Optional password confirmation
// @param {function (err)} cb Callback
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

// ### Spire.prototype.update
// Update your account info.
//
// Usage:
//     var spire = new Spire();
//     spire.update({
//       email: 'new_you@new_email.com',
//     }, function (err, session) {
//       if (!err) {
//         // Your account has been updated.
//       }
//     });
//
// @param {object} user User info
// @param {string} user.email Email
// @param {string} user.password Password
// @param {string} [user.password_confirmation] Optional password confirmation
// @param {function (err)} cb Callback
Spire.prototype.update = function (user, cb) {
  this.session.resources.account.update(user, cb);
};

// ### Spire.prototype.passwordResetRequest
// Request a password reset for email.
//
// Usage:
//     var spire = new Spire();
//     spire.passwordResetRequest({
//       email: 'you@email.com',
//     }, function (err, session) {
//       if (!err) {
//         // A password reset email has been sent.
//       }
//     });
//
// @param {string} email Email
// @param {function (err)} cb Callback
Spire.prototype.passwordResetRequest = function (email, cb) {
  var spire = this;
  this.discover(function () {
    spire.api.passwordResetRequest(email, cb);
  });
};

// ### Spire.prototype.channel
// Gets a channel (creates if necessary).
//
// Usage:
//     var spire = new Spire();
//     spire.start(your_api_key, function (err, session) {
//       spire.channel('foo', function (err, channel) {
//         if (!err) {
//           // `channel` is the channel named "foo".
//         }
//       });
//     });
//
// @param {string} name Channel name to get or create
// @param {function(err, channel)} cb Callback
Spire.prototype.channel = function (name, cb) {
  if (this.session._channels[name]) {
    return cb(null, this.session._channels[name]);
  }
  this._findOrCreateChannel(name, cb);
};

// ### Spire.prototype.channels
// Gets a list of all channels.  Will return cached data if it is available,
// otherwise will make a request.
//
// Usage:
//     var spire = new Spire();
//     spire.start(your_api_key, function (err, session) {
//       spire.channels(function (err, channels) {
//         if (!err) {
//           // `channels` is a hash of all the account's channels
//         }
//       });
//     });
//
// @param {function (err, channels)} cb Callback
Spire.prototype.channels = function (cb) {
  this.spire.session.channels(cb);
};

// ### Spire.prototype.channels$
// Gets a list of all channels.  Ignores any cached data, and forces the
// request.
//
// Usage is same as Spire.prototype.channels
//
// @param {function (err, channels)} cb Callback
Spire.prototype.channels$ = function (cb) {
  this.spire.session.channels$(cb);
};

// ### Spire.prototype.subscribe
// Gets a subscription to the given channels.  Creates the channels and the
// subscription if necessary.
//
// Usage:
//     var spire = new Spire();
//     spire.start(your_api_key, function (err, session) {
//       spire.subscribe('mySubscription', ['foo', 'bar'], function (err, subscription) {
//         if (!err) {
//           // `subscription` is a subscription named 'mySubscription', listening on channels named 'foo' and 'bar'.
//         }
//       });
//     });
//
// @param {string} Subscription name
// @param {array or string} channelOrChannels Either a single channel name, or an array of
//   channel names to subscribe to
// @param {function (err, subscription)} cb Callback
Spire.prototype.subscribe = function (name, channelOrChannels, cb) {
  var channelNames = (typeof channelOrChannels === 'string')
    ? [channelOrChannels]
    : channelOrChannels;

  var spire = this;
  async.forEach(
    channelNames,
    function (channelName, innerCB) {
      spire._findOrCreateChannel(channelName, function (err, channel) {
        innerCB();
      });
    },
    function (err) {
      if (err) return cb(err);
      spire._findOrCreateSubscription(name, channelNames, cb);
    }
  );
};

// ### Spire.prototype.subscriptions
// Get the subscriptions for an account.  Will return cached data if it is
// available, otherwise makes a request.
//
// Usage:
//     var spire = new Spire();
//     spire.start(your_api_key, function (err, session) {
//       spire.subscriptions(function (err, subscriptions) {
//         if (!err) {
//           // `subscriptions` is a hash of all the account's subscriptions
//         }
//       });
//     });
//
// @param {function (err, subscriptions)} cb Callback
Spire.prototype.subscriptions = function (cb) {
  this.session.subscriptions(cb);
};

// ### Spire.prototype.subscriptions$
// Get the subscriptions for an account.  Ignores any cached data and always
// makes a request.
//
// Usage is the same as Spire.prototype.subscriptions.
//
// @param {function (err, subscriptions)} cb Callback
Spire.prototype.subscriptions$ = function (cb) {
  this.session.subscriptions$(cb);
};

// ## Private Interface

// ### Spire.prototype._findOrCreateChannel
// Returns the channel with name 'name', creating it if necessary.
//
// You should use `Spire.prototype.channel` method instead of this one.  This
// method ignores cached channels.
//
// @param {string} name Channel name
// @param {function (err, channel)} cb Callback
Spire.prototype._findOrCreateChannel = function (name, cb) {
  var spire = this;
  var creationCount = 0;

  var createChannel = function () {
    creationCount++;
    spire.session.createChannel(name, function (err, channel) {
      if (!err) return cb(null, channel);
      if (err.status !== 409) return cb(err);
      if (creationCount >= spire.CREATION_RETRY_LIMIT) {
        return cb(new Error("Could not create channel: " + name));
      }
      getChannel();
    });
  };

  var getChannel = function () {
    spire.session.channels$(function (err, channels) {
      if (!err && channels[name]) return cb(null, channels[name]);
      if (err && err.status !== 409) return cb(err);
      createChannel();
    });
  };

  createChannel();
};

// ### Spire.prototype.findOrCreateSubscription
// Returns the subvscription with name 'name', creating it if necessary.
//
// You should use `Spire.prototype.subscribe` method instead of this one.  This
// method ignores cached subscriptions, and does not create the channels.
//
// @param {string} name Subscription name
// @param {string} channelNames Channel names
// @param {function (err, subscription)} cb Callback
Spire.prototype._findOrCreateSubscription = function (name, channelNames, cb) {
  var spire = this;
  var creationCount = 0;

  var createSubscription = function () {
    creationCount++;
    spire.session.createSubscription(name, channelNames, function (err, sub) {
      if (!err) return cb(null, sub);
      if (err.status !== 409) return cb(err);
      if (creationCount >= spire.CREATION_RETRY_LIMIT) {
        return cb(new Error("Could not create subscription: " + name));
      }
      getSubscription();
    });
  };

  var getSubscription = function () {
    spire.session.subscriptions$(function (err, subscriptions) {
      if (!err && subscriptions[name]) return cb(null, subscriptions[name]);
      if (err && err.status !== 409) return cb(err);
      createSubscription();
    });
  };

  createSubscription();
};

