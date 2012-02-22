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
 * @constructor
 * @param {object} opts Options for Spire
 * @param {string} opts.url Spire url do use (defaults to 'https://api.spire.io')
 * @param {string} opts.version Version of Spire api to use (defaults to '1.0')
 * @param {number} opts.timeout Timeout for requests (defaults to 30 seconds)
 */
var Spire = function (opts) {
  this.api = new API(this, opts);
  this.session = null;
};

module.exports = Spire;

/**
 * Get the account key.
 *
 * @returns {string} Account key
 */
Spire.prototype.key = function () {
  if (this.session && this.session.resources && this.session.resources.account) {
    return this.session.resources.account.key();
  }
  return null;
};

/**
 * Start the Spire session with the given account key.
 *
 * @example
 * var spire = new Spire();
 * spire.start(your_api_key, function (err, session) {
 *   if (!err) {
 *     // You now have a spire session.
 *     // Start creating channels and subscripions.
 *   }
 * });
 *
 * @param {string} key The acccount key
 * @param {function(err)} cb Callback
 */
Spire.prototype.start = function (key, cb) {
  var spire = this;
  this.api.createSession(key, function (err, session) {
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
  if (!this.session) {
    return cb(new Error("You must log in to spire to do this."));
  }

  this.session.resources.account.update(user, cb);
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
 * spire.start(your_api_key, function (err, session) {
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
  if (!this.session) {
    return cb(new Error("You must start spire before you can do this."));
  }

  if (this.session._channels[name]) {
    return cb(null, this.session._channels[name]);
  }
  this._findOrCreateChannel(name, cb);
};

/**
 * Gets a list of all channels.  Will return cached data if it is available,
 * otherwise will make a request.
 *
 * @example
 * var spire = new Spire();
 * spire.start(your_api_key, function (err, session) {
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
  if (!this.session) {
    return cb(new Error("You must start spire before you can do this."));
  }

  this.spire.session.channels(cb);
};

/**
 * Gets a list of all channels.  Ignores any cached data, and forces the
 * request.
 *
 * @example
 * var spire = new Spire();
 * spire.start(your_api_key, function (err, session) {
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
  if (!this.session) {
    return cb(new Error("You must start spire before you can do this."));
  }

  this.spire.session.channels$(cb);
};

/**
 * Gets a subscription to the given channels.  Creates the channels and the
 * subscription if necessary.
 *
 * @example
 * var spire = new Spire();
 * spire.start(your_api_key, function (err, session) {
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
  var channelNames = (typeof channelOrChannels === 'string')
    ? [channelOrChannels]
    : channelOrChannels;

  var spire = this;
  async.forEach(
    channelNames,
    function (channelName, innerCB) {
      spire._findOrCreateChannel(channelName, function (err, channel) {
        if (err) { return cb(err); }
        innerCB();
      });
    },
    function (err) {
      if (err) return cb(err);
      spire._findOrCreateSubscription(name, channelNames, cb);
    }
  );
};

/**
 * Get the subscriptions for an account.  Will return cached data if it is
 * available, otherwise makes a request.
 *
 * @example
 * var spire = new Spire();
 * spire.start(your_api_key, function (err, session) {
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
  if (!this.session) {
    return cb(new Error("You must start spire before you can do this."));
  }

  this.session.subscriptions(cb);
};

/**
 * Get the subscriptions for an account.  Ignores any cached data and always
 * makes a request.
 *
 * @example
 * var spire = new Spire();
 * spire.start(your_api_key, function (err, session) {
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
  if (!this.session) {
    return cb(new Error("You must start spire before you can do this."));
  }

  this.session.subscriptions$(cb);
};

/**
 * Creates an new subscription to a channel or channels, and adds a listener.
 *
 * @example
 * var spire = new Spire();
 * spire.start(your_api_key, function (err, session) {
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
  if (typeof options === 'function') {
    cb = listener;
    listener = options;
  }

  cb = cb || function () {};

  var name = 'anon-' + Date.now() + '-' + Math.random();

  this.subscription(name, channelOrChannels, function (err, subscription) {
    if (err) return cb(err);
    subscription.addListener('messages', listener);
    subscription.startListening(options);
    return cb(null, subscription);
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
 * @param {function (err, subscription)} cb Callback
 */
Spire.prototype.publish = function (channelName, message, cb) {
  var spire = this;
  spire.channel(channelName, function (err, channel) {
    if (err) { return cb(err); }
    channel.publish(message, cb);
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
 * spire.accountFromUrlAndCapability({
 *   url: account_url,
 *   capability: account_capability
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
Spire.prototype.accountFromUrlAndCapability = function (creds, cb) {
  this.api.accountFromUrlAndCapability(creds, cb);
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
 * spire.channelFromUrlAndCapability({
 *   url: channel_url,
 *   capability: channel_capability
 * }, function (err, channel) {
 *   if (!err) {
 *     // ...
 *   }
 * })
 *
 * @param {object} creds Url and Capability
 * @param {string} creds.url Url
 * @param {string} creds.capability Capability
 * @param {function (err, channel)} cb Callback
 */
Spire.prototype.channelFromUrlAndCapability = function (creds, cb) {
  this.api.channelFromUrlAndCapability(creds, cb);
};

/**
 * Get Subscription from url and capability.
 * Use this method to get a subscription without starting a spire session.
 *
 * If you have a spire session, you should use <code>spire.subscription</code>.
 *
 * @example
 * var spire = new Spire();
 * spire.subscriptionFromUrlAndCapability({
 *   url: subscription_url,
 *   capability: subscription_capability
 * }, function (err, subscription) {
 *   if (!err) {
 *     // ...
 *   }
 * })
 *
 * @param {object} creds Url and Capability
 * @param {string} creds.url Url
 * @param {string} creds.capability Capability
 * @param {function (err, subscription)} cb Callback
 */
Spire.prototype.subscriptionFromUrlAndCapability = function (creds, cb) {
  this.subscriptionFromUrlAndCapability(creds, cb);
};

/**
 * Start the Spire session with the url and capability for the session.
 *
 * @example
 * var spire = new Spire();
 * var creds = {
 *   url: session_url,
 *   capability: session_capability
 * };
 * spire._startSessionFromUrlAndCapability(creds, function (err) {
 *   if (!err) {
 *     // You now have a spire session.
 *     // Start creating channels and subscripions.
 *   }
 * });
 *
 * @param {object} creds Url and Capability
 * @param {string} creds.url Url
 * @param {string} creds.capability Capability
 * @param {function (err)} cb Callback
 */
Spire.prototype._startSessionFromUrlAndCapability = function (creds, cb) {
  this.api.sessionFromUrlAndCapability(creds, function (err, session) {
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
  if (!this.session) {
    return cb(new Error("You must start spire before you can do that."));
  }

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
  if (!this.session) {
    return cb(new Error("You must start spire before you can do that."));
  }

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
