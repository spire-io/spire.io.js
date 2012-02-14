var Resource = require('./resource');

/**
 * Represents a channel in the spire api.
 *
 * @constructor
 * @extends Resource
 * @param {object} spire Spire object
 * @param {object} data  Channel data from the spire api
 */
function Channel (spire, data) {
  this.spire = spire;
  this.data = data;
  this.resourceName = 'channel';
};

Channel.prototype = new Resource();

module.exports = Channel;

/**
 * Returns the channel name.
 *
 * @returns {string} Channel name
 */
Channel.prototype.name = function () {
  return this.data.name;
};

/**
 * Publishes a message to the channel.
 *
 * @example
 * spire.channel('myChannel', function (err, channel) {
 *   channel.publish('hello world', function (err, message) {
 *     if (!err) {
 *       // Message has been published.
 *     }
 *   });
 * });
 *
 * @param {string} message Message to publish
 * @param {function (err, message)} cb Callback
 */
Channel.prototype.publish = function (message, cb) {
  this.request('publish', { content: message }, cb);
};

/**
 * Gets a subscription to a channel, creating it if necessary.
 *
 * @example
 * spire.channel('myChannel', function (err, channel) {
 *   channel.subscribe('mySubscription', function (err, subscription) {
 *     if (!err) {
 *       // `subscription` is the new subscription.
 *     }
 *   });
 * });
 *
 * @param {string} subName Subscription name
 * @param {function (err, subscription)} cb Callback
 */
Channel.prototype.subscribe = function (subName, cb) {
  if (!cb) {
    cb = subName;
    name = null;
  }
  this.spire.subscribe(subName, this.name(), cb);
};

/**
 * Requests
 *
 * These define API calls and have no side effects.  They can be run by calling
 *     this.request(<request name>);
 */

/**
 * @name publish
 * @ignore
 * Publishes a message to the channel.
 */
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
