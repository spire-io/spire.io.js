var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var res = mod._cached ? mod._cached : mod();
    return res;
}

require.paths = [];
require.modules = {};
require.extensions = [".js",".coffee"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        var y = cwd || '.';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = x + '/package.json';
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key)
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

require.define = function (filename, fn) {
    var dirname = require._core[filename]
        ? ''
        : require.modules.path().dirname(filename)
    ;
    
    var require_ = function (file) {
        return require(file, dirname)
    };
    require_.resolve = function (name) {
        return require.resolve(name, dirname);
    };
    require_.modules = require.modules;
    require_.define = require.define;
    var module_ = { exports : {} };
    
    require.modules[filename] = function () {
        require.modules[filename]._cached = module_.exports;
        fn.call(
            module_.exports,
            require_,
            module_,
            module_.exports,
            dirname,
            filename
        );
        require.modules[filename]._cached = module_.exports;
        return module_.exports;
    };
};

if (typeof process === 'undefined') process = {};

if (!process.nextTick) process.nextTick = (function () {
    var queue = [];
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;
    
    if (canPost) {
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);
    }
    
    return function (fn) {
        if (canPost) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        }
        else setTimeout(fn, 0);
    };
})();

if (!process.title) process.title = 'browser';

if (!process.binding) process.binding = function (name) {
    if (name === 'evals') return require('vm')
    else throw new Error('No such module')
};

if (!process.cwd) process.cwd = function () { return '.' };

require.define("path", function (require, module, exports, __dirname, __filename) {
    function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

});

require.define("/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {}
});

