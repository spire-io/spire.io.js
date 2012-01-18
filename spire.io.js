// spire.io.js is a library designed to help you get your client-side web applications up and running with the high level services provided by the spire.io API. This plugin also exposes a methodology for directly interfacing with the spire.io REST interface.

// You can learn more about spire.io and it's services at http://spire.io, or find help with the following things:

// * [source code](http://github.com/spire-io/spire.io.js)
// * [issues](http://github.com/spire-io/spire.io.js/issues)
// * [contact spire.io](http://spire.io/contact.html)

!function (name, definition) {
  if (typeof define == 'function') define(definition)
  else if (typeof module != 'undefined') module.exports = definition()
  else this[name] = definition()
}('spire', function () {
  // # XHRError
  //
  // XHRError is a wrapper for raw XHR errors, this makes it easier to pass an
  // error to the callbacks of the async functions that still retain their extra
  // contextual information passed into the `arguments` of `ajax`'s `error`
  // handler
  var XHRError = function(xhr, status, err, message){
    this.name = 'XHRError';
    this.message = message || 'XHRError';
    this.xhr = xhr;
    this.textStatus = status;
    this.status = (xhr) ? xhr.status || xhr.statusCode : null;
  };

  XHRError.prototype = new Error();
  XHRError.prototype.constructor = XHRError;

  // # spire
  //
  // Set up the spire object with default `options` for `url`, `version`,
  // and `timeout` as well as stub out some objects to make method definitions
  // obvious.
  //
  // * **spire.options.url**: The url of the spire.io API, defaults to
  // [http://api.spire.io](http://api.spire.io).
  var spire = { options: { url: 'http://api.spire.io'
    // * **spire.options.version**: The spire.io API version to use when making requests for resources, defaults to 1.0.
    , version: '1.0'
    // * **spire.options.timeout**: The timeout for long-polling in seconds, defaults to 30 seconds
    , timeout: 1000 * 30
    }
  , cache: {}
  , isConnecting: false
  , headers: {}
  , messages: { queue: [] }
  , accounts: {}
  , account: {}
  , requests: { description: {}
    , sessions: {}
    , channels: {}
    , subscriptions: {}
    , messages: {}
    , accounts: {}
    , billing: {}
    }
  };

  if (typeof window !== 'undefined') {
    spire.ajax = require('reqwest');
  } else {
    // This builds an ajax-like inteface around request.
    var request = require('request');
    spire.ajax = function (params) {
      params.headers = params.headers || {};
      params.method = params.method.toLowerCase();

      // Gotta munge the data ourselves.
      if (params.data) {
        if (params.method === 'put' || params.method === 'post') {
          if (typeof params.data === 'string') {
            params.body = params.data;
          } else {
            params.body = JSON.stringify(params.data);
          }
        } else {
          var first = true;
          for (var key in params.data) {
            params.url += first ? '?' : '&';
            params.url += key + '=' + params.data[key];
            first = false;
          }
        }
      }

      var handler = function (err, req, body) {
        if (err) {
          return params.error(req, req.statusCode, err);
        }

        if (req.statusCode >= 400) {
          return params.error(req, req.statusCode, req.statusCode);
        }

        if (params.type === 'json') {
          body = JSON.parse(body);
        }

        params.success(body);
      };

      if (params.type === 'json') {
        if (!params.headers['Accept']) {
          params.headers['Accept'] = "application/json";
        }
      }

      return request(params, handler);
    };
  }

  // # spire.headers
  //
  // Helpers for generating header values for the http requests to the
  // spire.io API.

  // ## spire.headers.authorization
  //
  // Generate the authorization header for a resource with a capability.
  // Requires a resource object with a `capability` key.
  //
  //     authorization = spire.headers.authorization(subscription);
  //     //=> 'Capability 5iyTrZrcGw/X4LxhXJRIEn4HwFKSFB+iulVKkUjqxFq30cFBqEm'
  //
  spire.headers.authorization = function(resource){
    return ['Capability', resource.capability].join(' ');
  };

  // ## spire.headers.mediaType
  //
  // Generate either a 'content-type' or 'authorization' header, requires a
  // string with the name of the resource so it can extract the media type
  // from the API's schema.
  //
  //     spire.headers.mediaType('channel');
  //     //=> 'application/vnd.spire-io.channel+json;version=1.0'
  spire.headers.mediaType = function(resourceName){
    return spire.schema[spire.options.version][resourceName].mediaType
  };

  // # spire.messages
  //
  // Provides a high level interface for message publishing and subscribing.

  // ## spire.messages.subscribe
  //
  // Subscribe to a channel with the `name`, when new messages come in trigger
  // the `callback` every time. This method uses long-polling to get the
  // events from a subscription resource and wraps up all the complexities of
  // interfacing with the REST API (discovery, session creation, channel
  // creation, subscription creation, and event listening for the
  // subscription).
  //
  // The callback is triggered with two arguments, an `error` object and a
  // `messages` array
  //
  //     spire.messages.subscribe('chat example', function(err, messages){
  //       $.each(messages, function(i, message){
  //         var el = $('<div class="message">').text(message);
  //
  //         $('.messages').append(el);
  //       });
  //     });
  //
  spire.messages.subscribe = function(name, callback){
    spire.connect(function(err, session){
      if (err) return callback(err);

      var options = { session: session
          , name: name
          }
      ;

      var subscriptionCallCount = 0;

      // Get events from the subscription
      var get = function (options) {
        subscriptionCallCount++;
        if (spire.options._maxSubscriptionCallCount < subscriptionCallCount) {
          return;
        }

        spire.requests.subscriptions.get(options, function(err, events){
          if (err) return callback(err);

          if (events.messages.length > 0){
            callback(null, events.messages);
          }

          // Do it all over again
          get(options);
        });
      }

      spire.requests.channels.create(options, function(err, channel){
        if (err) {
          if (err.status === 409) {
            return spire.requests.sessions.get(session, function(err, session){
              if (err) callback(err);

              var channel = session
                  .resources
                  .channels
                  .resources[name]
              ;

              spire.requests.channels.get(channel, function(err, channel){
                var options = { channels: [ channel ]
                    , events: [ 'messages' ]
                    , session: session
                    }
                ;

                spire.requests.subscriptions.create(options, function(err, sub){
                  if (err) return callback(err);

                  var options = { subscription: sub };

                  // Kick off long-polling
                  get(options);
                });

              });
            });
          } else {
            return callback(err);
          }
        };

        var options = { channels: [ channel ]
            , events: [ 'messages' ]
            , session: session
            }
        ;

        spire.requests.subscriptions.create(options, function(err, sub){
          if (err) return callback(err);

          var options = { subscription: sub };

          // Get events from the subscription
          var subscriptionCallCount = 0;

          // Kick off long-polling
          get(options);
        });
      });
    });
  };



  // ## spire.messages.publish
  //
  // Publish a message. This method takes the `options` `channel`,
  // which is the name of the channel to publish the message to and `content`
  // which is the content of the message you want to publish. It can also take
  // an optional callback which gets called with an `error` and a `message`
  // object.
  //
  //       // Fire and forget
  //       var options = { channel: 'chat example', content: 'herow' };
  //
  //       spire.messages.publish(options);
  //
  //   Or:
  //
  //       // Do something specific to sending this message
  //       spire.messages.publish(options, function(err, message){
  //          // you should probably do something useful though
  //         if (err) throw err;
  //
  //         $('form').hide();
  //       });
  //
  spire.messages.publish = function(message, callback){
    // If the `spire` is busy connecting, queue the message and return.
    if (spire.isConnecting){
      spire.messages.queue.push({ message: message
      , callback: callback
      });

      return;
    }

    // Connect; discover and create a session.
    spire.connect(function(err, session){
      if (err) return callback(err);

      var options = { session: session
          , name: message.channel
          }
      ;

      // Create the channel before sending a message to it.
      spire.requests.channels.create(options, function(err, channel){
        var options = { session: session
            , name: message.channel
            }
        ;

        if (err) {
          if (err.status === 409) {
            return spire.requests.sessions.get(session, function(err, session){
              if (err) {
                if (callback) return callback(err, null);
                else throw err;
              }

              var channel = session
                  .resources
                  .channels
                  .resources[message.channel]
              ;

              spire.requests.channels.get(channel, function(err, channel){
                var options = { channel: channel
                    , content: message.content
                    }
                ;

                // Finally send the message.
                spire.requests.messages.create(options, function(err, message){
                  if (err) return callback(err);

                  if (callback) callback(null, message);
                });
              })
            });
          } else {
            return callback(err, null);
          }

          return;
        }

        var options = { channel: channel
            , content: message.content
            }
        ;

        // Finally send the message.
        spire.requests.messages.create(options, function(err, message){
          if (err) return callback(err);

          if (callback) callback(null, message);
        });
      });
    });
  };

  // # spire.accounts
  //
  // Provides a high level interface for accounts. This is what the spire.io
  // website uses for logging in, registration, and account updates.

  // ## spire.accounts.create
  //
  // Wrapper for creating an account, makes a call for the API description
  // then creates the account. It requires an account object (with at least an
  // `email` and a `password`) and a `callback`. The `callback` will be called
  // with the arguments: `error` and `session`. The `session` is a session
  // resource.
  //
  //     var account = { email: 'jxson@jxson.cc'
  //         , password: 'topsecret'
  //         }
  //     ;
  //
  //     spire.accounts.create(account, function(err, session){
  //       // seriously, do something useful with this error...
  //       if (err) throw err;
  //
  //       console.log(session);
  //     });
  //
  spire.accounts.create = function(account, callback){
    spire.requests.description.get(function(err, description){
      if (err) return callback(err);

      spire.requests.accounts.create(account, callback);
    });
  };

  // ## spire.accounts.update
  //
  // Wrapper for updating an account, it requires an authenticated `account`
  // resource and a `callback`. The callback will be triggered with the
  // arguments: an `error` object and an `account` resource object.
  //
  //     account.email = 'something-else@test.com';
  //
  //     spire.accounts.update(account, function(err, account){
  //       if (err) throw err;
  //
  //       console.log(account);
  //     });
  //
  spire.accounts.update = function(account, callback){
    spire.requests.description.get(function(err, description){
      if (err) return callback(err);

      spire.requests.accounts.update(account, callback);
    });
  };

  // ## spire.accounts.authenticate
  //
  // Creates a session for a given account, expects an `account` object with
  // `password` and `email` properties and a `callback`. The callback gets
  // called with the arguments `error`, `session`
  //
  //
  //     var account = { email: 'jxson@jxson.cc'
  //         , password: 'totally-secure'
  //         }
  //     ;
  //
  //     spire.accounts.authenticate(account, function(err, session){
  //       if (err) return callback(err);
  //
  //       console.log(session);
  //     });
  //
  spire.accounts.authenticate = function(account, callback){
    spire.requests.description.get(function(err, description){
      if (err) return callback(err);

      var options = { key: spire.options.key
          , email: account.email
          , password: account.password
          }
      ;

      spire.requests.sessions.create(options, callback);
    });
  };

  // # spire.connect
  //
  // provides a single point of connection that builds up the needed objects
  // for discovery and sharing a session between requests.
  // the callback is triggered with an error and a session
  spire.connect = function(callback){
    spire.isConnecting = true;

    spire.requests.description.get(function(err, description){
      if (err) return callback(err);

      var options = { key: spire.options.key };

      var sessionBack = function(err, session){
        if (err) return callback(err);

        spire.isConnecting = false;
        // save it for later.
        spire.session = session;

        // publish any messages in the queue
        if (spire.messages.queue.length > 0){
          var args;
          while (args = spire.messages.queue.pop()) {
            // try it again, its possible this loop might get fired in
            // parallel effecting the queue so make sure that the args are
            // defined before calling the publish function
            if (args) spire.messages.publish(args.message, args.callback);
          }
        }

        return callback(null, session);
      };

      if (spire.session) {
        sessionBack(null, spire.session);
      } else {
        spire.requests.sessions.create(options, sessionBack);
      }
    });
  };

  // # spire.requests
  //
  // Requests are raw and assume nothing besides the spire.io API url set in
  // `spire.options.url`.

  // ## spire.requests.description.get
  //
  // Gets the description resource object and caches it for later, the
  // `callback` is triggered with an `error` object and the `description`
  // resource object.
  spire.requests.description.get = function(callback){
    // If discovery has already happened use the cache.
    if (spire.resources) {
      var description = { resources: spire.resources
          , schema: spire.schema
          }
      ;

      return callback(null, description);
    }

    // If there isn't a cache make an XHR to get the description.
    spire.ajax({ method: 'GET'
      , url: spire.options.url
      , type: 'json'
      , error: function(xhr, status, errorThrown){
          var error = new XHRError(xhr, status, errorThrown);
          callback(error);
        }
        // ### UGH.
        //
        // XHR handlers always get executed on the `window`, I tried to
        // write a nice wrapper to help with testing but all it's methods
        // were getting called with `this` bound to the window.
      , success: function(description, status, xhr){
          spire.resources = description.resources;
          spire.schema = description.schema;

          callback(null, description);
        }
    });
  };

  spire.requests.sessions.get = function(session, callback){
    spire.ajax({ method: 'get'
      , url: session.url
      , headers: { 'Accept': spire.headers.mediaType('session')
        , 'Authorization': spire.headers.authorization(session)
        }
      , type: 'json'
      , error: function(xhr, status, errorThrown){
          var error = new XHRError(xhr, status, errorThrown);
          callback(error);
        }
      , success: function(session, status, xhr){
          callback(null, session);
        }
    });

  };

  spire.requests.sessions.create = function(options, callback){
    if (! options.key && (typeof options.email !== 'string' && typeof options.password !== 'string')){
      var message = [ 'You need a key to do that! Try doing this:'
          , '   spire.options.key = <your account key>'
          ].join('\n');
      ;

      throw new Error(message);
    }

    if (options.email && options.password) options.key = null;

    spire.ajax({ method: 'post'
      , url: spire.resources.sessions.url
      , headers: { 'Content-Type': spire.headers.mediaType('account')
        , 'Accept': spire.headers.mediaType('session')
        }
      , data: JSON.stringify(options)
      , type: 'json'
      , error: function(xhr, status, errorThrown){
          var error = new XHRError(xhr, status, errorThrown);
          callback(error);
        }
      , success: function(session, status, xhr){
          callback(null, session);
        }
    });
  };

  spire.requests.channels.get = function(channel, callback){
    spire.ajax({ method: 'get'
      , url: channel.url
      , headers: { 'Accept': spire.headers.mediaType('channel')
        , 'Authorization': spire.headers.authorization(channel)
        }
      , type: 'json'
      , error: function(xhr, status, errorThrown){
          var error = new XHRError(xhr, status, errorThrown);
          callback(error, null);
        }
      , success: function(channel, status, xhr){
          callback(null, channel);
        }
    });
  };

  spire.requests.channels.create = function(options, callback){
    var channels = options.session.resources.channels
      , name = options.name
    ;

    spire.ajax({ method: 'post'
      , url: channels.url
      , headers: { 'Content-Type': spire.headers.mediaType('channel')
        , 'Accept': spire.headers.mediaType('channel')
        , 'Authorization': spire.headers.authorization(channels)
        }
      , data: JSON.stringify({ name: name })
      , type: 'json'
      , error: function(xhr, status, errorThrown){
          var error = new XHRError(xhr, status, errorThrown);
          callback(error);
        }
      , success: function(channel, status, xhr){
          callback(null, channel);
        }
    });
  };

  /*

  {
    channels: [ channel ],
    events: [ 'messages' ],
    session: sessionObj
  }

  */
  spire.requests.subscriptions.create = function(options, callback){
    var subscriptions = options.session.resources.subscriptions
      , data = { events: options.events
        , channels: []
        }
    ;

    // **!** The subscription create request wants an array of channel urls
    // not 'channel' resource objects.
    for (var i = 0; i < options.channels.length; i++) {
      data.channels.push(options.channels[i].url);
    }

    spire.ajax({ method: 'post'
      , url: subscriptions.url
      , headers: { 'Content-Type': spire.headers.mediaType('subscription')
        , 'Accept': spire.headers.mediaType('subscription')
        , 'Authorization': spire.headers.authorization(subscriptions)
        }
      , data: JSON.stringify(data)
      , type: 'json'
      , error: function(xhr, status, errorThrown){
          var error = new XHRError(xhr, status, errorThrown);
          callback(error);
        }
      , success: function(subscription, status, xhr){
          callback(null, subscription);
        }
    });
  };

  /*

  {
    timeout: ...,
    subscription: subscription
  }

  */
  spire.requests.subscriptions.get = function(options, callback){
    var subscription = options.subscription
      data = { timeout: options.timeout || spire.options.timeout/1000 }
    ;

    if (subscription['last-message']) {
      data['last-message'] = subscription['last-message'];
    }

    spire.ajax({ method: 'get'
      , url: subscription.url
      // , timeout: options.timeout + 10000
      , headers: { 'Content-Type': spire.headers.mediaType('events')
        , 'Accept': spire.headers.mediaType('events')
        , 'Authorization': spire.headers.authorization(subscription)
        }
      , data: data
      , type: 'json'
      , error: function(xhr, status, errorThrown){
          // fake a returned events object
          if (errorThrown === 'timeout') {
            callback(null, { messages: [] });
          } else {
            var error = new XHRError(xhr, status, errorThrown);
            callback(error);
          }
        }
      , success: function(events, status, xhr){
          // set the last message key if there are messages
          var messageCount = events.messages.length
          if (messageCount > 0){
            subscription['last-message'] =
              events.messages[messageCount - 1].timestamp;
          }

          callback(null, events);
        }
    });
  };

  // { channel: {}, content: .. }
  spire.requests.messages.create = function(options, callback){
    var channel = options.channel
      , content = options.content
    ;

    spire.ajax({ method: 'post'
      , url: channel.url
      , headers: { 'Content-Type': spire.headers.mediaType('message')
        , 'Accept': spire.headers.mediaType('message')
        , 'Authorization': spire.headers.authorization(channel)
        }
      , data: JSON.stringify({ content: content })
      , type: 'json'
      , error: function(xhr, status, errorThrown){
          var error = new XHRError(xhr, status, errorThrown);
          callback(error);
        }
      , success: function(message, status, xhr){
          callback(null, message);
        }
    });
  };

  spire.requests.accounts.create = function(account, callback){
    spire.ajax({ method: 'post'
      , url: spire.resources.accounts.url
      , headers: { 'Content-Type': spire.headers.mediaType('account')
        , 'Accept': spire.headers.mediaType('session')
        }
      , data: JSON.stringify(account)
      , type: 'json'
      , success: function(session, status, xhr){
          callback(null, session);
        }
      , error: function(xhr, status, errorThrown){
          var error = new XHRError(xhr, status, errorThrown);
          callback(error);
        }
    });
  };

  spire.requests.accounts.update = function(account, callback){
    spire.ajax({ method: 'put'
      , url: account.url
      , headers: { 'Content-Type': spire.headers.mediaType('account')
        , 'Accept': spire.headers.mediaType('account')
        , 'Authorization': spire.headers.authorization(account)
        }
      , data: JSON.stringify(account)
      , type: 'json'
      , success: function(account, status, xhr){
          callback(null, account);
        }
      , error: function(xhr, status, errorThrown){
          var error = new XHRError(xhr, status, errorThrown);
          callback(error);
        }
    });
  };

  spire.requests.accounts.reset = function(account, callback){
    spire.ajax({ method: 'post'
      , url: account.url
      , headers: { 'Content-Type': spire.headers.mediaType('account')
        , 'Accept': spire.headers.mediaType('account')
        , 'Authorization': spire.headers.authorization(account)
        }
      , type: 'json'
      , success: function(account, status, xhr){
          callback(null, account);
        }
      , error: function(xhr, status, errorThrown){
          var error = new XHRError(xhr, status, errorThrown);
          callback(error);
        }
    });
  };

  spire.requests.billing.get = function(callback){
    spire.ajax({ method: 'GET'
      , url: spire.resources.billing.url
      , headers: { 'Content-Type': spire.headers.mediaType('billing')
        , 'Accept': spire.headers.mediaType('billing')
        }
      , type: 'json'
      , error: function(xhr, status, errorThrown){
          var error = new XHRError(xhr, status, errorThrown);

          callback(error);
        }
      , success: function(billing, status, xhr){
          callback(null, billing);
        }
    });
  };

  return spire;
});
