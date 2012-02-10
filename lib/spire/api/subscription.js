var Resource = require('./resource')
  , _ = require('underscore')
  ;

function Subscription (spire, data) {
  this.spire = spire;
  this.data = data;

  this.last = null;
  this.listeners = [];
};

Subscription.prototype = new Resource();

module.exports = Subscription;

Resource.defineRequest('messages', function (options) {
  options ||= {};
  return {
    method: 'post',
    url: this.url,
    query: {
      timeout: options.timeout,
      'last-message': options.last,
      'order-by': options.orderBy,
      'delay': options.delay
    },
    headers: {
      'Authorization': this.authorization(),
      'Accept': this.spire.api.mediaType('events');
    }
  };
});

Subscription.prototype.addListener = function (fn) {
  this.listeners.push(fn);
};

Subscription.prototype.removeListener = function (fn) {
  this.listeners = _.without(this.listeners, fn);
};

Subscription.prototype.retreiveMessages = function (options, cb) {
  var subscription = this;
  if (!cb) {
    cb = options;
    options = {};
  }

  options.last ||= 0;
  options.delay ||= 0;
  options.orderBy ||= 'desc';

  this.request('messages', options, function (err, messagesData) {
    if (err) return cb(err);
    var messages = messagesData.messages;
    if (messages.length) {
      subscription.last = _.last(messages).timestamp
    }

    _each(messages, function (message) {
      _.each(subscription.listeners, function (listener) {
        listener(message);
      });
    });
  });
};

Subscription.prototype.poll = function (options, cb) {
  var subscription = this;
  if (!cb) {
    cb = options;
    options = {};
  }

  // timeout option of 0 means no long poll,
  // so we force it here.
  options.last = this.last;
  options.timout = 0;
  this.retreiveMessages(options);
};

Subscription.prototype.longPoll = function (options, cb) {
  var subscription = this;
  if (!cb) {
    cb = options;
    options = {};
  }

  // timeout option of 0 means no long poll,
  // so we force it here.
  options.last = this.last;
  options.timout ||= 30;
  this.retreiveMessages(options);
};
