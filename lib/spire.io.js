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
  var Headers = require('./spire/headers');
  var Accounts = require('./spire/accounts');

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

    this.shred = new Shred();
    this.requests = new Requests(this);
    this.messages = new Messages(this);
    this.headers = new Headers(this);
    this.accounts = new Accounts(this);

    var spire = this;


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
