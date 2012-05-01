/**
 * @overview <p>Spire API Client</p>
 *
 * <p>spire.io.js is a library designed to help you get your client-side web
 * applications up and running with the high level services provided by the
 * spire.io API. This plugin also exposes a methodology for directly interfacing
 * with the spire.io REST interface.</p>
 *
 * <p>You can learn more about spire.io and it's services at http://spire.io, or
 * find help with the following things:</p>
 *
 * <ul>
 *   <li>source code: http://github.com/spire-io/spire.io.js</li>
 *   <li>issues: http://github.com/spire-io/spire.io.js/issues</li>
 *   <li>contact: http://spire.io/contact.htms</li>
 * </ul>
 */

var async = require('async')
  , API = require('./spire/api')
  ;

/**
 * Spire API Client
 *
 * @class <strong>Spire API Client</strong>
 *
 * @example
 * var spire = new Spire();
 *
 * @example
 * var spire = new Spire({
 *   secret: my_account_secret
 * });
 *
 * @constructor
 * @param {object} [opts] Options for Spire
 * @param {string} [secret] The account API secret.  If you do you not set this, you
 * must call one of:
 *   * `spire.start(secret, callback)`
 *   * `spire.login(email, password, callback)` or
 *   * `spire.register(user, callback)
 *   before you can start creating channels.
 * @param {string} [opts.url] Spire url do use (defaults to 'https://api.spire.io')
 * @param {string} opts.version Version of Spire api to use (defaults to '1.0')
 * @param {number} opts.timeout Timeout for requests (defaults to 30 seconds)
 */
function Spire(opts) {
  opts = opts || {};
  this.api = new API(this, opts);
  this.session = null;
  this._opts_secret = opts.secret;
}

module.exports = Spire;

/**
 * Get the account secret.
 *
 * @returns {string} Account secret
 */
Spire.prototype.secret = function () {
  this._ensureSession();
  if (this.session && this.session.resources && this.session.resources.account) {
    return this.session.resources.account.secret();
  }
  return null;
};

/**
 * Start the Spire session with the given account secret.
 *
 * @example
 * var spire = new Spire();
 * spire.start(your_api_secret, function (err, session) {
 *   if (!err) {
 *     // You now have a spire session.
 *     // Start creating channels and subscripions.
 *   }
 * });
 *
 * @param {string} secret The acccount secret
 * @param {function(err)} cb Callback
 */
Spire.prototype.start = function (secret, cb) {
  var spire = this;
  this.api.createSession(secret, function (err, session) {
    if (err) return cb(err);
    spire.session = session;
    cb(null);
  });
};

/**
 * Start the Spire session with the given username and password.
 *
 * @example
 * var spire = new Spire();
 * spire.login(your_email, your_password, function (err) {
 *   if (!err) {
 *     // You now have a spire session.
 *     // Start creating channels and subscripions.
 *   }
 * });
 *
 * @param {string} email Email
 * @param {string} password Password
 * @param {function(err)} cb Callback
 */
Spire.prototype.login = function (email, password, cb) {
  var spire = this;
  this.api.login(email, password, function (err, session) {
    if (err) return cb(err);
    spire.session = session;
    cb(null);
  });
};

/**
 * Registers for a new spire account, and authenticates as the newly created account
 *
 * @example
 * var spire = new Spire();
 * spire.register({
 *   email: your_email,
 *   password: your_password,
 *   password_confirmation: your_password_confirmation
 * }, function (err) {
 *   if (!err) {
 *     // Your account has been registered,
 *     // and you now have a spire session.
 *     // Start creating channels and subscripions.
 *   }
 * });
 *
 * @param {object} user User info
 * @param {string} user.email Email
 * @param {string} user.password Password
 * @param {string} [user.password_confirmation] Optional password confirmation
 * @param {function (err)} cb Callback
 */
Spire.prototype.register = function (user, cb) {
  var spire = this;
  this.api.createAccount(user, function (err, session) {
    if (err) return cb(err);
    spire.session = session;
    cb(null);
  });
};

/**
 * Updates your account info.
 *
 * @example
 * var spire = new Spire();
 * spire.update({
 *   email: your_new_email
 * }, function (err, account) {
 *   if (!err) {
 *     // Your account has been updated.
 *   }
 * });
 *
 * @param {object} user User info
 * @param {string} user.email Email
 * @param {string} user.password Password
 * @param {string} [user.password_confirmation] Optional password confirmation
 * @param {function (err)} cb Callback
 */
