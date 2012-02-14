/**
 * @fileOverview Session Resource class definition
 */

var Resource = require('./resource')
  , Account = require('./account')
  , Channel = require('./channel')
  , Subscription = require('./subscription')
  , _ = require('underscore')
  ;

/**
 * <p>Represents a session in the spire api.</p>
 *
 * <p>Sessions contain other resources, like channels and subscriptions.  These
 * can be accessed in the <code>session.resources</code> object.</p>
 *
 * <p>One important resource inside <code>session</code> is the account resource
 * <code>session.account</code>, which is only given to sessions authenticated
 * with an email and password.  The account resource is documented in its own
 * class.</p>
 *
 * <p>Session objects maintain lists of channels and subscriptions.  If you call
 * the <code>session.channels</code> or <code>session.subscriptions</code>
 * methods, you will get back cached data if it exists.  Use the <code>$</code>
 * cache-bypass methods: <code>session.channels$</code> and
 * <code>session.subscriptions$</code> to get fresh data from the api.</p>
 *
 * @constructor
 * @extends Resource
 * @param {object} spire Spire object
 * @param {object} data Session data from the spire api
 */
function Session (spire, data) {
  this.spire = spire;
  this.data = data;
  this.resourceName = 'session';

  this._channels = {};
  this._subscriptions = {};

  var resources = {};
  _.each(this.data.resources, function (resource, name) {
    // Turn the account object into an instance of Resource.
    if (name === 'account') {
      resource = new Account(spire, resource);
    }
    resources[name] = resource;
  });

  this.resources = resources;
};

Session.prototype = new Resource();

module.exports = Session;

/**
 * Gets the account resource.  Only available to sessions that are authenticated
 * with an email and password.
 *
 * Returns a value from the cache, if one if available.
 *
 * @example
 * spire.session.account(function (err, account) {
 *   if (!err) {
 *     // `account` is account resource.
 *   }
 * });
 *
 * @param {function (err, account)} cb Callback
 */
Session.prototype.account = function (cb) {
  if (this._account) return cb(null, this._account);
  this.account$(cb);
};

/**
 * Gets the account resource.  Only available to sessions that are authenticated
 * with an email and password.
 *
 * Always gets a fresh value from the api.
 *
 * @example
 * spire.session.account$(function (err, account) {
 *   if (!err) {
 *     // `account` is account resource.
 *   }
 * });
 * @param {function (err, account)} cb Callback
 */
Session.prototype.account$ = function (cb) {
  var session = this;
  this.request('account', function (err, account) {
    if (err) return cb(err);
    session._account = new Account(session.spire, account);
    cb(null, session._account)
  });
};

/**
 * Gets the channels collection.  Returns a hash of Channel resources.
 *
 * Returns a value from the cache, if one if available.
 *
 * @example
 * spire.session.channels(function (err, channels) {
 *   if (!err) {
 *     // `channels` is a hash of all the account's channels
 *   }
 * });
 *
 * @param {function (err, channels)} cb Callback
 */
Session.prototype.channels = function (cb) {
  if (this._channels) return cb(null, this._channels);
  this.channels$(cb);
};

/**
 * Gets the channels collection.  Returns a hasg of Channel resources.
 *
 * Always gets a fresh value from the api.
 *
 * @example
 * spire.session.channels$(function (err, channels) {
 *   if (!err) {
 *     // `channels` is a hash of all the account's channels
 *   }
 * });
 *
 * @param {function (err, channels)} cb Callback
 */
Session.prototype.channels$ = function (cb) {
  var session = this;
  this.request('channels', function (err, channelsData) {
    if (err) return cb(err);
    _.each(channelsData, function (name, channel) {
      session._memoizeChannel(new Channel(session.spire, channel));
    });
    cb(null, session._channels)
  });
};

/**
 * Gets the subscriptions collection.  Returns a hash of Subscription resources.
 *
 * Returns a value from the cache, if one if available.
 *
 * @example
 * spire.session.subscriptions(function (err, subscriptions) {
 *   if (!err) {
 *     // `subscriptions` is a hash of all the account's subscriptions
 *   }
 * });
 *
 * @param {function (err, channels)} cb Callback
 */
Session.prototype.subscriptions = function (cb) {
  if (this._subscriptions) return cb(null, this._subscriptions);
  this.subscriptions$(cb);
};

/**
 * Gets the subscriptions collection.  Returns a hash of Subscription resources.
 *
 * Always gets a fresh value from the api.
 *
 * @example
 * spire.session.subscriptions$(function (err, subscriptions) {
 *   if (!err) {
 *     // `subscriptions` is a hash of all the account's subscriptions
 *   }
 * });
 *
 * @param {function (err, channels)} cb Callback
 */
