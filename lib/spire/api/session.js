var Resource = require('./resource')
  , Account = require('./account')
  , Channel = require('./channel')
  , Subscription = require('./subscription')
  , _ = require('underscore')
  ;

function Session (spire, data) {
  this.spire = spire;
  this.data = data;
  this.resourceName = 'session';

  this._channels = {};
  this._subscriptions = {};

  var resources = {};
  _.each(this.data.resources, function (resource, name) {
    if (name === 'account') {
      resource = new Account(spire, resource);
    }
    resources[name] = resource;
  });

  this.resources = resources;
};

Session.prototype = new Resource();

module.exports = Session;

Resource.defineRequest(Session.prototype, 'account', function () {
  var resource = this.resources.account;
  return {
    method: 'get',
    url: resource.url,
    headers: {
      'Authorization': this.authorization(resource.capability),
      'Accept': this.mediaType('account')
    }
  };
});

Resource.defineRequest(Session.prototype, 'channels', function () {
  var spire = this.spire;
  var collection = this.resources.channels;
  return {
    method: 'get',
    url: collection.url,
    headers: {
      'Authorization': this.authorization(collection.capability),
      'Accept': this.mediaType('channels')
    }
  };
});

Resource.defineRequest(Session.prototype, 'channel_by_name', function (name) {
  var spire = this.spire;
  var collection = this.resources.channels;
  return {
    method: 'get',
    url: collection.url,
    query: { name: name },
    headers: {
      'Authorization': this.authorization(collection.capability),
      'Accept': this.mediaType('channels')
    }
  };
});

Resource.defineRequest(Session.prototype, 'create_channel', function (name) {
  var spire = this.spire;
  var collection = this.resources.channels;
  return {
    method: 'post',
    url: collection.url,
    content: { name: name },
    headers: {
      'Authorization': this.authorization(collection.capability),
      'Accept': this.mediaType('channel'),
      'Content-Type': this.mediaType('channel')
    }
  };
});

Resource.defineRequest(Session.prototype, 'subscriptions', function () {
  var spire = this.spire;
  var collection = this.resources.channels;
  return {
    method: 'get',
    url: collection.url,
    headers: {
      'Authorization': this.authorization(collection.capability),
      'Accept': this.mediaType('subscriptions')
    }
  };
});

Resource.defineRequest(Session.prototype, 'create_subscription', function (name, channelUrls) {
  var spire = this.spire;
  var collection = this.resources.subscriptions;
  return {
    method: 'post',
    url: collection.url,
    content: {
      name: name,
      channel_urls: channelUrls
    },
    headers: {
      'Authorization': this.authorization(collection.capability),
      'Accept': this.mediaType('subscription'),
      'Content-Type': this.mediaType('subscription')
    }
  };
});

Session.prototype.account = function (cb) {
  if (this._account) return cb(null, this._account);
  this.account$(cb);
};

Session.prototype.account$ = function (cb) {
  var session = this;
  this.request('account', function (err, account) {
    if (err) return cb(err);
    session._account = new Account(session.spire, account);
    cb(null, session._account)
  });
};

Session.prototype.channels = function (cb) {
  if (this._channels) return cb(null, this._channels);
  this.channels$(cb);
};

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

Session.prototype._memoizeChannel = function (channel) {
  this._channels[channel.name()] = channel;
};

Session.prototype.subscriptions = function (cb) {
  if (this._subscriptions) return cb(null, this._subscriptions);
  this.subscriptions$(cb);
};

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

Session.prototype._memoizeSubscription = function (subscription) {
  this._subscriptions[subscription.name()] = subscription;
};

Session.prototype.createChannel = function (name, cb) {
  var session = this;
  this.request('create_channel', name, function (err, data) {
    if (err) return cb(err);
    var channel = new Channel(session.spire, data);
    session._memoizeChannel(channel);
    cb(null, channel);
  });
};

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