Spire.prototype.update = function (user, cb) {
  var spire = this;
  this._ensureSession(function (err) {
    if (err) return cb(err);
    spire.session.resources.account.update(user, cb);
  });
};

/**
 * Requests a password reset for email.
 *
 * @example
 * var spire = new Spire();
 * spire.passwordResetRequest(your_email, function (err) {
 *   if (!err) {
 *     // A password reset email has been sent.
 *   }
 * });
 *
 * @param {string} email Email
 * @param {function (err)} cb Callback
 */
Spire.prototype.passwordResetRequest = function (email, cb) {
  this.api.passwordResetRequest(email, cb);
};

/**
 * Gets a channel (creates if necessary).
 *
 * @example
 * var spire = new Spire();
 * spire.start(your_api_secret, function (err, session) {
 *   spire.channel('foo', function (err, channel) {
 *     if (!err) {
 *       // `channel` is the channel named "foo".
 *     }
 *   });
 * });
 *
 * @param {string} name Channel name to get or create
 * @param {function(err, channel)} cb Callback
 */
Spire.prototype.channel = function (name, cb) {
  var spire = this;
  this._ensureSession(function (err) {
    if (err) return cb(err);

    if (spire.session._channels[name]) {
      return cb(null, spire.session._channels[name]);
    }
    spire._findOrCreateChannel(name, cb);
  });
};

/**
 * Gets a list of all channels.  Will return cached data if it is available,
 * otherwise will make a request.
 *
 * @example
 * var spire = new Spire();
 * spire.start(your_api_secret, function (err, session) {
 *   spire.channels(function (err, channels) {
 *     if (!err) {
 *       // `channels` is a hash of all the account's channels
 *     }
 *   });
 * });
 *
 * @param {function (err, channels)} cb Callback
 */
Spire.prototype.channels = function (cb) {
  var spire = this;
  this._ensureSession(function (err) {
    if (err) return cb(err);
    spire.session.channels(cb);
  });
};

/**
 * Gets a list of all channels.  Ignores any cached data, and forces the
 * request.
 *
 * @example
 * var spire = new Spire();
 * spire.start(your_api_secret, function (err, session) {
 *   spire.channels$(function (err, channels) {
 *     if (!err) {
 *       // `channels` is a hash of all the account's channels
 *     }
 *   });
 * });
 *
 * @param {function (err, channels)} cb Callback
 */
Spire.prototype.channels$ = function (cb) {
  var spire = this;
  this._ensureSession(function (err) {
    if (err) return cb(err);
    spire.session.channels$(cb);
  });
};

/**
 * Gets a subscription to the given channels.  Creates the channels and the
 * subscription if necessary.
 *
 * @example
 * var spire = new Spire();
 * spire.start(your_api_secret, function (err, session) {
 *   spire.subscription('mySubscription', ['foo', 'bar'], function (err, subscription) {
 *     if (!err) {
 *       // `subscription` is a subscription named 'mySubscription', listening on channels named 'foo' and 'bar'.
 *     }
 *   });
 * });
 *
 * @param {string} Subscription name
 * @param {array or string} channelOrChannels Either a single channel name, or an array of
 *   channel names to subscribe to
 * @param {function (err, subscription)} cb Callback
 */
Spire.prototype.subscription = function (name, channelOrChannels, cb) {
  var channelNames = (typeof channelOrChannels === 'string') ?
    [channelOrChannels] : channelOrChannels;

  var spire = this;
  this._ensureSession(function (err) {
    if (err) return cb(err);
    async.forEach(
      channelNames,
      function (channelName, innerCB) {
        spire._findOrCreateChannel(channelName, innerCB);
      },
      function (err) {
        if (err) return cb(err);
        spire._findOrCreateSubscription(name, channelNames, cb);
      }
    );
  });
};

/**
 * Get the subscriptions for an account.  Will return cached data if it is
 * available, otherwise makes a request.
 *
 * @example
 * var spire = new Spire();
 * spire.start(your_api_secret, function (err, session) {
 *   spire.subscriptions(function (err, subscriptions) {
 *     if (!err) {
 *       // `subscriptions` is a hash of all the account's subscriptions
 *     }
 *   });
 * });
 *
 * @param {function (err, subscriptions)} cb Callback
 */
