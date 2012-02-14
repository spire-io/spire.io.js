var Resource = require('./resource')
  , _ = require('underscore')
  , async = require('async')
  ;

// # Subscription Resource
// Represents a subscription in the spire api.
//
// Inherits from `Resource`
//
// There are a few ways to get messages from a subscription.
//
// The first is to call `subscription.retreiveMessages` directly.  This is the
// most general method, and supports a number of options.
//
// There are convenienve methods `subscription.poll` and `subscription.longPoll`
// which wrap `retreiveMethods`.  The only difference is that `subscription.poll` has a timeout of 0, so
// the request will always come back right away, while `subscription.longPoll`
// has a 30 second timeout, so the request will wait up to 30 seconds for new
// messages to arrive before returning.
//
// You can also use the `message` and `messages` events to listen for new
// messages on the subscription.
// 
//    subscription.addListener('message', function (message) {
//      console.log('Message received: ' + message.content);
//    });
//
//    subscription.addListener('messages', function (messages) {
//      console.log('Received ' + messages.length + ' messages.');
//    });
//
//    subscription.startListening();
//
// The `messages` event fires first and contains the all the messages that were
// received in a single request.  The `message` event fires once per message.
//
// @constructor
// @param {object} spire Spire object
// @param {object} data Subscription data from the spire api
function Subscription (spire, data) {
  this.spire = spire;
  this.data = data;
  this.resourceName = 'subscription';

  this.last = null;
  this.listening = false;
};

Subscription.prototype = new Resource();

module.exports = Subscription;

// ## Public Interface

// ### Subscription.prototype.name
// Gets the name of the subscription.
Subscription.prototype.name = function () {
  return this.data.name;
};

// ### Subscription.prototype.startListening
// Starts long polling for the subscription.
// The `message` and `messages` events will fire when a request comes back with
// messages.  The `message` event will fire once per message, while the
// `messages` event fires every time a request comes back with more than one
// message.
//
// Usage:
//
//    subscription.addListener('message', function (message) {
//      console.log('Message received: ' + message.content);
//    });
//
//    subscription.addListener('messages', function (messages) {
//      console.log('Received ' + messages.length + ' messages.');
//    });
//
//    subscription.startListening();
//
//    // Stop Listening after 100 seconds.
//    setTimout(function () {
//      subscription.stopListening();
//     }, 100000);
//
// @param {object} [options] Optional options argument
// @param {number} [options.last] Optional last message
// @param {number} [options.delay] Optional delay
// @param {number} [options.timeout] Optional timeout
// @param {string} [options.orderBy] Optional ordering ('asc' or 'desc')
// @param {function (err, messages)} cb Callback
Subscription.prototype.startListening = function (opts) {
  this.listening = true;
  this._listen(opts);
};

// ### Subscription.prototype.stopListening
// Stops listening on the subscription.
Subscription.prototype.stopListening = function () {
  this.listening = false;
};

// ### Subscription.prototype.retreiveMessages
// Gets messages for the subscription.
//
// This method only makes one request.  Use `subscription.startListening` to
// poll repeatedly.
//
// Usage:
//
//     subscription.retreiveMessages(function (err, messages) {
//       if (!err) {
//         // `messages` is an array of messages (possably empty)
//       }
//     });
//
// @param {object} [options] Optional options argument
// @param {number} [options.last] Optional last message
// @param {number} [options.delay] Optional delay
// @param {number} [options.timeout] Optional timeout
// @param {string} [options.orderBy] Optional ordering ('asc' or 'desc')
// @param {function (err, messages)} cb Callback
Subscription.prototype.retreiveMessages = function (options, cb) {
  var subscription = this;
  if (!cb) {
    cb = options;
    options = {};
  }

 options.orderBy = options.orderBy || 'desc';

  this.request('messages', options, function (err, messagesData) {
    if (err) return cb(err);
    var messages = messagesData.messages;
    if (messages.length) {
      if (options.orderBy === 'asc') {
        subscription.last = _.first(messages).timestamp
      } else {
        subscription.last = _.last(messages).timestamp
      }

      if (subscription.listening) {
        subscription.emit('messages', messages);
        _.each(messages, function (message) {
          subscription.emit('message', message);
        });
      }
    }

    cb(null, messages);
  });
};

// ### Subscription.prototype.poll
// Gets new messages for the subscription.  This method forces a 0 second
// timeout, so the request will come back immediately, but may have an empty
// array of messages if there are no new ones.
//
// This method only makes one request.  Use `subscription.startListening` to
// poll repeatedly.
//
// Usage:
//
//     subscription.poll(function (err, messages) {
//       if (!err) {
//         // `messages` is an array of messages (possably empty)
//       }
//     });
//
// @param {object} [options] Optional options argument
// @param {number} [options.delay] Optional delay
// @param {string} [options.orderBy] Optional ordering ('asc' or 'desc')
// @param {function (err, messages)} cb Callback
Subscription.prototype.poll = function (options, cb) {
  var subscription = this;
  if (!cb) {
    cb = options;
    options = {};
  }

  // timeout option of 0 means no long poll,
  // so we force it here.
  options.last = this.last;
  options.timeout = 0;
  this.retreiveMessages(options, cb);
};

// ### Subscription.prototype.poll
// Gets new messages for the subscription.
//
// This method defaults to a 30 second timeout, so the request will wait up to
// 30 seconds for a new message to come in.  You can increase the wait time with
// the `options.timeout` paraameter.
//
// This method only makes one request.  Use `subscription.startListening` to
// poll repeatedly.
//
// Usage:
//
//     subscription.longPoll({ timeout: 60 }, function (err, messages) {
//       if (!err) {
//         // `messages` is an array of messages (possably empty)
//       }
//     });
//
// @param {object} [options] Optional options argument
// @param {number} [options.delay] Optional delay
// @param {string} [options.orderBy] Optional ordering ('asc' or 'desc')
// @param {number} [options.timeout] Optional timeout
// @param {function (err, messages)} cb Callback
Subscription.prototype.longPoll = function (options, cb) {
  var subscription = this;
  if (!cb) {
    cb = options;
    options = {};
  }

  // timeout option of 0 means no long poll,
  // so we force it here.
  options.last = this.last;
  options.timeout = options.timeout || 30;
  this.retreiveMessages(options, cb);
};

// ## Private Interface

// ### Subscription.prototype. listen
// Repeatedly polls for new messages until `subscription.stopListening` is
// called.
//
// You should use `subscription.startListening` instead of calling this method
// directly.
Subscription.prototype._listen = function (opts) {
  var subscription = this;
  opts = opts || {};
  async.whilst(
    function () { return subscription.listening; },
    function (cb) {
      subscription.longPoll(opts, cb);
    },
    function () {}
  );
};

// ## Requests
// These define API calls and have no side effects.  They can be run by calling
//     this.request(<request name>);

// messages
// Gets the messages for the subscription, according to various parameters.
Resource.defineRequest(Subscription.prototype, 'messages', function (options) {
  options = options || {};
  return {
    method: 'get',
    url: this.url(),
    query: {
      'timeout': options.timeout || 0,
      'last-message': options.last || 0,
      'order-by': options.orderBy || 'desc',
      'delay': options.delay || 0
    },
    headers: {
      'Authorization': this.authorization(),
      'Accept': this.mediaType('events')
    }
  };
});

