// # spire.messages
//
// Provides a high level interface for message publishing and subscribing.
var Messages = function (spire) {
  this.spire = spire;
  this.queue = [];
};

module.exports = Messages;

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
// You can also pass in a hash of options to the subscription.  Accepted
// options are 'limit', 'order_by', 'timeout', and 'delay'.
//
Messages.prototype.subscribe = function(name, subOptions, callback){
  var spire = this.spire;
  if (arguments.length === 2 && typeof subOptions === 'function') {
    callback = subOptions;
    subOptions = {};
  }

  spire.connect(function(err, session){
    if (err) return callback(err);

    var subscriptionCallCount = 0;

    // Get events from the subscription
    var get = function (options) {
      subscriptionCallCount++;
      if (subOptions.maxCallCount < subscriptionCallCount) {
        return;
      }

      for (var key in subOptions) {
        options[key] = subOptions[key];
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

    var channelOptions = {
      name: name
    };

    spire.requests.channels.create(channelOptions, function(err, channel){
      if (err) {
        if (err.status === 409) {
          // do nothing, the channel already exists
        } else {
          return callback(err);
        }
      }

      spire.requests.channels.getByName(channelOptions, function(err, channels){
        if (err) return callback(err);

        var subCreateOptions = {
          channels: [ channels[channelOptions.name] ],
          events: [ 'messages' ]
        };

        spire.requests.subscriptions.create(subCreateOptions, function(err, sub){
          if (err) return callback(err);

          // Kick off long-polling
          get({ subscription: sub });
        });
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
Messages.prototype.publish = function(message, callback){
  var spire = this.spire;
  // If the `spire` is busy connecting, queue the message and return.
  if (spire.isConnecting){
    this.queue.push({ message: message
    , callback: callback
    });

    return;
  }

  callback = callback || function () {};

  // Connect; discover and create a session.
  spire.connect(function(err, session){
    if (err) return callback(err);

    var channelOptions = {
      name: message.channel
    };

    // Create the channel before sending a message to it.
    spire.requests.channels.create(channelOptions, function(err, channel){
      if (err) {
        if (err.status === 409) {
          // do nothing, the channel already exists
        } else {
          return callback(err);
        }
      }

      spire.requests.channels.getByName(channelOptions, function(err, channels){
        if (err) return callback(err);

        var createOptions = {
            channel: channels[channelOptions.name]
          , content: message.content
        };

        // Finally send the message.
        spire.requests.messages.create(createOptions, function(err, message){
          if (err) return callback(err);

          if (callback) callback(null, message);
        });
      });
    });
  });
};
