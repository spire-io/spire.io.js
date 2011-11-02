
(function($){
  $.spire = {
    options: { url: 'http://api.spire.io'
    , version: '1.0'
    , timeout: 60000 // 1 minute
    },
    isDiscovered: function(){
      return !!$.spire.resources;
    },
    requests: {
      // Makes the discovery request to the spire.io API, triggers the passed
      // in callback.
      /*

      discovery(function(err, ))

      */
      description: function(callback){
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
              $.spire.schema = description.schema[$.spire.options.version];

              console.log('description', description  );
              callback(null, description);
            }
        });
      },

      sessions: {
        create: function(callback){
          if (!$.spire.options.key) {
            throw new Error([
              'You need a key to do that! Try doing this:',
              '   $.spire.options.key = <your account key>'
            ].join('\n'));
          }

          var request = function(){
            $.ajax({ type: 'post'
              , url: $.spire.resources.sessions.url
              , beforeSend: function(xhr){
                  xhr.withCredentials = true;
                }
              , headers: { 'Content-Type': $.spire.schema.account.mediaType
                  , 'Accept': $.spire.schema.session.mediaType
                }
              , data: JSON.stringify({ key: $.spire.options.key })
              , dataType: 'json'
              , error: function(xhr){
                  // ...
                }
              , success: function(session, status, xhr){
                  console.log('session', session);
                  callback(null, session);
                }
            });
          };

          if (!$.spire.isDiscovered()) $.spire.requests.description(request);
          else request();
        }
      },

      channels: {
        // session is optional, if it isn't present a session will be crated
        // for you
        create: function(name, session, callback){
          if (typeof session === 'function') {
            callback = session;
            session = undefined;
          }

          var request = function(err, session){
            if (err) throw err;

            var authHeader = [ 'Capability'
                , session.resources.channels.capability
                ].join(' ')
            ;

            $.ajax({ type: 'post'
              , url: session.resources.channels.url
              , beforeSend: function(xhr){
                  xhr.withCredentials = true;
                }
              , headers: { 'Content-Type': $.spire.schema.channel.mediaType
                , 'Accept': $.spire.schema.channel.mediaType
                , 'Authorization': authHeader
                }
              , data: JSON.stringify({ name: name })
              , dataType: 'json'
              , error: function(xhr){
                // ...
                }
              , success: function(channel, status, xhr){
                  console.log('channel', channel);
                  callback(null, channel);
                }
            });
          };

          if (!session) $.spire.requests.sessions.create(request);
          else request(null, session);
        }
      },

      subscriptions: {
        // session is optional, if it isn't present a session will be crated
        // for you
        create: function(channelName, session, callback){
          if (typeof session === 'function') {
            callback = session;
            session = undefined;
          }

          var sessionHandler
            , channelHandler
            , channel
          ;

          channelHandler = function(err, channel, session){
            var data = { events: [ 'messages' ]
                , channels: [ channel.url ]
                }
              , authHeader = [ 'Capability'
                , session.resources.subscriptions.capability
                ].join(' ')
            ;

            console.log('creating subscription for: ', channel.name);

            $.ajax({ type: 'post'
              , url: session.resources.subscriptions.url
              , beforeSend: function(xhr){
                  xhr.withCredentials = true;
                }
              , headers: { 'Content-Type': $.spire.schema.subscription.mediaType
                , 'Accept': $.spire.schema.subscription.mediaType
                , 'Authorization': authHeader
                }
              , data: JSON.stringify(data)
              , dataType: 'json'
              , error: function(xhr){
                // ...
                }
              , success: function(subscription, status, xhr){
                  console.log('subscription', subscription);
                  callback(null, subscription);
                }
            });
          };

          sessionHandler = function(err, session){
            if (err) throw err;

            var channel = session.resources.channels.resources[channelName]
            ;

            console.log('making a session request');

            if (!channel) {
              console.log('need to make the channel');

              $.spire
                .requests
                .channels
                .create(channelName, session, function(err, channel){
                  channelHandler(err, channel, session);
                });
            } else {
              console.log('channel exisits');
              channelHandler(null, channel, session);
            }
          };

          if (!session) $.spire.requests.sessions.create(sessionHandler);
          else sessionHandler(null, session);
        },

        // somehow needs to take a ton of options, use a channel name, or
        // subscription object
        //
        // scratch that
        //
        // Asking for any events on the passed in channel
        get: function(subscription, callback) {
          var  authHeader = [ 'Capability'
              , subscription.capability
              ].join(' ')
            , lastMessageKey = subscription.lastMessageKey || 0
          ;

          $.ajax({ type: 'get'
            , url: subscription.url
            , timeout: $.spire.options.timeout + 10000
            , beforeSend: function(xhr){ xhr.withCredentials = true; }
            , headers: { 'Content-Type': $.spire.schema.events.mediaType
              , 'Accept': $.spire.schema.events.mediaType
              , 'Authorization': authHeader
              }
            , data: { timeout: $.spire.options.timeout }
            , error: function(xhr, status, err){
                // fake a returned events object
                if (err === 'timeout') callback(null, { messages: [] });
              }
            , success: function(events, status, xhr){
                callback(null, events);
              }
          });

        }
      }
    }
  };
})(jQuery);