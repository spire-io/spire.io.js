/**
 * @fileOverview Application Resource class definition
 */
var Resource = require('./resource')
  , Account = require('./account')
  , Channel = require('./channel')
  , Subscription = require('./subscription')
  , Member = require('./member')
  , _ = require('underscore')
  ;

/**
 * Represents an application in the spire api.
 *
 * @class Application Resource
 *
 * @constructor
 * @extends Resource
 * @param {object} spire Spire object
 * @param {object} data  Application data from the spire api
 */
function Application(spire, data) {
  this.spire = spire;
  this.data = data;
  this.resourceName = 'application';
  
  this._channels = {};
  this._subscriptions = {};
  this._members = {};
  this._storeResources();
}

Application.prototype = new Resource();

module.exports = Application;

/**
 * Returns the application name.
 *
 * @returns {string} Application name
 */
Application.prototype.name = function () {
  return this.data.name;
};

/**
 * Gets the members collection.  Returns a hash of Member resources.
 *
 * Returns a value from the cache, if one if available.
 *
 * @example
 * application.members(function (err, members) {
 *   if (!err) {
 *     // `members` is a hash of all the applications's members
 *   }
 * });
 *
 * @param {function (err, members)} cb Callback
 */
Application.prototype.members = function (cb) {
  if (!_.isEmpty(this._members)) return cb(null, this._members);
  this.members$(cb);
};

/**
 * Gets the members collection.  Returns a hash of Members resources.
 *
 * Always gets a fresh value from the api.
 *
 * @example
 * application.members$(function (err, members) {
 *   if (!err) {
 *     // `members` is a hash of all the applications's members
 *   }
 * });
 *
 * @param {function (err, members)} cb Callback
 */
Application.prototype.members$ = function (cb) {
  var application = this;
  this.request('members', function (err, membersData) {
    if (err) return cb(err);
    _.each(membersData, function (member, name) {
      application._memoizeMember(new Member(application.spire, member));
    });
    cb(null, application._members);
  });
};

/**
 * Creates a member.  Returns a Member resource.  Errors if a member with the
 * specified login exists.
 *
 * @param {string} login Member login
 * @param {string} password Member password
 * @param {function (err, member)} cb Callback
 */
Application.prototype.createMember = function (login, password, cb) {
  var application = this;
  var params = {
    login: login,
    password: password
  }
  this.request('create_member', params, function (err, data) {
    if (err) return cb(err);
    var member = new Member(application.spire, data);
    application._memoizeMember(member);
    cb(null, member);
  });
};

/**
 * Authenticates a member.  Returns a Member resource.  Error if authenication fails.
 *
 * @param {string} login Member login
 * @param {string} password Member password
 * @param {function (err, member)} cb Callback
 */
Application.prototype.authenticateMember = function (login, password, cb) {
  var application = this;
  var params = {
    login: login,
    password: password
  }
  this.request('authenticate_member', params, function (err, data) {
    if (err) return cb(err);
    var member = new Member(application.spire, data);
    application._memoizeMember(member);
    cb(null, member);
  });
};

/**
 * Gets a member by login.  Returns a Member resource
 *
 * Always gets a fresh value from the api.
 *
 * @example
 * spire.session.memberByEmail('login_of_member', function (err, member) {
 *   if (!err) {
 *     // `member` now contains a member object
 *   }
 * });
 *
 * @param {String} memberEmail Email of member
 * @param {function (err, member)} cb Callback
 */
Application.prototype.memberByEmail = function (memberEmail, cb) {
  var application = this;
  this.request('member_by_login', function (err, memberData) {
    if (err) return cb(err);
    member = new Member(application.spire, memberData[memberEmail]);
    application._memoizeMember(member);
    cb(null, member);
  });
};

/**
 * Gets the channels collection.  Returns a hash of Channel resources.
 *
 * Returns a value from the cache, if one if available.
 *
 * @example
 * application.channels(function (err, channels) {
 *   if (!err) {
 *     // `channels` is a hash of all the applications's channels
 *   }
 * });
 *
 * @param {function (err, channels)} cb Callback
 */
Application.prototype.channels = function (cb) {
  if (!_.isEmpty(this._channels)) return cb(null, this._channels);
  this.channels$(cb);
};

/**
 * Gets the channels collection.  Returns a hash of Channel resources.
 *
 * Always gets a fresh value from the api.
 *
 * @example
 * application.channels$(function (err, channels) {
 *   if (!err) {
 *     // `channels` is a hash of all the applications's channels
 *   }
 * });
 *
 * @param {function (err, channels)} cb Callback
 */
Application.prototype.channels$ = function (cb) {
  var application = this;
  this.request('channels', function (err, channelsData) {
    if (err) return cb(err);
    _.each(channelsData, function (channel, name) {
      application._memoizeChannel(new Channel(application.spire, channel));
    });
    cb(null, application._channels);
  });
};

