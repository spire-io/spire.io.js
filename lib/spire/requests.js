// # ResponseError
//
// ResponseError is a wrapper for request errors, this makes it easier to pass an
// error to the callbacks of the async functions that still retain their extra
// contextual information passed into the `arguments` of `requests`'s `error`
// handler
var ResponseError = function (response) {
  this.name = 'ResponseError';
  this.message = 'ResponseError';
  this.response = response;
  this.status = response.status;
};

ResponseError.prototype = new Error();

// # Requests
var Requests = function (spire) {
  this.agent = spire.agent;

  this.description = new Description(spire);
  this.sessions = new Sessions(spire);
  this.channels = new Channels(spire);
  this.subscriptions = new Subscriptions(spire);
  this.messages = new Messages(spire);
  this.accounts = new Accounts(spire);
  this.billing = new Billing(spire);
};

module.exports = Requests;

var Description = function (spire) {
  this.spire = spire;
};

// ## Description.get
//
// Gets the description resource object and caches it for later, the
// `callback` is triggered with an `error` object and the `description`
// resource object.
Description.prototype.get = function (callback) {
  var spire = this.spire;
  // If discovery has already happened use the cache.
  if (spire.resources) {
    var description = { resources: spire.resources
        , schema: spire.schema
        }
    ;

    return callback(null, description);
  }

  // If there isn't a cache make an XHR to get the description.
  spire.shred.get({
    url: spire.options.url,
    headers: {
      accept: "application/json"
    },
    on: {
      error: function(response){
        var error = new ResponseError(response);
        callback(error);
      },

      success: function(response){
        spire.resources = response.body.data.resources;
        spire.schema = response.body.data.schema;

        callback(null, response.body.data);
      }
    }
  });
};

var Sessions = function (spire) {
  this.spire = spire;
};

Sessions.prototype.get = function(session, callback){
  var spire = this.spire;
  spire.shred.get({
    url: session.url,
    headers: {
      'Accept': spire.headers.mediaType('session'),
      'Authorization': spire.headers.authorization(session)
    },
    on: {
      error: function(response){
        var error = new ResponseError(response);
        callback(error);
      },
      success: function(response){
        callback(null, response.body.data);
      }
    }
  });
};

Sessions.prototype.create = function(options, callback){
  var spire = this.spire;
  if (! options.key && (typeof options.email !== 'string' && typeof options.password !== 'string')){
    var message = [ 'You need a key to do that! Try doing this:'
        , '   spire.options.key = <your account key>'
        ].join('\n');
    ;

    throw new Error(message);
  }

  if (options.email && options.password) options.key = null;

  spire.shred.post({
    url: spire.resources.sessions.url,
    headers: {
      'Content-Type': spire.headers.mediaType('account'),
      'Accept': spire.headers.mediaType('session')
    },
    content: options,
    on: {
      error: function(response){
        var error = new ResponseError(response);
        callback(error);
      },
      success: function(response){
        callback(null, response.body.data);
      }
    }
  });
};

var Channels = function (spire) {
  this.spire = spire;
};

Channels.prototype.get = function(channel, callback){
  var spire = this.spire;
  spire.shred.get({
    url: channel.url,
    headers: {
      'Authorization': spire.headers.authorization(channel),
      'Accept': spire.headers.mediaType('channel')
    },
    on: {
      error: function(response){
        var error = new ResponseError(response);
        callback(error);
      },
      success: function(response){
        callback(null, response.body.data);
      }
    }
  });
};

Channels.prototype.getAll = function(options, callback){
  var spire = this.spire;
  var channels = spire.session.resources.channels;

  spire.shred.get({
    url: channels.url,
    headers: {
      'Authorization': spire.headers.authorization(channels),
      'Accept': spire.headers.mediaType('channels')
    },
    on: {
      error: function(response){
        var error = new ResponseError(response);
        callback(error);
      },
      success: function(response){
        callback(null, response.body.data);
      }
    }
  });
};

Channels.prototype.getByName = function(options, callback){
  var spire = this.spire;
  var channels = spire.session.resources.channels
    , name = options.name
  ;

  spire.shred.get({
    url: channels.url,
    headers: {
      'Authorization': spire.headers.authorization(channels),
      'Accept': spire.headers.mediaType('channels')
    },
    query: {
      name: name
    },
    on: {
      error: function(response){
        var error = new ResponseError(response);
        callback(error);
      },
      success: function(response){
        callback(null, response.body.data);
      }
    }
  });
};

Channels.prototype.create = function(options, callback){
  var spire = this.spire;
  var channels = spire.session.resources.channels
    , name = options.name
  ;

  var channel = spire
    .session
    .resources
    .channels
    .resources[name]
  ;

  if (channel) {
    callback(null, channel);
    return;
  }

  spire.shred.post({
    url: channels.url,
    headers: {
      'Content-Type': spire.headers.mediaType('channel'),
      'Accept': spire.headers.mediaType('channel'),
      'Authorization': spire.headers.authorization(channels)
    },
    content: { name: name },
    on: {
      error: function(response){
        var error = new ResponseError(response);
        callback(error);
      },
      success: function(response){
        spire.session.resources.channels
          .resources[options.name] = response.body.data;
        callback(null, response.body.data);
      }
    }
  });
};

