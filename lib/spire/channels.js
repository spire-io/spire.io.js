var _ = require('underscore')
  , API = require('./api')
  , subscriptions = require('./subscriptions')
  ;

// # Channel
// Object representing a Spire channel
//
// @constructor
// @param data {object} Channel data as returned from Spire
var Channel = function (data) {
  _.extend(this, data);
};

// ## Channel.prototype.subscribe
// Creates a subscription to the channel
//
// @param subscriptionName {string} Subscription name (optional)
// @param cb {function (err, subscription)} Callback

Channel.prototype.subscribe = function (subscriptionName, cb) {
  subscriptions.create(subscriptionName, [this.name], cb);
};

// ## Channel.prototype._findOrCreate
// Finds or creates a channel
//
// @param name {string} Channel name
// @param cb {function (err, channel)} Callback
Channel.findOrCreate = function (name, cb) {
  var creationCount = 0;

  // TODO:
  // must set 'this.session.channels[name] = channel

// TODO: make this work again
//  var channelOptions = {
//    name: name
//  };
//
//  var getChannel = function () {
//    channels.getByName(channelOptions, function(err, channels){
//      if (err && err.status !== 404) {
//        return callback(err);
//      }
//
//      if (channels && channels[channelName]) {
//        return callback(null, channels[channelName]);
//      }
//
//      // Else create the channel
//      createChannel();
//    });
//  };
//
//  var createChannel = function () {
//    spire.requests.channels.create(channelOptions, function(err, channel){
//      creationCount++;
//      if (err && err.status !== 409) {
//        return callback(err);
//      }
//
//      if (channel) {
//        return callback(null, channel);
//      }
//
//      if (creationCount >= Messages.CHANNEL_CREATION_RETRY_LIMIT) {
//        return callback(new Error("Error getting or creating channel"));
//      }
//
//      // Else get the channel
//      getChannel();
//    });
//  };
//
//  // Kick it off
//  getChannel();
};