Session.prototype.subscriptions$ = function (cb) {
  var session = this;
  this.request('subscriptions', function (err, subscriptions) {
    if (err) return cb(err);
    _.each(subscriptions, function (name, subscription) {
      session._memoizeSubscription(new Subscription(session.spire, subscription));
    });
    cb(null, session._subscriptions)
  });
};

/**
 * Creates a channel.  Returns a Channel resource.  Errors if a channel with the
 * specified name exists.
 *
 * @param {string} name Channel name
 * @param {function (err, channel)} cb Callback
 */
Session.prototype.createChannel = function (name, cb) {
  var session = this;
  this.request('create_channel', name, function (err, data) {
    if (err) return cb(err);
    var channel = new Channel(session.spire, data);
    session._memoizeChannel(channel);
    cb(null, channel);
  });
};

/**
 * Creates a subscription to any number of channels.  Returns a Subscription
 * resource.  Errors if a subscription with the specified name exists.
 *
 * @param {string} name Subscription name
 * @param {array} channelNames Array of channel names to subscribe to.  Can be empty.
 * @param {function (err, subscription)} cb Callback
 */
Session.prototype.createSubscription = function (subName, channelNames, cb) {
  var session = this;
  this.channels(function (channels) {
    var channelUrls = _.map(channelNames, function (name) {
      return session._channels[name].url();
    });
    session.request('create_subscription', subName, channelUrls, function (err, sub) {
      if (err) return cb(err);
      var subscription = new Subscription(session.spire, sub);
      session._memoizeSubscription(subscription);
      cb(null, subscription);
    });
  });
};

 /**
 * Stores the channel resource in a hash by its name.
 *
 * @param channel {object} Channel to store
 */
Session.prototype._memoizeChannel = function (channel) {
  this._channels[channel.name()] = channel;
};

/**
 * Stores the subscription resource in a hash by its name.
 *
 * @param subscription {object} Subscription to store
 */
Session.prototype._memoizeSubscription = function (subscription) {
  this._subscriptions[subscription.name()] = subscription;
};

/**
 * Requests
 * These define API calls and have no side effects.  They can be run by calling
 *     this.request(<request name>);
 */

/**
 * Gets the account resource.
 * @name account
 * @ignore
 */
Resource.defineRequest(Session.prototype, 'account', function () {
  var resource = this.resources.account;
  return {
    method: 'get',
    url: resource.url,
    headers: {
      'Authorization': this.authorization(resource),
      'Accept': this.mediaType('account')
    }
  };
});

/**
 * Gets the channels collection.
 * @name channels
 * @ignore
 */
Resource.defineRequest(Session.prototype, 'channels', function () {
  var spire = this.spire;
  var collection = this.resources.channels;
  return {
    method: 'get',
    url: collection.url,
    headers: {
      'Authorization': this.authorization(collection),
      'Accept': this.mediaType('channels')
    }
  };
});

/**
 * Gets a channel by name.  Returns a collection with a single value: { name: channel }.
 * @name channel_by_name
 * @ignore
 */
Resource.defineRequest(Session.prototype, 'channel_by_name', function (name) {
  var spire = this.spire;
  var collection = this.resources.channels;
  return {
    method: 'get',
    url: collection.url,
    query: { name: name },
    headers: {
      'Authorization': this.authorization(collection),
      'Accept': this.mediaType('channels')
    }
  };
});

/**
 * Creates a channel.  Returns a channel object.
 * @name create_channel
 * @ignore
 */
Resource.defineRequest(Session.prototype, 'create_channel', function (name) {
  var spire = this.spire;
  var collection = this.resources.channels;
  return {
    method: 'post',
    url: collection.url,
    content: { name: name },
    headers: {
      'Authorization': this.authorization(collection),
      'Accept': this.mediaType('channel'),
      'Content-Type': this.mediaType('channel')
    }
  };
});

/**
 * Gets the subscriptions collection.
 * @name subscrtiptions
 * @ignore
 */
Resource.defineRequest(Session.prototype, 'subscriptions', function () {
  var spire = this.spire;
  var collection = this.resources.subscriptions;
  return {
    method: 'get',
    url: collection.url,
    headers: {
      'Authorization': this.authorization(collection),
      'Accept': this.mediaType('subscriptions')
    }
  };
});

/**
 * Creates a subscrtiption.  Returns a subscription object.
 * @name create_subscription
 * @ignore
 */
Resource.defineRequest(Session.prototype, 'create_subscription', function (name, channelUrls) {
  var spire = this.spire;
  var collection = this.resources.subscriptions;
  return {
    method: 'post',
    url: collection.url,
    content: {
      name: name,
      channels: channelUrls
    },
    headers: {
      'Authorization': this.authorization(collection),
      'Accept': this.mediaType('subscription'),
      'Content-Type': this.mediaType('subscription')
    }
  };
});