/**
 * Gets a channel by name.  Returns a Channel resource
 *
 * Always gets a fresh value from the api.
 *
 * @example
 * spire.session.channelByName('name_of_channel', function (err, channel) {
 *   if (!err) {
 *     // `channel` now contains a channel object
 *   }
 * });
 *
 * @param {String} channelName Name of channel
 * @param {function (err, channel)} cb Callback
 */
Application.prototype.channelByName = function (channelName, cb) {
  var application = this;
  this.request('channel_by_name', function (err, channelData) {
    if (err) return cb(err);
    channel = new Channel(application.spire, channelData[channelName]);
    application._memoizeChannel(channel);
    cb(null, channel);
  });
};

/**
 * Gets the subscriptions collection.  Returns a hash of Subscription resources.
 *
 * Returns a value from the cache, if one if available.
 *
 * @example
 * application.subscriptions(function (err, subscriptions) {
 *   if (!err) {
 *     // `subscriptions` is a hash of all the applications's subscriptions
 *   }
 * });
 *
 * @param {function (err, subscriptions)} cb Callback
 */
Application.prototype.subscriptions = function (cb) {
  if (!_.isEmpty(this._subscriptions)) return cb(null, this._subscriptions);
  this.subscriptions$(cb);
};

/**
 * Gets the subscriptions collection.  Returns a hash of Subscription resources.
 *
 * Always gets a fresh value from the api.
 *
 * @example
 * application.subscriptions$(function (err, subscriptions) {
 *   if (!err) {
 *     // `subscriptions` is a hash of all the application's subscriptions
 *   }
 * });
 *
 * @param {function (err, subscriptions)} cb Callback
 */
Application.prototype.subscriptions$ = function (cb) {
  var application = this;
  this.request('subscriptions', function (err, subscriptions) {
    if (err) return cb(err);
    application._subscriptions = {};
    _.each(subscriptions, function (subscription, name) {
      application._memoizeSubscription(new Subscription(application.spire, subscription));
    });
    cb(null, application._subscriptions);
  });
};

/**
 * Gets a subscription by name.  Returns a Subscription resource
 *
 * Always gets a fresh value from the api.
 *
 * @example
 * spire.session.subscriptionByName('name_of_subscription', function (err, subscription) {
 *   if (!err) {
 *     // `subscription` now contains a subscription object
 *   }
 * });
 *
 * @param {String} subscriptionName Name of subscription
 * @param {function (err, subscription)} cb Callback
 */
Application.prototype.subscriptionByName = function (subscriptionName, cb) {
  var application = this;
  this.request('subscription_by_name', function (err, subscriptionData) {
    if (err) return cb(err);
    subscription = new Subscription(application.spire, subscriptionData[subscriptionName]);
    application._memoizeSubscription(subscription);
    cb(null, subscription);
  });
};

/**
 * Creates a channel.  Returns a Channel resource.  Errors if a channel with the
 * specified name exists.
 *
 * @param {string} name Channel name
 * @param {function (err, channel)} cb Callback
 */
Application.prototype.createChannel = function (name, cb) {
  var application = this;
  this.request('create_channel', name, function (err, data) {
    if (err) return cb(err);
    var channel = new Channel(application.spire, data);
    application._memoizeChannel(channel);
    cb(null, channel);
  });
};

/**
 * Creates a subscription to any number of channels.  Returns a Subscription
 * resource.  Errors if a subscription with the specified name exists.
 *
 * @param {object} options Options
 * @param {string} options.name Subscription name
 * @param {array} options.channelNames Channel names to subscribe to
 * @param {array} options.channelUrls Channel urls to subscribe to
 * @param {number} timeout Subscription timeout
 * @param {function (err, subscription)} cb Callback
 */
Application.prototype.createSubscription = function (options, cb) {
  var name = options.name;
  var channelNames = options.channelNames || [];
  var channelUrls = options.channelUrls || [];
  var timeout = options.timeout;

  var application = this;
  this.channels(function (channels) {
    channelUrls.push.apply(channelUrls, _.map(channelNames, function (name) {
      return application._channels[name].url();
    }));
    application.request('create_subscription', name, channelUrls, timeout, function (err, sub) {
      if (err) return cb(err);
      var subscription = new Subscription(application.spire, sub);
      application._memoizeSubscription(subscription);
      cb(null, subscription);
    });
  });
};

 /**
 * Stores the member resource in a hash by its name.
 *
 * @param channel {object} Member to store
 */
Application.prototype._memoizeMember = function (member) {
  this._members[member.login] = member;
};

 /**
 * Stores the channel resource in a hash by its name.
 *
 * @param channel {object} Channel to store
 */
Application.prototype._memoizeChannel = function (channel) {
  this._channels[channel.name()] = channel;
};

/**
 * Stores the subscription resource in a hash by its name.
 *
 * @param subscription {object} Subscription to store
 */
