/**
 * @fileOverview Subscription Resource class definition
 */

var Resource = require('./resource')
  , Message = require('./message')
  , _ = require('underscore')
  , async = require('async')
  ;

/**
 * Represents a subscription in the spire api.
 *
 * <p>There are a few ways to get events from a subscription.
 *
 * <p>The first is to call <code>subscription.retrieveEvents</code> directly.
 * This is the most general method, and supports a number of options.
 *
 * <p>There are convenience methods <code>subscription.poll</code and
 * <code>subscription.longPoll</code> which wrap <code>retrieveEvents</code>.
 * The only difference is that <code>subscription.poll</code> has a timeout of
 * 0, so the request will always come back right away, while
 * <code>subscription.longPoll</code> has a 30 second timeout, so the request
 * will wait up to 30 seconds for new events to arrive before returning.
 *
 * <p>You can also use the <code>event</code> <code>message</code> <code>join</code> and <code>part</code> events to
 * listen for new events on the subscription.
 *
 * <p><pre><code>
 *    subscription.addListener('message', function (message) {
 *      console.log('Message received: ' + message.content);
 *    });
 *
 *    subscription.addListener('join', function (join) {
 *      console.log('Subscription joined: ' + join.subscription_name);
 *    });
 *
 *    subscription.addListener('part', function (part) {
 *      console.log('Subscription parted: ' + part.subscription_name);
 *    });
 *
 *    subscription.addListener('event', function (event) {
 *      // This fires for messages, joins, and parts.
 *      console.log('Received event!');
 *    });
 *
 *    subscription.startListening();
 * </code></pre>
 *
 * <p>By default this will get all events from the beginning of time.
 * If you only want messages created from this point forward, pass { min_timestamp: 'now' } in the options to `startListening`:
 *
 * <p><pre><code>
 *    subscription.startListening({ min_timestamp: 'now' });
 * </code></pre>
 *
 * @class Subscription Resource
 *
 * @constructor
 * @extends Resource
 * @param {object} spire Spire object
 * @param {object} data Subscription data from the spire api
 */
function Subscription(spire, data) {
  this.spire = spire;
  this.data = data;
  this.resourceName = 'subscription';

  this.last = null;
  this.listening = false;
}

Subscription.prototype = new Resource();

module.exports = Subscription;

/**
 * Gets the name of the subscription.
 *
 * @returns {string} Name
 */
Subscription.prototype.name = function () {
  return this.data.name;
};

/**
 * Starts long polling for the subscription.
 *
 * <p>The <code>message</code> and <code>messages</code> events will fire when a
 * request comes back with messages.  The <code>message</code> event will fire
 * once per message, while the <code>messages</code> event fires every time a
 * request comes back with more than one message.
 *
 * @example
 * subscription.addListener('message', function (message) {
 *   console.log('Message received: ' + message.content);
 * });
 *
 * subscription.startListening();
 *
 * // Stop Listening after 100 seconds.
 * setTimout(function () {
 *   subscription.stopListening();
 *  }, 100000);
 *
 * <p>By default this will get all events from the beginning of time.
 * If you only want messages created from this point forward, pass { min_timestamp: 'now' } in the options to `startListening`:
 *
 * <p><pre><code>
 *    subscription.startListening({ min_timestamp: 'now' });
 * </code></pre>
 * @param {object} [options] Optional options argument
 * @param {number} [options.min_timestamp] Optional min_timestamp of events to receive
 * @param {number} [options.max_timestamp] Optional max_timestamp of events to receive
 * @param {number} [options.last] Optional last message (same as min_timestamp)
 * @param {number} [options.delay] Optional delay
 * @param {number} [options.timeout] Optional timeout
 * @param {function (err, messages)} cb Callback
 */
Subscription.prototype.startListening = function (opts) {
  this.listening = true;
  this._listen(opts);
};

/**
 * Stops listening on the subscription.
 */
Subscription.prototype.stopListening = function () {
  this.listening = false;
};

/**
 * Gets events for the subscription.
 *
 * <p>This method only makes one request.  Use
 * <code>subscription.startListening</code> to poll repeatedly.
 *
 * @example
 * subscription.retrieveEvents(function (err, events) {
 *   if (!err) {
 *     // `events` is a hash with `messages`, `joins`, and `parts` (each possibly empty)
 *   }
 * });
 *
 * @param {object} [options] Optional options argument
 * @param {number} [options.min_timestamp] Optional min_timestamp of events to receive
 * @param {number} [options.max_timestamp] Optional max_timestamp of events to receive
 * @param {number} [options.last] Optional last message (same as min_timestamp)
 * @param {number} [options.delay] Optional delay
 * @param {number} [options.timeout] Optional timeout
 * @param {function (err, messages)} cb Callback
 */
