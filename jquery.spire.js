
(function($){
  $.spire = { options: { url: 'http://api.spire.io'
    , version: '1.0'
    , timeout: 1000 * 30 // 30 secs
    }
  , isConnecting: false
  , headers: {}
  , messages: { queue: [] }
  , requests: { description: {}
    , sessions: {}
    }
  };

  $.spire.headers.authorization = function(resource){
    return ['Capability', resource.capability].join(' ');
  };

  $.spire.headers.mediaType = function(resourceName){
    return $.spire.schema[$.spire.options.version][resourceName].mediaType
  };

  $.spire.messages.subscribe = function(name, callback){

    // connect
    $.spire.connect(function(session){
      console.log('connected with session', session);
    });
  };

  // provides a single point of connection that builds up the needed objects
  // for discovery and sharing a session between requests.
  // the callback is triggered with an error and a session
  $.spire.connect = function(callback){
    $.spire.isConnecting = true;

    $.spire.requests.description.get(function(err, description){
      if (err) throw err;

      var options = { key: $.spire.options.key }
      ;

      $.spire.requests.sessions.create(options, function(err, session){
        if (err) throw err;

        $.spire.messages.session = session;
      });
    });
  };

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
          // throw new Error('Problem with the spire.io discovery request');
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
    if (! options.key){
      var message = [ 'You need a key to do that! Try doing this:'
          , '   $.spire.options.key = <your account key>'
          ].join('\n');
      ;

      throw new Error(message);
    }

    $.ajax({ type: 'post'
      , url: $.spire.resources.sessions.url
      , beforeSend: function(xhr){ xhr.withCredentials = true; }
      , headers: { 'Content-Type': $.spire.headers.mediaType('account')
        , 'Accept': $.spire.headers.mediaType('session')
        }
      , data: JSON.stringify({ key: options.key })
      , dataType: 'json'
      , error: function(xhr){
          // ...
        }
      , success: function(session, status, xhr){
          callback(null, session);
        }
    });
  };

  //   // uses a cached session which is shared between pub and sub
  //     // Sets up a subscription listener on the channel with the passed in name and fires the callback anytime a message event is returned from the API
  //     subscribe: function(channelName, callback){
  //       var requests = $.spire.requests
  //       ;
  //
  //       return;
  //
  //       // get a description of the api to make subsequent requests
  //       requests.description.get(function(err, description){
  //
  //         var createChannel = function(session){
  //           console.log('creating channel with session', session);
  //
  //           // channel
  //           requests.channels.create(channelName, session, function(err, channel){
  //             // subscription
  //             var options = { channels: [ channel ]
  //                 , events: [ 'messages' ]
  //                 , session: session
  //                 }
  //             ;
  //
  //             requests.subscriptions.create(options, function(err, subscription){
  //               console.log('subscription created', subscription);
  //
  //               var options = { subscription: subscription
  //                   }
  //               ;
  //
  //               var started = new Date();
  //
  //               var get = function(){
  //                 requests.subscriptions.get(options, function(err, events){
  //
  //                   var ended = new Date();
  //
  //                   console.log('events after', (ended - started), events);
  //
  //                   if (events.messages > 0 ){
  //                     callback(null, messages)
  //                     // keep track of last message key
  //                   }
  //
  //                   get();
  //                 });
  //               };
  //
  //               // listen listen for events on the subscription in a loop
  //               get();
  //             });
  //             });
  //         };
  //
  //         var createSession = function(){
  //           // we need a session
  //           requests.sessions.create(function(err, session){
  //             console.log('session created and cached', session);
  //             // caching for other $.spire.messages requests
  //             $.spire.messages.session = session;
  //             createChannel($.spire.messages.session);
  //           });
  //         };
  //
  //         // check for the session before doing anythign else
  //         // if ($.spire.messages.session) createChannel($.spire.messages.session);
  //         // else createSession();
  //       });
  //
  //       // $.spire
  //       //   .requests
  //       //   .subscriptions
  //       //   .create('random channel', function(err, subscription){
  //       //     $.spire
  //       //       .requests
  //       //       .subscriptions
  //       //       .get(subscription, callback);
  //       //   });
  //
  //
  //       // $.spire
  //       //   .requests
  //       //   .channels
  //       //   .create('random channel too', function(err, channel){
  //       //     $.spire
  //       //       .requests
  //       //       .messages
  //       //       .create(channel, newMessage.content, callback);
  //       //   });
  //     },
  //
  //     publish: function(channelName, content, callback){
  //       var requests = $.spire.requests
  //       ;
  //
  //       if (!!$.spire.messages.isConnecting) {
  //         console.log('publish connecting adding message to a queue');
  //         $.spire.messages.queue.push(content);
  //       } else {
  //         console.log('should probably connect here...');
  //       }
  //
  //       console.log('wtf');
  //
  //       return;
  //
  //       console.log('sending message with content', content);
  //       // get a description of the api to make subsequent requests
  //       requests.description.get(function(err, description){
  //         //
  //         // // we need a session
  //         // // TODO: only do this if you have to
  //         // requests.sessions.create(function(err, session){
  //         //   console.log('session created', session);
  //         //
  //         //   // channel
  //         //   requests.channels.create(channelName, session, function(err, channel){
  //         //     console.log('channel created', channel);
  //         //
  //         //     // send message
  //         //     requests.messages.create(channel, content, function(err, message){
  //         //       console.log('message created', message);
  //         //     });
  //         //   });
  //         // });
  //       });
  //
  //     }
  //   },
  //

  //
  //     sessions: {
  //       create: function(callback){
  //       }
  //     },
  //
  //     channels: {
  //       // session is optional, if it isn't present a session will be crated
  //       // for you
  //       create: function(name, session, callback){
  //         if (typeof session === 'function') {
  //           callback = session;
  //           session = undefined;
  //         }
  //
  //         var request = function(err, session){
  //           if (err) throw err;
  //
  //           var channels = session.resources.channels;
  //           ;
  //
  //           $.ajax({ type: 'post'
  //             , url: channels.url
  //             , beforeSend: function(xhr){
  //                 xhr.withCredentials = true;
  //               }
  //             , headers: { 'Content-Type': $.spire.headers.mediaType('channel')
  //               , 'Accept': $.spire.headers.mediaType('channel')
  //               , 'Authorization': $.spire.headers.authorization(channels)
  //               }
  //             , data: JSON.stringify({ name: name })
  //             , dataType: 'json'
  //             , error: function(xhr){
  //               // ...
  //               }
  //             , success: function(channel, status, xhr){
  //                 console.log('channel', channel);
  //                 callback(null, channel);
  //               }
  //           });
  //         };
  //
  //         if (!session) $.spire.requests.sessions.create(request);
  //         else request(null, session);
  //       }
  //     },
  //
  //     subscriptions: {
  //       /*
  //
  //       {
  //         channels: [ channel ],
  //         events: [ 'messages' ],
  //         session: sessionObj
  //       }
  //
  //       */
  //       create: function(options, callback){
  //         var subscriptions = options.session.resources.subscriptions
  //           , authorization = $.spire.headers.authorization(subscriptions)
  //           , data = { events: options.events
  //             , channels: []
  //             }
  //           , channels
  //         ;
  //
  //         // The sub create request wants an array of channel urls not 'channel' resources
  //         $.each(options.channels, function(i, channel){
  //           data.channels.push(channel.url);
  //         });
  //
  //         $.ajax({ type: 'post'
  //           , url: subscriptions.url
  //           , beforeSend: function(xhr){ xhr.withCredentials = true; }
  //           , headers: { 'Content-Type': $.spire.headers.mediaType('subscription')
  //             , 'Accept': $.spire.headers.mediaType('subscription')
  //             , 'Authorization': $.spire.headers.authorization(subscriptions)
  //             }
  //           , data: JSON.stringify(data)
  //           // , dataType: 'json'
  //           , error: function(xhr){
  //             // ...
  //             }
  //           , success: function(subscription, status, xhr){
  //               console.log('subscription', subscription);
  //               callback(null, subscription);
  //             }
  //         });
  //       },
  //
  //       // somehow needs to take a ton of options, use a channel name, or
  //       // subscription object
  //       //
  //       // scratch that
  //       //
  //       // Asking for any events on the passed in channel
  //       //
  //       /*
  //
  //       {
  //         timeout: ...,
  //         subscription: subscription
  //       }
  //
  //       */
  //       get: function(options, callback) {
  //         var subscription = options.subscription
  //           data = { timeout: options.timeout || $.spire.options.timeout/1000 }
  //         ;
  //
  //         data['last-message'] = subscription['last-message'];
  //
  //         console.log('subscriptions.get with options', options);
  //
  //         $.ajax({ type: 'get'
  //           , url: subscription.url
  //           // , timeout: options.timeout + 10000
  //           , beforeSend: function(xhr){ xhr.withCredentials = true; }
  //           , headers: { 'Content-Type': $.spire.headers.mediaType('events')
  //             , 'Accept': $.spire.headers.mediaType('events')
  //             , 'Authorization': $.spire.headers.authorization(subscription)
  //             }
  //           , data: data
  //           , error: function(xhr, status, err){
  //             console.log('errr', err);
  //               // fake a returned events object
  //               if (err === 'timeout') callback(null, { messages: [] });
  //             }
  //           , success: function(events, status, xhr){
  //               callback(null, events);
  //             }
  //         });
  //
  //       }
  //     },
  //
  //     messages: {
  //       create: function(channel, content, callback){
  //
  //         console.log('channel', channel);
  //
  //         $.ajax({ type: 'post'
  //           , url: channel.url
  //           , beforeSend: function(xhr){ xhr.withCredentials = true; }
  //           , headers: { 'Content-Type': $.spire.schema.message.mediaType
  //             , 'Accept': $.spire.schema.message.mediaType
  //             , 'Authorization': [ 'Capability'
  //               , channel.capability
  //               ].join(' ')
  //             }
  //           , data: JSON.stringify({ content: content })
  //           , error: function(xhr){
  //             // ...
  //             }
  //           , success: function(message, status, xhr){
  //               console.log('message', message);
  //               callback(null, message);
  //             }
  //         });
  //       }
  //     }
  //   }
  // };
})(jQuery);