require.define("/spire.io.js", function (require, module, exports, __dirname, __filename) {
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
                  var subscriptionCallCount = 0;
                  var get = function(){
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
          var subscriptionCallCount = 0;
          var get = function(){
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
      , beforeSend: function(xhr){ xhr.withCredentials = true; }
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
      , beforeSend: function(xhr){ xhr.withCredentials = true; }
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
      , beforeSend: function(xhr){
          xhr.withCredentials = true;
        }
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
      , beforeSend: function(xhr){
          xhr.withCredentials = true;
        }
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
      , beforeSend: function(xhr){ xhr.withCredentials = true; }
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
      , beforeSend: function(xhr){ xhr.withCredentials = true; }
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
      , beforeSend: function(xhr){ xhr.withCredentials = true; }
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

});

require.define("/node_modules/reqwest/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"main":"./reqwest.js"}
});

require.define("/node_modules/reqwest/reqwest.js", function (require, module, exports, __dirname, __filename) {
    /*!
  * Reqwest! A general purpose XHR connection manager
  * (c) Dustin Diaz 2011
  * https://github.com/ded/reqwest
  * license MIT
  */
!function (name, definition) {
  if (typeof define == 'function') define(definition)
  else if (typeof module != 'undefined') module.exports = definition()
  else this[name] = definition()
}('reqwest', function () {

  var context = this
    , win = window
    , doc = document
    , old = context.reqwest
    , twoHundo = /^20\d$/
    , byTag = 'getElementsByTagName'
    , readyState = 'readyState'
    , contentType = 'Content-Type'
    , requestedWith = 'X-Requested-With'
    , head = doc[byTag]('head')[0]
    , uniqid = 0
    , lastValue // data stored by the most recent JSONP callback
    , xmlHttpRequest = 'XMLHttpRequest'
    , defaultHeaders = {
          contentType: 'application/x-www-form-urlencoded'
        , accept: {
              '*':  'text/javascript, text/html, application/xml, text/xml, */*'
            , xml:  'application/xml, text/xml'
            , html: 'text/html'
            , text: 'text/plain'
            , json: 'application/json, text/javascript'
            , js:   'application/javascript, text/javascript'
          }
        , requestedWith: xmlHttpRequest
      }
    , xhr = (xmlHttpRequest in win) ?
        function () {
          return new XMLHttpRequest()
        } :
        function () {
          return new ActiveXObject('Microsoft.XMLHTTP')
        }

  function handleReadyState(o, success, error) {
    return function () {
      if (o && o[readyState] == 4) {
        if (twoHundo.test(o.status)) {
          success(o)
        } else {
          error(o)
        }
      }
    }
  }

  function setHeaders(http, o) {
    var headers = o.headers || {}
    headers.Accept = headers.Accept || defaultHeaders.accept[o.type] || defaultHeaders.accept['*']
    // breaks cross-origin requests with legacy browsers
    if (!o.crossOrigin && !headers[requestedWith]) headers[requestedWith] = defaultHeaders.requestedWith
    if (!headers[contentType]) headers[contentType] = o.contentType || defaultHeaders.contentType
    for (var h in headers) {
      headers.hasOwnProperty(h) && http.setRequestHeader(h, headers[h])
    }
  }

  function generalCallback(data) {
    lastValue = data
  }

  function urlappend(url, s) {
    return url + (/\?/.test(url) ? '&' : '?') + s
  }

  function handleJsonp(o, fn, err, url) {
    var reqId = uniqid++
      , cbkey = o.jsonpCallback || 'callback' // the 'callback' key
      , cbval = o.jsonpCallbackName || ('reqwest_' + reqId) // the 'callback' value
      , cbreg = new RegExp('(' + cbkey + ')=(.+)(&|$)')
      , match = url.match(cbreg)
      , script = doc.createElement('script')
      , loaded = 0

    if (match) {
      if (match[2] === '?') {
        url = url.replace(cbreg, '$1=' + cbval + '$3') // wildcard callback func name
      } else {
        cbval = match[2] // provided callback func name
      }
    } else {
      url = urlappend(url, cbkey + '=' + cbval) // no callback details, add 'em
    }

    win[cbval] = generalCallback

    script.type = 'text/javascript'
    script.src = url
    script.async = true
    if (typeof script.onreadystatechange !== 'undefined') {
        // need this for IE due to out-of-order onreadystatechange(), binding script
        // execution to an event listener gives us control over when the script
        // is executed. See http://jaubourg.net/2010/07/loading-script-as-onclick-handler-of.html
        script.event = 'onclick'
        script.htmlFor = script.id = '_reqwest_' + reqId
    }

    script.onload = script.onreadystatechange = function () {
      if ((script[readyState] && script[readyState] !== 'complete' && script[readyState] !== 'loaded') || loaded) {
        return false
      }
      script.onload = script.onreadystatechange = null
      script.onclick && script.onclick()
      // Call the user callback with the last value stored and clean up values and scripts.
      o.success && o.success(lastValue)
      lastValue = undefined
      head.removeChild(script)
      loaded = 1
    }

    // Add the script to the DOM head
    head.appendChild(script)
  }

  function getRequest(o, fn, err) {
    var method = (o.method || 'GET').toUpperCase()
      , url = typeof o === 'string' ? o : o.url
      // convert non-string objects to query-string form unless o.processData is false
      , data = (o.processData !== false && o.data && typeof o.data !== 'string')
        ? reqwest.toQueryString(o.data)
        : (o.data || null);

    // if we're working on a GET request and we have data then we should append
    // query string to end of URL and not post data
    (o.type == 'jsonp' || method == 'GET')
      && data
      && (url = urlappend(url, data))
      && (data = null)

    if (o.type == 'jsonp') return handleJsonp(o, fn, err, url)

    var http = xhr()
    http.open(method, url, true)
    setHeaders(http, o)
    http.onreadystatechange = handleReadyState(http, fn, err)
    o.before && o.before(http)
    http.send(data)
    return http
  }

  function Reqwest(o, fn) {
    this.o = o
    this.fn = fn
    init.apply(this, arguments)
  }

  function setType(url) {
    var m = url.match(/\.(json|jsonp|html|xml)(\?|$)/)
    return m ? m[1] : 'js'
  }

  function init(o, fn) {
    this.url = typeof o == 'string' ? o : o.url
    this.timeout = null
    var type = o.type || setType(this.url)
      , self = this
    fn = fn || function () {}

    if (o.timeout) {
      this.timeout = setTimeout(function () {
        self.abort()
      }, o.timeout)
    }

    function complete(resp) {
      o.timeout && clearTimeout(self.timeout)
      self.timeout = null
      o.complete && o.complete(resp)
    }

    function success(resp) {
      var r = resp.responseText
      if (r) {
        switch (type) {
        case 'json':
          try {
            resp = win.JSON ? win.JSON.parse(r) : eval('(' + r + ')')
          } catch(err) {
            return error(resp, 'Could not parse JSON in response', err)
          }
          break;
        case 'js':
          resp = eval(r)
          break;
        case 'html':
          resp = r
          break;
        }
      }

      fn(resp)
      o.success && o.success(resp)

      complete(resp)
    }

    function error(resp, msg, t) {
      o.error && o.error(resp, msg, t)
      complete(resp)
    }

    this.request = getRequest(o, success, error)
  }

  Reqwest.prototype = {
    abort: function () {
      this.request.abort()
    }

  , retry: function () {
      init.call(this, this.o, this.fn)
    }
  }

  function reqwest(o, fn) {
    return new Reqwest(o, fn)
  }

  // normalize newline variants according to spec -> CRLF
  function normalize(s) {
    return s ? s.replace(/\r?\n/g, '\r\n') : ''
  }

  var isArray = typeof Array.isArray == 'function' ? Array.isArray : function(a) {
    return a instanceof Array
  }

  function serial(el, cb) {
    var n = el.name
      , t = el.tagName.toLowerCase()
      , optCb = function(o) {
          // IE gives value="" even where there is no value attribute
          // 'specified' ref: http://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-862529273
          if (o && !o.disabled)
            cb(n, normalize(o.attributes.value && o.attributes.value.specified ? o.value : o.text))
        }

    // don't serialize elements that are disabled or without a name
    if (el.disabled || !n) return;

    switch (t) {
    case 'input':
      if (!/reset|button|image|file/i.test(el.type)) {
        var ch = /checkbox/i.test(el.type)
          , ra = /radio/i.test(el.type)
          , val = el.value;
        // WebKit gives us "" instead of "on" if a checkbox has no value, so correct it here
        (!(ch || ra) || el.checked) && cb(n, normalize(ch && val === '' ? 'on' : val))
      }
      break;
    case 'textarea':
      cb(n, normalize(el.value))
      break;
    case 'select':
      if (el.type.toLowerCase() === 'select-one') {
        optCb(el.selectedIndex >= 0 ? el.options[el.selectedIndex] : null)
      } else {
        for (var i = 0; el.length && i < el.length; i++) {
          el.options[i].selected && optCb(el.options[i])
        }
      }
      break;
    }
  }

  // collect up all form elements found from the passed argument elements all
  // the way down to child elements; pass a '<form>' or form fields.
  // called with 'this'=callback to use for serial() on each element
  function eachFormElement() {
    var cb = this
      , e, i, j
      , serializeSubtags = function(e, tags) {
        for (var i = 0; i < tags.length; i++) {
          var fa = e[byTag](tags[i])
          for (j = 0; j < fa.length; j++) serial(fa[j], cb)
        }
      }

    for (i = 0; i < arguments.length; i++) {
      e = arguments[i]
      if (/input|select|textarea/i.test(e.tagName)) serial(e, cb)
      serializeSubtags(e, [ 'input', 'select', 'textarea' ])
    }
  }

  // standard query string style serialization
  function serializeQueryString() {
    return reqwest.toQueryString(reqwest.serializeArray.apply(null, arguments))
  }

  // { 'name': 'value', ... } style serialization
  function serializeHash() {
    var hash = {}
    eachFormElement.apply(function (name, value) {
      if (name in hash) {
        hash[name] && !isArray(hash[name]) && (hash[name] = [hash[name]])
        hash[name].push(value)
      } else hash[name] = value
    }, arguments)
    return hash
  }

  // [ { name: 'name', value: 'value' }, ... ] style serialization
  reqwest.serializeArray = function () {
    var arr = []
    eachFormElement.apply(function(name, value) {
      arr.push({name: name, value: value})
    }, arguments)
    return arr
  }

  reqwest.serialize = function () {
    if (arguments.length === 0) return ''
    var opt, fn
      , args = Array.prototype.slice.call(arguments, 0)

    opt = args.pop()
    opt && opt.nodeType && args.push(opt) && (opt = null)
    opt && (opt = opt.type)

    if (opt == 'map') fn = serializeHash
    else if (opt == 'array') fn = reqwest.serializeArray
    else fn = serializeQueryString

    return fn.apply(null, args)
  }

  reqwest.toQueryString = function (o) {
    var qs = '', i
      , enc = encodeURIComponent
      , push = function (k, v) {
          qs += enc(k) + '=' + enc(v) + '&'
        }

    if (isArray(o)) {
      for (i = 0; o && i < o.length; i++) push(o[i].name, o[i].value)
    } else {
      for (var k in o) {
        if (!Object.hasOwnProperty.call(o, k)) continue;
        var v = o[k]
        if (isArray(v)) {
          for (i = 0; i < v.length; i++) push(k, v[i])
        } else push(k, o[k])
      }
    }

    // spaces should be + according to spec
    return qs.replace(/&$/, '').replace(/%20/g,'+')
  }

  // jQuery and Zepto compatibility, differences can be remapped here so you can call
  // .ajax.compat(options, callback)
  reqwest.compat = function (o, fn) {
    if (o) {
      o.type && (o.method = o.type) && delete o.type
      o.dataType && (o.type = o.dataType)
      o.jsonpCallback && (o.jsonpCallbackName = o.jsonpCallback) && delete o.jsonpCallback
      o.jsonp && (o.jsonpCallback = o.jsonp)
    }
    return new Reqwest(o, fn)
  }

  reqwest.noConflict = function () {
    context.reqwest = old
    return this
  }

  return reqwest
})

});

require.alias("./spire.io.js", "/node_modules/spire");