Spire.prototype.subscriptions = function (cb) {
  var spire = this;
  this._ensureSession(function (err) {
    if (err) return cb(err);
    spire.session.subscriptions(cb);
  });
};

/**
 * Get the subscriptions for an account.  Ignores any cached data and always
 * makes a request.
 *
 * @example
 * var spire = new Spire();
 * spire.start(your_api_secret, function (err, session) {
 *   spire.subscriptions$(function (err, subscriptions) {
 *     if (!err) {
 *       // `subscriptions` is a hash of all the account's subscriptions
 *     }
 *   });
 * });
 *
 * @param {function (err, subscriptions)} cb Callback
 */
Spire.prototype.subscriptions$ = function (cb) {
  var spire = this;
  this._ensureSession(function (err) {
    if (err) return cb(err);
    spire.session.subscriptions$(cb);
  });
};

/**
 * Creates an new subscription to a channel or channels, and adds a listener.
 *
 * @example
 * var spire = new Spire();
 * spire.start(your_api_secret, function (err, session) {
 *   spire.subscribe('myChannel', options, function (messages) {
 *     // `messages` is array of messages sent to the channel
 *   }, function (err) {
 *   // `err` will be non-null if there was a problem creating the subscription.
 * });
 *
 * @param {array or string} channelOrChannels Either a single channel name, or an array of
 *   channel names to subscribe to
 * @param {object} [options] Options to pass to the listener
 * @param {function (messages)} listener Listener that will get called with each batch of messages
 * @param {function (err, subscription)} [cb] Callback
 */
Spire.prototype.subscribe = function (channelOrChannels, options, listener, cb) {
  var spire = this;
  if (typeof options === 'function') {
    cb = listener;
    listener = options;
    options = {}
  }


  cb = cb || function () {};

  var name = 'anon-' + Date.now() + '-' + Math.random();

  this._ensureSession(function (err) {
    if (err) return cb(err);
    spire.subscription(name, channelOrChannels, function (err, subscription) {
      if (err) return cb(err);
      subscription.addListener('messages', listener);
      subscription.startListening(options);
      process.nextTick(function () {
        cb(null, subscription);
      });
    });
  });
};

/**
 * Publish to a channel.
 *
 * Creates the channel if necessary.
 *
 * @example
 * var spire = new Spire();
 * spire.publish('my_channel', 'my message', function (err, message) {
 *   if (!err) {
 *     //  Message sent successfully
 *   }
 * });
 *
 * @param {string} channelName Channel name
 * @param {object, string} message Message
 * @param {function (err, message)} cb Callback
 */
Spire.prototype.publish = function (channelName, message, cb) {
  var spire = this;
  this._ensureSession(function (err) {
    if (err) return cb(err);
    spire.channel(channelName, function (err, channel) {
      if (err) { return cb(err); }
      channel.publish(message, cb);
    });
  });
};

/**
 * Get Account from url and capability.
 *
 * Use this method to get the account without starting a spire session.
 *
 * If you have a spire session, you should use <code>spire.session.account</code>.
 *
 * @example
 * var spire = new Spire();
 * spire.accountFromUrlAndCapabilities({
 *   url: account_url,
 *   capabilities: account_capabilities
 * }, function (err, account) {
 *   if (!err) {
 *     // ...
 *   }
 * })
 *
 * @param {object} creds Url and Capability
 * @param {string} creds.url Url
 * @param {string} creds.capability Capability
 * @param {function (err, account)} cb Callback
 */
Spire.prototype.accountFromUrlAndCapabilities = function (creds, cb) {
  this.api.accountFromUrlAndCapabilities(creds, cb);
};

