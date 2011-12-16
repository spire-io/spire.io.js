// $.spire is a jQuery plugin designed to help you get your client-side web applications up and running with the high level services provided by the spire.io API. This plugin also exposes a methodology for directly interfacing with the spire.io REST interface.

// You can learn more about spire.io and it's services at http://spire.io, or find help with the following things:

// * source code
// * issues
// * contact spire.io
// * #spire

(function($){
  var XHRError = function(xhr, status, err, message){
    this.name = 'XHRError';
    this.message = message || 'XHRError';
    this.xhr = xhr;
    this.status = status;
    this.jqueryErr = err;
  };

  XHRError.prototype = new Error();
  XHRError.prototype.constructor = XHRError;



  // # $.spire
  //
  // Set up the $.spire object with default `options` for `url`, `version`, and `timeout` as well as some stub objects to make method definitions obvious.
  $.spire = { options: { url: 'http://api.spire.io'
    // **$.spire.options.version** The spire.io API version to use when making requests for resources. **defaults to 1.0**
    , version: '1.0'
    // **$.spire.options.timeout** The timeout for long-polling in seconds, defaults to 30 seconds
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

  // # $.spire.headers

  // Helpers for generating headers to send in the http requests to the spire.io API.

  // ## $.spire.headers.authorization
  //
  // Generate the authorization header for a resource with a capability. Requires a resource object with a `capability` key.
  //
  //     authorization = $.spire.headers.authorization(subscription);
  //     //=> 'Capability 5iyTrZrcGw/X4LxhXJRIEn4HwFKSFB+iulVKkUjqxFq30cFBqEm'
  //
  $.spire.headers.authorization = function(resource){
    return ['Capability', resource.capability].join(' ');
  };

  // ## $.spire.headers.mediaType
  //
  // Generate either a 'content-type' or 'authorization' header, requires a string with the name of the resource so it can extract the media type from the API's schema.
  //
  //     $.spire.headers.mediaType('channel');
  //     //=> 'application/vnd.spire-io.channel+json;version=1.0'
  $.spire.headers.mediaType = function(resourceName){
    return $.spire.schema[$.spire.options.version][resourceName].mediaType
  };

  // # $.spire.messages
  //
  // Provides a high level interface for sending and receiving messages through the spire.io API

  // ## $.spire.messages.subscribe
  //
  // Subscribe to a channel with the `name`, when new messages come in trigger the `callback` every time. This method uses long-polling to get the events from a subscription resource and wraps up all the complexities of interfacing with the REST API (discovery, session creation, channel creation, subscription creation, and event listening for the subscription).
  //
  // The callback takes two arguments, an `error` and a `messages` array
  //
  //     $.spire.messages.subscribe('chat example', function(err, messages){
  //       $.each(messages, function(i, message){
  //         var el = $('<div class="message">').text(message);
  //
  //         $('.messages').append(el);
  //       });
  //     });
  $.spire.messages.subscribe = function(name, callback){
    $.spire.connect(function(err, session){
      if (err) return callback(err);

      var options = { session: session
          , name: name
          }
      ;

      $.spire.requests.channels.create(options, function(err, channel){
        if (err) return callback(err);

        var options = { channels: [ channel ]
            , events: [ 'messages' ]
            , session: session
            }
        ;


        $.spire.requests.subscriptions.create(options, function(err, sub){
          if (err) return callback(err);

          var options = { subscription: sub };

          // get the events from the subscription
          var get = function(){
            $.spire.requests.subscriptions.get(options, function(err, events){
              if (err) return callback(err);

              if (events.messages.length > 0){
                callback(null, events.messages);
              }

              // start over
              get();
            });
          }

          get();
        });
      });
    });
  };



  // ## $.spire.messages.publish
  //
  // Publish a message to the API, the method takes the `options` `channel` which is the name of the channel to publish the message to and `content` which is the content of the message you want to publish. It can also take an optional callback which gets called with an `error` and a `message` object.
  //
  //       var options = { channel: 'chat example', content: 'herow' };
  //
  //       $.spire.messages.publish(options);
  //
  //   Or:
  //
  //       $.spire.messages.publish(options, function(err, message){
  //          // you should probably do something useful though
  //         if (err) throw err;
  //
  //         $('form').hide();
  //       });
  //
  $.spire.messages.publish = function(message, callback){
    // busy connecting, queuing the message
    if ($.spire.isConnecting){
      $.spire.messages.queue.push({ message: message
      , callback: callback
      });

      return;
    }

    $.spire.connect(function(err, session){
      if (err) return callback(err);

      var options = { session: session
          , name: message.channel
          }
      ;

      $.spire.requests.channels.create(options, function(err, channel){
        if (err) return callback(err);

        var options = { channel: channel
            , content: message.content
            }
        ;

        // send message
        $.spire.requests.messages.create(options, function(err, message){
          if (err) return callback(err);

          if (callback) callback(null, message);
        });
      });
    });
  };

/*

A shortcut to account creation, triggers the callback with an err, and a session for that user.

*/
  $.spire.accounts.create = function(account, callback){
    $.spire.requests.description.get(function(err, description){
      if (err) return callback(err);

      $.spire.requests.accounts.create(account, callback);
    });
  };

/*

needs the account resource from an authenticated session, or an account object with credentials

*/
  $.spire.accounts.update = function(account, callback){
    $.spire.requests.description.get(function(err, description){
      if (err) return callback(err);

      $.spire.requests.accounts.update(account, callback);
    });
  };

  // creates a session for a given account, expects a login and a password.
  // the callback gets called with the args `err`, `session`
  $.spire.accounts.authenticate = function(account, callback){
    $.spire.requests.description.get(function(err, description){
      if (err) return callback(err);

      var options = { key: $.spire.options.key
          , email: account.email
          , password: account.password
          }

      $.spire.requests.sessions.create(options, callback);
    });
  };

  // provides a single point of connection that builds up the needed objects
  // for discovery and sharing a session between requests.
  // the callback is triggered with an error and a session
  $.spire.connect = function(callback){
    $.spire.isConnecting = true;

    $.spire.requests.description.get(function(err, description){
      if (err) return callback(err);

      var options = { key: $.spire.options.key }

      ;

      var sessionBack = function(err, session){
        if (err) return callback(err);

        $.spire.isConnecting = false;
        // save it for later.
        $.spire.session = session;

        // publish any messages in the queue
        if ($.spire.messages.queue.length > 0){
          $.each($.spire.messages.queue, function(i){
            var args = $.spire.messages.queue.pop()


            // try it again, its possible this loop might get fired in
            // parallel effecting the queue so make sure that the args are
            // defined before calling the publish function
            if (args) $.spire.messages.publish(args.message, args.callback);
          });
        }

        return callback(null, session);
      };

      if ($.spire.session) {
        // console.log('needs to handle exisiting session');
        sessionBack(null, $.spire.session);
      } else {
        // console.log('needs to create session');
        $.spire.requests.sessions.create(options, sessionBack);
      }
    });
  };

  // requests are raw and assume noting besides the spire url

  // gets the description resource object and caches it for later, the callback is triggered with an err and the description resource
  $.spire.requests.description.get = function(callback){
    // if discovery has already happened use the cache
    if ($.spire.resources) {
      var description = { resources: $.spire.resources
          , schema: $.spire.schema
          }
      ;

      return callback(null, description);
    }


    $.ajax({ type: 'GET'
      , url: $.spire.options.url
      , dataType: 'json'
      , error: function(xhr, status, errorThrown){
          var error = new XHRError(arguments);
          callback(error);
        }
        // xhr handlers always get executed on the window, I tried to
        // write a nice wrapper to help with testing but all it's methods
        // were getting called with `this` bound to the window
      , success: function(description, status, xhr){
          $.spire.resources = description.resources;
          $.spire.schema = description.schema;

          callback(null, description);
        }
    });
  };

  $.spire.requests.sessions.create = function(options, callback){
    if (! options.key && !(options.email && options.password)){
      var message = [ 'You need a key to do that! Try doing this:'
          , '   $.spire.options.key = <your account key>'
          ].join('\n');
      ;

      throw new Error(message);
    }

    if (options.email && options.password) options.key = null;

    $.ajax({ type: 'post'
      , url: $.spire.resources.sessions.url
      , beforeSend: function(xhr){ xhr.withCredentials = true; }
      , headers: { 'Content-Type': $.spire.headers.mediaType('account')
        , 'Accept': $.spire.headers.mediaType('session')
        }
      , data: JSON.stringify(options)
      , dataType: 'json'
      , error: function(xhr){
          var error = new XHRError(arguments);
          callback(error);
        }
      , success: function(session, status, xhr){
          callback(null, session);
        }
    });
  };

  $.spire.requests.channels.create = function(options, callback){
    var channels = options.session.resources.channels
      , name = options.name
    ;

    $.ajax({ type: 'post'
      , url: channels.url
      , beforeSend: function(xhr){
          xhr.withCredentials = true;
        }
      , headers: { 'Content-Type': $.spire.headers.mediaType('channel')
        , 'Accept': $.spire.headers.mediaType('channel')
        , 'Authorization': $.spire.headers.authorization(channels)
        }
      , data: JSON.stringify({ name: name })
      , dataType: 'json'
      , error: function(xhr){
          var error = new XHRError(arguments);
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
  $.spire.requests.subscriptions.create = function(options, callback){
    var subscriptions = options.session.resources.subscriptions
      , data = { events: options.events
        , channels: []
        }
    ;

    // The sub create request wants an array of channel urls not 'channel' resources
    $.each(options.channels, function(i, channel){
      data.channels.push(channel.url);
    });

    $.ajax({ type: 'post'
      , url: subscriptions.url
      , beforeSend: function(xhr){ xhr.withCredentials = true; }
      , headers: { 'Content-Type': $.spire.headers.mediaType('subscription')
        , 'Accept': $.spire.headers.mediaType('subscription')
        , 'Authorization': $.spire.headers.authorization(subscriptions)
        }
      , data: JSON.stringify(data)
      // , dataType: 'json'
      , error: function(xhr){
          var error = new XHRError(arguments);
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
  $.spire.requests.subscriptions.get = function(options, callback){
    var subscription = options.subscription
      data = { timeout: options.timeout || $.spire.options.timeout/1000 }
    ;

    data['last-message'] = subscription['last-message'];

    $.ajax({ type: 'get'
      , url: subscription.url
      // , timeout: options.timeout + 10000
      , beforeSend: function(xhr){ xhr.withCredentials = true; }
      , headers: { 'Content-Type': $.spire.headers.mediaType('events')
        , 'Accept': $.spire.headers.mediaType('events')
        , 'Authorization': $.spire.headers.authorization(subscription)
        }
      , data: data
      , error: function(xhr, status, err){
          // fake a returned events object
          if (err === 'timeout') {
            callback(null, { messages: [] });
          } else {
            var error = new XHRError(arguments);
            callback(error);
          }
        }
      , success: function(events, status, xhr){
          // set the last message key if there are messages
          if (events.messages.length > 0){
            subscription['last-message'] = $(events.messages)
              .last()[0]
              .timestamp;
          }

          callback(null, events);
        }
    });
  };

  // { channel: {}, content: .. }
  $.spire.requests.messages.create = function(options, callback){
    var channel = options.channel
      , content = options.content
    ;

    $.ajax({ type: 'post'
      , url: channel.url
      , beforeSend: function(xhr){ xhr.withCredentials = true; }
      , headers: { 'Content-Type': $.spire.headers.mediaType('message')
        , 'Accept': $.spire.headers.mediaType('message')
        , 'Authorization': $.spire.headers.authorization(channel)
        }
      , data: JSON.stringify({ content: content })
      , error: function(xhr){
          var error = new XHRError(arguments);
          callback(error);
        }
      , success: function(message, status, xhr){
          callback(null, message);
        }
    });
  };

  $.spire.requests.accounts.create = function(account, callback){
    $.ajax({ type: 'post'
      , url: $.spire.resources.accounts.url
      , headers: { 'Content-Type': $.spire.headers.mediaType('account')
        , 'Accept': $.spire.headers.mediaType('session')
        }
      , data: JSON.stringify(account)
      , success: function(session, status, xhr){
          callback(null, session);
        }
      , error: function(xhr, status, err){
          var error = new XHRError(arguments);
          callback(error);
        }
    });
  };

  $.spire.requests.accounts.update = function(account, callback){
    $.ajax({ type: 'put'
      , url: account.url
      , headers: { 'Content-Type': $.spire.headers.mediaType('account')
        , 'Accept': $.spire.headers.mediaType('account')
        , 'Authorization': $.spire.headers.authorization(account)
        }
      , data: JSON.stringify(account)
      , success: function(account, status, xhr){
          callback(null, account);
        }
      , error: function(xhr, status, err){
          var error = new XHRError(arguments);
          callback(error);
        }
    });
  };

  $.spire.requests.accounts.reset = function(account, callback){
    $.ajax({ type: 'post'
      , url: account.url
      , headers: { 'Content-Type': $.spire.headers.mediaType('account')
        , 'Accept': $.spire.headers.mediaType('account')
        , 'Authorization': $.spire.headers.authorization(account)
        }
      , success: function(account, status, xhr){
          callback(null, account);
        }
      , error: function(xhr, status, err){
          var error = new XHRError(arguments);
          callback(error);
        }
    });
  };

  $.spire.requests.billing.get = function(callback){
    $.ajax({ type: 'GET'
      , url: $.spire.resources.billing.url
      , headers: { 'Content-Type': $.spire.headers.mediaType('billing')
        , 'Accept': $.spire.headers.mediaType('billing')
        }
      , error: function(xhr, status, errorThrown){
          var error = new XHRError(arguments);

          callback(error);
        }
        // xhr handlers always get executed on the window, I tried to
        // write a nice wrapper to help with testing but all it's methods
        // were getting called with `this` bound to the window
      , success: function(billing, status, xhr){
          callback(null, billing);
        }
    });
  };
})(jQuery);