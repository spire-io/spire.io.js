// spire.io.js is a library designed to help you get your client-side web applications up and running with the high level services provided by the spire.io API. This plugin also exposes a methodology for directly interfacing with the spire.io REST interface.

// You can learn more about spire.io and it's services at http://spire.io, or find help with the following things:

// * [source code](http://github.com/spire-io/spire.io.js)
// * [issues](http://github.com/spire-io/spire.io.js/issues)
// * [contact spire.io](http://spire.io/contact.html)

!function (name, definition) {
  if (typeof define == 'function') define(definition)
  else if (typeof module != 'undefined') module.exports = definition()
  else this[name] = definition()
}('Spire', function () {
  var Shred = require('shred');
  var Requests = require('./spire/requests');
  var Messages = require('./spire/messages');

  // # Spire
  var Spire = function (opts) {
    opts = opts || {};
    // Set up the spire object with default `options` for `url`, `version`,
    // and `timeout` as well as stub out some objects to make method definitions
    // obvious.
    //
    // * **spire.options.url**: The url of the spire.io API, defaults to
    // [http://api.spire.io](http://api.spire.io).
    this.options = {
      url: opts.url || 'https://api.spire.io',
      // * **spire.options.version**: The spire.io API version to use when making requests for resources, defaults to 1.0.
      version: opts.version || '1.0',
      // * **spire.options.timeout**: The timeout for long-polling in seconds, defaults to 30 seconds
      timeout: opts.timeout || 1000 * 30,
      key: opts.key || null
    };

    this.cache = {};
    this.isConnecting = false;
    this.headers = {};
    this.accounts = {};

    this.requests = new Requests(this);
    this.messages = new Messages(this);
    this.shred = new Shred();

    var spire = this;

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
  };

  return Spire;
});