/**
 * Get Channel from url and capability.
 *
 * Use this method to get a channel without starting a spire session.
 *
 * If you have a spire session, you should use <code>spire.channel</code>.
 *
 * @example
 * var spire = new Spire();
 * spire.channelFromUrlAndCapabilities({
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
Spire.prototype.channelFromUrlAndCapabilities = function (creds, cb) {
  this.api.channelFromUrlAndCapabilities(creds, cb);
};

/**
 * Get Subscription from url and capabilities.
 * Use this method to get a subscription without starting a spire session.
 *
 * If you have a spire session, you should use <code>spire.subscription</code>.
 *
 * @example
 * var spire = new Spire();
 * spire.subscriptionFromUrlAndCapabilities({
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
Spire.prototype.subscriptionFromUrlAndCapabilities = function (creds, cb) {
  this.api.subscriptionFromUrlAndCapabilities(creds, cb);
};

/**
 * Start the Spire session with the url and capabilities for the session.
 *
 * @example
 * var spire = new Spire();
 * var creds = {
 *   url: session_url,
 *   capabilities: session_capabilities
 * };
 * spire._startSessionFromUrlAndCapabilities(creds, function (err) {
 *   if (!err) {
 *     // You now have a spire session.
 *     // Start creating channels and subscripions.
 *   }
 * });
 *
 * @param {object} creds Url and Capabilities
 * @param {string} creds.url Url
 * @param {string} creds.capabilities Capabilities
 * @param {function (err)} cb Callback
 */
Spire.prototype._startSessionFromUrlAndCapabilities = function (creds, cb) {
  var spire = this;
  this.api.sessionFromUrlAndCapabilities(creds, function (err, session) {
    if (err) return cb(err);
    spire.session = session;
    cb(null);
  });
};

/**
 * Number of times to retry creating a channel or subscription before giving up.
 */
Spire.prototype.CREATION_RETRY_LIMIT = 5;

/**
 * Returns the channel with name 'name', creating it if necessary.
 * You should use `Spire.prototype.channel` method instead of this one.  This
 * method ignores cached channels.
 *
 * @param {string} name Channel name
 * @param {function (err, channel)} cb Callback
 */
Spire.prototype._findOrCreateChannel = function (name, cb) {
  var spire = this;
  var creationCount = 0;

  function createChannel() {
    creationCount++;
    spire.session.createChannel(name, function (err, channel) {
      if (!err) return cb(null, channel);
      if (err.status !== 409) return cb(err);
      if (creationCount >= spire.CREATION_RETRY_LIMIT) {
        return cb(new Error("Could not create channel: " + name));
      }
      getChannel();
    });
  }

  function getChannel() {
    spire.session.channelByName(name, function (err, channel) {
      if (err && err.status !== 404) return cb(err);
      if (channel) return cb(null, channel);
      createChannel();
    });
  }

  this._ensureSession(function (err) {
    if (err) return cb(err);
    getChannel();
  });
};

/**
 * Returns the subvscription with name 'name', creating it if necessary.
 * You should use `Spire.prototype.subscribe` method instead of this one.  This
 * method ignores cached subscriptions, and does not create the channels.
 *
 * @param {string} name Subscription name
 * @param {string} channelNames Channel names
 * @param {function (err, subscription)} cb Callback
 */
Spire.prototype._findOrCreateSubscription = function (name, channelNames, cb) {
  var spire = this;
  var creationCount = 0;

  function createSubscription() {
    creationCount++;
    spire.session.createSubscription({
      name: name,
      channelNames: channelNames
    }, function (err, sub) {
      if (!err) return cb(null, sub);
      if (err.status !== 409) return cb(err);
      if (creationCount >= spire.CREATION_RETRY_LIMIT) {
        return cb(new Error("Could not create subscription: " + name));
      }
      getSubscription();
    });
  }

  function getSubscription() {
    spire.session.subscriptionByName(name, function (err, subscription) {
      if (err && err.status !== 404) return cb(err);
      if (subscription) return cb(null, subscription);
      createSubscription();
    });
  }

  this._ensureSession(function (err) {
    if (err) return cb(err);
    createSubscription();
  });
};

function NoSessionError(message) {
  this.name = "No Session Error";
  this.message = message ||
    "You need a Spire session to do that.\n" +
    "Call one of:\n" +
    "spire.start(callback)\n" +
    "spire.login(email, password, callback)\n" +
    "spire.register(user, callback)\n";
}

NoSessionError.prototype = new Error();
NoSessionError.constructor = NoSessionError;

Spire.prototype._ensureSession = function (cb) {
  if (this.session) {
    if (cb) return cb(null);
    return;
  }

  if (!this._opts_secret) {
    var noSessionError = new NoSessionError();
    if (cb) return cb(noSessionError);
    throw noSessionError;
  }

  if (!cb) {
    throw new NoSessionError();
  }

  this.start(this._opts_secret, cb);
};