var Subscriptions = function (spire) {
  this.spire = spire;
};

/*

{
  channels: [ channel ],
  events: [ 'messages' ]
}

*/
Subscriptions.prototype.create = function(options, callback){
  var spire = this.spire;
  var subscriptions = spire.session.resources.subscriptions
    , data = { events: options.events
      , channels: []
      }
  ;

  // **!** The subscription create request wants an array of channel urls
  // not 'channel' resource objects.
  for (var i = 0; i < options.channels.length; i++) {
    data.channels.push(options.channels[i].url);
  }
  
  spire.shred.post({
    url: subscriptions.url,
    headers: {
      'Content-Type': spire.headers.mediaType('subscription'),
      'Accept': spire.headers.mediaType('subscription'),
      'Authorization': spire.headers.authorization(subscriptions)
    },
    content: data,
    on: {
      error: function(response){
        var error = new ResponseError(response);
        callback(error);
      },
      success: function(response){
        callback(null, response.body.data);
      }
    }
  });
};

/*

{
  timeout: ...,
  subscription: subscription
}

*/
Subscriptions.prototype.get = function(options, callback){
  var spire = this.spire;
  var subscription = options.subscription;

  var data = {
    timeout: options.timeout || spire.options.timeout/1000,
    "order-by": options['order_by'] || options.order_by || 'desc',
    limit: options.limit || '10',
    delay: options.delay || 0,
    "last-message": subscription["last-message"] || options["last-message"] || options.last_message || 0
  };

  spire.shred.get({
    url: subscription.url,
    // timeout: options.timeout + 10000,
    headers: {
      'Content-Type': spire.headers.mediaType('events'),
      'Accept': spire.headers.mediaType('events'), 
      'Authorization': spire.headers.authorization(subscription)
    },
    query: data,
    on: {
      timeout: function(response) {
        // fake a returned events object
        callback(null, { messages: [] });
      },
      error: function(response){
        var error = new ResponseError(response);
        callback(error);
      },
      success: function(response){
        var messageCount = response.body.data.messages.length
        if (messageCount > 0){
          var last = data['order-by'] === 'asc' ? 0 : messageCount - 1;
          subscription['last-message'] = response.body.data.messages[last].timestamp;
        }
        callback(null, response.body.data);
      }
    }
  });
};

var Messages = function (spire) {
  this.spire = spire;
}

// { channel: {}, content: .. }
Messages.prototype.create = function(options, callback){
  var spire = this.spire;
  var channel = options.channel
    , content = options.content
  ;
  
  spire.shred.post({
    url: channel.url,
    headers: {
      'Content-Type': spire.headers.mediaType('message'),
      'Accept': spire.headers.mediaType('message'),
      'Authorization': spire.headers.authorization(channel)
    },
    content: { content: content },
    on: {
      error: function(response){
        var error = new ResponseError(response);
        callback(error);
      },
      success: function(response){
        callback(null, response.body.data);
      }
    }
  });
};

var Accounts = function (spire) {
  this.spire = spire;
};

Accounts.prototype.create = function(account, callback){
  var spire = this.spire;
  spire.shred.post({
    url: spire.resources.accounts.url,
    headers: {
      'Content-Type': spire.headers.mediaType('account'),
      'Accept': spire.headers.mediaType('session')
    },
    content: account,
    on: {
      error: function(response){
        var error = new ResponseError(response);
        callback(error);
      },
      success: function(response){
        spire.session = response.body.data;
        callback(null, response.body.data);
      }
    }
  });
};

Accounts.prototype.update = function(account, callback){
  var spire = this.spire;
  spire.shred.put({
    url: account.url,
    headers: {
      'Content-Type': spire.headers.mediaType('account'),
      'Accept': spire.headers.mediaType('account'),
      'Authorization': spire.headers.authorization(account)
    },
    content: account,
    on: {
      error: function(response){
        var error = new ResponseError(response);
        callback(error);
      },
      success: function(response){
        spire.session = response.body.data;
        callback(null, response.body.data);
      }
    }
  });
};

Accounts.prototype.reset = function(account, callback){
  var spire = this.spire;
  spire.shred.post({
    url: account.url,
    headers: {
      'Content-Type': spire.headers.mediaType('account'),
      'Accept': spire.headers.mediaType('account'),
      'Authorization': spire.headers.authorization(account)
    },
    on: {
      error: function(response){
        var error = new ResponseError(response);
        callback(error);
      },
      success: function(response){
        spire.session = response.body.data;
        callback(null, response.body.data);
      }
    }
  });
};

var Billing = function (spire) {
  this.spire = spire;
};

Billing.prototype.get = function(callback){
  var spire = this.spire;
  spire.shred.get({
    url: spire.resources.billing.url,
    headers: {
      'Content-Type': spire.headers.mediaType('billing'),
      'Accept': spire.headers.mediaType('billing')
    },
    on: {
      error: function(response){
        var error = new ResponseError(response);
        callback(error);
      },
      success: function(response){
        callback(null, response.body.data);
      }
    }
  });
};