Subscription.prototype.retrieveEvents = function (options, cb) {
  var subscription = this;
  var spire = this.spire;
  if (!cb) {
    cb = options;
    options = {};
  }

  var req = this.request('events', options, function (err, eventsData) {
    if (err) {
      if (subscription.listeners('error').length) {
        subscription.emit('error', err);
      }
      return cb(err);
    }

    if (eventsData.messages.length) {
      var messagesData = eventsData.messages;
      eventsData.messages = _(eventsData.messages).map(function (messageData) {
        return new Message(spire, messageData);
      });
    }

    if (!subscription.listening) {
      return cb(null, eventsData);
    }

    var eventTypes = ["messages", "joins", "parts"];

    _.each(eventTypes, function (eventType) {
      if (eventsData[eventType].length) {
        subscription.emit(eventType, eventsData[eventType])
      }
    });

    var allEvents = _.reduce(eventTypes, function (_allEvents, eventType) {
      return _allEvents.concat(eventsData[eventType]);
    }, []);

    allEvents.sort(function (a, b) {
      return a.timestamp - b.timestamp
    });

    if (allEvents.length) {
      process.nextTick(function () {
        _.each(allEvents, function (event) {
          subscription.emit(event.type, event);
        });
      });
    }

    cb(null, eventsData);
  });

  req.on('socket', function (socket) {
    subscription.emit('socket', socket);
  });
};

/**
 * Alias for subscription.retreiveEvents.
 */
Subscription.prototype.get = Subscription.prototype.retreiveEvents;

/**
 * Gets new events for the subscription.  This method forces a 0 second
 * timeout, so the request will come back immediately, but may have an empty
 * array of events if there are no new ones.
 *
 * <p>This method only makes one request.  Use
 * <code>subscription.startListening</code> to poll repeatedly.
 *
 * @example
 * subscription.poll(function (err, events) {
 *   if (!err) {
 *     // `events.messages` is an array of messages (possably empty)
 *   }
 * });
 *
 * @param {object} [options] Optional options argument
 * @param {number} [options.delay] Optional delay
 * @param {function (err, events)} cb Callback
 */
Subscription.prototype.poll = function (options, cb) {
  if (!cb) {
    cb = options;
    options = {};
  }
  options.timeout = 0;
  this.longPoll(options, cb);
};

/**
 * Gets new events for the subscription.
 *
 * <p>This method defaults to a 30 second timeout, so the request will wait up to
 * 30 seconds for a new message to come in.  You can increase the wait time with
 * the <code>options.timeout</code> paraameter.
 *
 * <p>This method only makes one request.  Use `subscription.startListening` to
 * poll repeatedly.
 *
 * @example
 * subscription.longPoll({ timeout: 60 }, function (err, events) {
 *   if (!err) {
 *     // `events.messages` is an array of messages (possably empty)
 *   }
 * });
 *
 * @param {object} [options] Optional options argument
 * @param {number} [options.delay] Optional delay
 * @param {number} [options.timeout] Optional timeout
 * @param {function (err, events)} cb Callback
 */
Subscription.prototype.longPoll = function (options, cb) {
  var subscription = this;
  if (!cb) {
    cb = options;
    options = {};
  }

  options.last = this.last;
  options.timeout = options.timeout || 30;

  this.retrieveEvents(options, function (err, events) {
    if (err) return cb(err);
    if (events.last) {
      subscription.last = events.last;
    }

    cb(null, events);
  });
};

/**
 * Repeatedly polls for new events until `subscription.stopListening` is
 * called.
 *
 * You should use `subscription.startListening` instead of calling this method
 * directly.
 */
Subscription.prototype._listen = function (opts) {
  var subscription = this;
  opts = opts || {};

  opts.min_timestamp = opts.min_timestamp || opts.last;

  if (typeof opts.min_timestamp !== 'undefined') {
    this.last = opts.min_timestamp;
  }
  delete opts.min_timestamp;
  delete opts.last;

  async.whilst(
    function () { return subscription.listening; },
    function (cb) {
      optsClone = _.clone(opts);
      subscription.longPoll(optsClone, cb);
    },
    function () {}
  );
};

/**
 * Requests
 *
 * These define API calls and have no side effects.  They can be run by calling
 *     this.request(<request name>);
 */

/**
 * Gets the events for the subscription, according to various parameters.
 * @name events
 * @ignore
 */
Resource.defineRequest(Subscription.prototype, 'events', function (options) {
  options = options || {};

  reqOpts = {
    timeout: options.timeout || 0,
    delay: options.delay || 0,
    limit: options.limit
  };

  if (options.last) {
    reqOpts.last = options.last;
  }

  if (options.min_timestamp) {
    reqOpts.min_timestamp = options.min_timestamp;
  }

  if (options.max_timestamp) {
    reqOpts.max_timestamp = options.max_timestamp;
  }

  return {
    method: 'get',
    url: this.url(),
    query: reqOpts,
    headers: {
      'Authorization': this.authorization('events'),
      'Accept': this.mediaType('events')
    }
  };
});
