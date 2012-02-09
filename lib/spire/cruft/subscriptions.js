var _ = require('underscore')

// # Subscription
// Object representing a Spire subscription
//
//
// @constructor
// @param data {object} Subscription data as returned from Spire
var Subscription = function (data) {
  _.extend(this, data);
};

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

