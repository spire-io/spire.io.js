// spire.io.js is a library designed to help you get your client-side web applications up and running with the high level services provided by the spire.io API. This plugin also exposes a methodology for directly interfacing with the spire.io REST interface.

// You can learn more about spire.io and it's services at http://spire.io, or find help with the following things:

// * [source code](http://github.com/spire-io/jquery.spire.js)
// * [issues](http://github.com/spire-io/jquery.spire.js/issues)
// * [contact spire.io](http://spire.io/contact.html)

(function($){

  // # XHRError
  //
  // XHRError is a wrapper for the xhr errors triggered by jQuery, this makes
  // it easier to pass an error to the callbacks of the async functions that
  // still retain their extra contextual information passed into the
  // `arguments` of `jQuery.ajax`'s `error` handler
  var XHRError = function(xhr, status, err, message){
    this.name = 'XHRError';
    this.message = message || 'XHRError';
    this.xhr = xhr;
    this.textStatus = status;
    this.status = (xhr) ? xhr.status : null;
    this.jqueryErr = err;
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
  spire = { options: { url: 'http://api.spire.io'
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

                  // Get events from the subscription
                  var get = function(){
                    spire.requests.subscriptions.get(options, function(err, events){
                      if (err) return callback(err);

                      if (events.messages.length > 0){
                        callback(null, events.messages);
                      }

                      // Do it all over again
                      get();
                    });
                  }

                  // Kick off long-polling
                  get();
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
          var get = function(){
            spire.requests.subscriptions.get(options, function(err, events){
              if (err) return callback(err);

              if (events.messages.length > 0){
                callback(null, events.messages);
              }

              // Do it all over again
              get();
            });
          }

          // Kick off long-polling
          get();
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
    $.ajax({ type: 'GET'
      , url: spire.options.url
      , dataType: 'json'
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
    $.ajax({ type: 'get'
      , url: session.url
      , beforeSend: function(xhr){ xhr.withCredentials = true; }
      , headers: { 'Accept': spire.headers.mediaType('session')
        , 'Authorization': spire.headers.authorization(session)
        }
      , dataType: 'json'
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

    $.ajax({ type: 'post'
      , url: spire.resources.sessions.url
      , beforeSend: function(xhr){ xhr.withCredentials = true; }
      , headers: { 'Content-Type': spire.headers.mediaType('account')
        , 'Accept': spire.headers.mediaType('session')
        }
      , data: JSON.stringify(options)
      , dataType: 'json'
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
    $.ajax({ type: 'get'
      , url: channel.url
      , beforeSend: function(xhr){
          xhr.withCredentials = true;
        }
      , headers: { 'Accept': spire.headers.mediaType('channel')
        , 'Authorization': spire.headers.authorization(channel)
        }
      , dataType: 'json'
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

    $.ajax({ type: 'post'
      , url: channels.url
      , beforeSend: function(xhr){
          xhr.withCredentials = true;
        }
      , headers: { 'Content-Type': spire.headers.mediaType('channel')
        , 'Accept': spire.headers.mediaType('channel')
        , 'Authorization': spire.headers.authorization(channels)
        }
      , data: JSON.stringify({ name: name })
      , dataType: 'json'
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

    $.ajax({ type: 'post'
      , url: subscriptions.url
      , beforeSend: function(xhr){ xhr.withCredentials = true; }
      , headers: { 'Content-Type': spire.headers.mediaType('subscription')
        , 'Accept': spire.headers.mediaType('subscription')
        , 'Authorization': spire.headers.authorization(subscriptions)
        }
      , data: JSON.stringify(data)
      , dataType: 'json'
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

    data['last-message'] = subscription['last-message'];

    $.ajax({ type: 'get'
      , url: subscription.url
      // , timeout: options.timeout + 10000
      , beforeSend: function(xhr){ xhr.withCredentials = true; }
      , headers: { 'Content-Type': spire.headers.mediaType('events')
        , 'Accept': spire.headers.mediaType('events')
        , 'Authorization': spire.headers.authorization(subscription)
        }
      , data: data
      , dataType: 'json'
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

    $.ajax({ type: 'post'
      , url: channel.url
      , beforeSend: function(xhr){ xhr.withCredentials = true; }
      , headers: { 'Content-Type': spire.headers.mediaType('message')
        , 'Accept': spire.headers.mediaType('message')
        , 'Authorization': spire.headers.authorization(channel)
        }
      , data: JSON.stringify({ content: content })
      , dataType: 'json'
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
    $.ajax({ type: 'post'
      , url: spire.resources.accounts.url
      , headers: { 'Content-Type': spire.headers.mediaType('account')
        , 'Accept': spire.headers.mediaType('session')
        }
      , data: JSON.stringify(account)
      , dataType: 'json'
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
    $.ajax({ type: 'put'
      , url: account.url
      , headers: { 'Content-Type': spire.headers.mediaType('account')
        , 'Accept': spire.headers.mediaType('account')
        , 'Authorization': spire.headers.authorization(account)
        }
      , data: JSON.stringify(account)
      , dataType: 'json'
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
    $.ajax({ type: 'post'
      , url: account.url
      , headers: { 'Content-Type': spire.headers.mediaType('account')
        , 'Accept': spire.headers.mediaType('account')
        , 'Authorization': spire.headers.authorization(account)
        }
      , dataType: 'json'
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
    $.ajax({ type: 'GET'
      , url: spire.resources.billing.url
      , headers: { 'Content-Type': spire.headers.mediaType('billing')
        , 'Accept': spire.headers.mediaType('billing')
        }
      , dataType: 'json'
      , error: function(xhr, status, errorThrown){
          var error = new XHRError(xhr, status, errorThrown);

          callback(error);
        }
      , success: function(billing, status, xhr){
          callback(null, billing);
        }
    });
  };
})(jQuery);
