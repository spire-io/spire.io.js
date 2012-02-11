var Resource = require('./resource')
  , _ = require('underscore')
  , async = require('async')
  ;

function Subscription (spire, data) {
  this.spire = spire;
  this.data = data;
  this.resourceName = 'subscription';

  this.last = null;
  this.listeners = [];
  this.listening = false;
};

Subscription.prototype = new Resource();

module.exports = Subscription;

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

Subscription.prototype.name = function () {
  return this.data.name;
};

Subscription.prototype.addListener = function (fn) {
  this.listeners.push(fn);
};

Subscription.prototype.removeListener = function (fn) {
  this.listeners = _.without(this.listeners, fn);
};

Subscription.prototype.listen = function (opts) {
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

Subscription.prototype.startListening = function (opts) {
  this.listening = true;
  this.listen(opts);
};

Subscription.prototype.stopListening = function (opts) {
  this.listening = false;
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

    _.each(messages, function (message) {
      _.each(subscription.listeners, function (listener) {
        listener(message);
      });
    });

    cb(null, messages);
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
  options.timeout = 0;
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
  options.timeout = options.timeout || 30;
  this.retreiveMessages(options, cb);
};
