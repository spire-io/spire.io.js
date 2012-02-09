var _ = require('underscore')

// # Channel
// Object representing a Spire channel
//
// You can get a channel object by calling spire.channel(channel_name)
// * spire = new Spire();
// * spire.start("your api key", function () {
// *   channel = spire["channel name"]
// * });
//
// @constructor
// @param spire {object} Spire object
// @param data {object} Channel data as returned from Spire
var Channel = function (spire, data) {
  this.spire = spire;
  _.extend(this, data);
};

module.exports = Channel;

// ## Channel.prototype.subscribe
// Creates a subscription to the channel
//
// @param subscriptionName {string} Subscription name (optional)
// @param cb {function (err, subscription)} Callback

Channel.prototype.subscribe = function (subscriptionName, cb) {
  this.spire.subscribe(subscriptionName, [this.name], cb);
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




