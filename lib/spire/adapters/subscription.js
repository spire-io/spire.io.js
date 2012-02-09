var _ = require('underscore')

// # Subscription
// Object representing a Spire subscription
//
// You can get a subscription by calling subscribe on a spire object with the name of the channel or
// by calling subscribe on a channel object
//
// * spire = new Spire();
// * spire.start("your api key", function () {
// *   spire.subscribe("subscription name", "channel name", function (err, subscription) {
// *     ...
// *   });
// *  *OR*
// *   spire.getChannel(name, function (err, channel) {
// *     channel.subscribe("subscription name", function (err, subscription) {
// *       ...
// *     });
// *    });
// *   });
//
// @constructor
// @param spire {object} Spire object
// @param data {object} Subscription data as returned from Spire
var Subscription = function (spire, data) {
  this.spire = spire;
  _.extend(this, data);
};

module.exports = Subscription;

Subscription.prototype.getMessages = function () {};
Subscription.prototype.addListener = function () {};
Subscription.prototype.removeListener = function () {};
Subscription.prototype.wrapListener = function () {};
Subscription.prototype.listeners = function () {};
Subscription.prototype._generateListenerName = function () {};
Subscription.prototype.startListening = function () {};
Subscription.prototype.stopListening = function () {};

// ## Subscription.findOrCreate
// Finds or creates a channel
//
// @private
// @param name {string} Subscription name
// @param cb {function (err, channel)} Callback
Subscription.findOrCreate = function (name, cb) {

  // TODO:
  // must set 'this.session.subscriptions[name] = subscription

};

