var Resource = require('./resource');

// # Channel Resource
// Represents a channel in the spire api.
//
// Inherits from `Resource`
//
// @constructor
// @param spire {object} Spire object
// @param data {object} Channel data from the spire api
function Channel (spire, data) {
  this.spire = spire;
  this.data = data;
  this.resourceName = 'channel';
};

Channel.prototype = new Resource();

module.exports = Channel;

// ## Public Interface

// ### Channel.prototype.name
// Returns the channel name.
Channel.prototype.name = function () {
  return this.data.name;
};

// ## Channel.prototype.publish
// Publishes a message to the channel.
//
// @param message {string} Message to publish
// @param cb {function (err, message)} Callback
Channel.prototype.publish = function (message, cb) {
  this.request('publish', { content: message }, cb);
};

// ## Channel.prototype.subscribe
// Creates a subscription to a channel.
//
// @param subName {string} Subscription name
// @param cb {function (err, subscription)} Callback
Channel.prototype.subscribe = function (subName, cb) {
  if (!cb) {
    cb = subName;
    name = null;
  }
  this.spire.subscribe(subName, this.name(), cb);
};

// ## Requests
// These define API calls and have no side effects.  They can be run by calling
//     this.request(<request name>);

// ### publish
// Publishes a message to the channel.
Resource.defineRequest(Channel.prototype, 'publish', function (message) {
  var spire = this.spire;
  return {
    method: 'post',
    url: this.url(),
    headers: {
      'Authorization': this.authorization(),
      'Accept': this.mediaType('message'),
      'Content-Type': this.mediaType('message')
    },
    content: message,
  };
});

