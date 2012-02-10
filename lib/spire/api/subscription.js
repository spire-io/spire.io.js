var Resource = require('./resource')
  , _ = require('underscore')
  ;

function Subscription (spire, data) {
  this.spire = spire;
  this.data = data;

  this.last = null;
  this.listeners = [];
  this.listening = false;
};

Subscription.prototype = new Resource();

module.exports = Subscription;

Resource.defineRequest('messages', function (options) {
  options = options || {};
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
      'Accept': this.mediaType('events')
    }
  };
});

Subscription.prototype.addListener = function (fn) {
  this.listeners.push(fn);
};

Subscription.prototype.removeListener = function (fn) {
  this.listeners = _.without(this.listeners, fn);
};

Subscription.prototype.listen = function (opts) {
  opts = opts || {};
  while (this.listening) {
    this.longPoll(function () {})
  }
};

Subscription.prototype.startListening = function (opts) {
  this.listening = true;
  this.listen(opts);
};

Subscription.prototype.stopListening = function (opts) {
  this.listening = true;
  this.listen(opts);
};

Subscription.prototype.retreiveMessages = function (options, cb) {
  var subscription = this;
  if (!cb) {
    cb = options;
    options = {};
  }

  options.last = options.last || 0;
  options.delay = options.delay || 0;
  options.orderBy = options.orderBy || 'desc';

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
  this.retreiveMessages(options, cb);
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
  options.timout = options.timeout || 30;
  this.retreiveMessages(options, cb);
};