Application.prototype._memoizeSubscription = function (subscription) {
  this._subscriptions[subscription.name()] = subscription;
};

/**
 * Stores the resources.
 */
Application.prototype._storeResources = function () {
  var application = this;
  var resources = {};
  _.each(this.data.resources, function (resource, name) {
    // Turn the account object into an instance of Resource.
    if (name === 'account') {
      resource = new Account(application.spire, resource);
      application._account = resource;
    }
    resources[name] = resource;
  });

  this.resources = resources;
};


/**
 * Requests
 *
 * These define API calls and have no side effects.  They can be run by calling
 *     this.request(<request name>);
 */

/**
 * Gets the channels collection.
 * @name channels
 * @ignore
 */
Resource.defineRequest(Application.prototype, 'channels', function () {
  var collection = this.data.resources.channels;
  return {
    method: 'get',
    url: collection.url,
    headers: {
      'Authorization': this.authorization('all', collection),
      'Accept': this.mediaType('channels')
    }
  };
});

/**
 * Gets a channel by name.  Returns a collection with a single value: { name: channel }.
 * @name channel_by_name
 * @ignore
 */
Resource.defineRequest(Application.prototype, 'channel_by_name', function (name) {
  var collection = this.data.resources.channels;
  return {
    method: 'get',
    url: collection.url,
    query: { name: name },
    headers: {
      'Authorization': this.authorization('get_by_name', collection),
      'Accept': this.mediaType('channels')
    }
  };
});

/**
 * Creates a channel.  Returns a channel object.
 * @name create_channel
 * @ignore
 */
Resource.defineRequest(Application.prototype, 'create_channel', function (name) {
  var collection = this.data.resources.channels;
  return {
    method: 'post',
    url: collection.url,
    content: { name: name },
    headers: {
      'Authorization': this.authorization('create', collection),
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
Resource.defineRequest(Application.prototype, 'subscriptions', function () {
  var collection = this.data.resources.subscriptions;
  return {
    method: 'get',
    url: collection.url,
    headers: {
      'Authorization': this.authorization('all', collection),
      'Accept': this.mediaType('subscriptions')
    }
  };
});

/**
 * Creates a subscrtiption.  Returns a subscription object.
 * @name create_subscription
 * @ignore
 */
Resource.defineRequest(Application.prototype, 'create_subscription', function (name, channelUrls, timeout) {
  var collection = this.data.resources.subscriptions;
  return {
    method: 'post',
    url: collection.url,
    content: {
      name: name,
      channels: channelUrls,
      timeout: timeout
    },
    headers: {
      'Authorization': this.authorization('create', collection),
      'Accept': this.mediaType('subscription'),
      'Content-Type': this.mediaType('subscription')
    }
  };
});

/**
 * Gets a subscription by name.  Returns a collection with a single value: { name: subscription }.
 * @name subscription_by_name
 * @ignore
 */
Resource.defineRequest(Application.prototype, 'subscription_by_name', function (name) {
  var collection = this.data.resources.subscriptions;
  return {
    method: 'get',
    url: collection.url,
    query: { name: name },
    headers: {
      'Authorization': this.authorization('get_by_name', collection),
      'Accept': this.mediaType('subscriptions')
    }
  };
});

/**
 * Gets the members collection.
 * @name members
 * @ignore
 */
Resource.defineRequest(Application.prototype, 'members', function () {
  var collection = this.data.resources.members;
  return {
    method: 'get',
    url: collection.url,
    headers: {
      'Authorization': this.authorization('all', collection),
      'Accept': this.mediaType('members')
    }
  };
});

/**
 * Gets a member by login.  Returns a collection with a single value: { login: member }.
 * @name member_by_login
 * @ignore
 */
Resource.defineRequest(Application.prototype, 'member_by_login', function (name) {
  var collection = this.data.resources.members;
  return {
    method: 'get',
    url: collection.url,
    query: { name: name },
    headers: {
      'Authorization': this.authorization('get_by_login', collection),
      'Accept': this.mediaType('member')
    }
  };
});

/**
 * Creates a member.  Returns a member object.
 * @name create_member
 * @ignore
 */
Resource.defineRequest(Application.prototype, 'create_member', function (data) {
  var collection = this.data.resources.members;
  return {
    method: 'post',
    url: collection.url,
    content: data,
    headers: {
      'Authorization': this.authorization('create', collection),
      'Accept': this.mediaType('member'),
      'Content-Type': this.mediaType('member')
    }
  };
});

/**
 * Authenticates a member.  Returns a member object.
 * @name authenticate_member
 * @ignore
 */
Resource.defineRequest(Application.prototype, 'authenticate_member', function (data) {
  var collection = this.data.resources.authentication;
  return {
    method: 'post',
    url: collection.url,
    content: data,
    headers: {
      'Accept': this.mediaType('member')
    }
  };
});