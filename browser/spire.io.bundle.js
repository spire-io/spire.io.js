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

require.define("/spire.io.js", function (require, module, exports, __dirname, __filename) {
    /**
 * @overview <p>Spire API Client</p>
 *
 * <p>spire.io.js is a library designed to help you get your client-side web
 * applications up and running with the high level services provided by the
 * spire.io API. This plugin also exposes a methodology for directly interfacing
 * with the spire.io REST interface.</p>
 *
 * <p>You can learn more about spire.io and it's services at http://spire.io, or
 * find help with the following things:</p>
 *
 * <ul>
 *   <li>source code: http://github.com/spire-io/spire.io.js</li>
 *   <li>issues: http://github.com/spire-io/spire.io.js/issues</li>
 *   <li>contact: http://spire.io/contact.htms</li>
 * </ul>
 */

var async = require('async')
  , API = require('./spire/api')
  ;

/**
 * Spire API Client
 *
 * @class <strong>Spire API Client</strong>
 *
 * @example
 * var spire = new Spire();
 *
 * @constructor
 * @param {object} opts Options for Spire
 * @param {string} opts.url Spire url do use (defaults to 'https://api.spire.io')
 * @param {string} opts.version Version of Spire api to use (defaults to '1.0')
 * @param {number} opts.timeout Timeout for requests (defaults to 30 seconds)
 */
function Spire(opts) {
  this.api = new API(this, opts);
  this.session = null;
}

module.exports = Spire;

/**
 * Get the account key.
 *
 * @returns {string} Account key
 */
Spire.prototype.key = function () {
  if (this.session && this.session.resources && this.session.resources.account) {
    return this.session.resources.account.key();
  }
  return null;
};

/**
 * Start the Spire session with the given account key.
 *
 * @example
 * var spire = new Spire();
 * spire.start(your_api_key, function (err, session) {
 *   if (!err) {
 *     // You now have a spire session.
 *     // Start creating channels and subscripions.
 *   }
 * });
 *
 * @param {string} key The acccount key
 * @param {function(err)} cb Callback
 */
Spire.prototype.start = function (key, cb) {
  var spire = this;
  this.api.createSession(key, function (err, session) {
    if (err) return cb(err);
    spire.session = session;
    cb(null);
  });
};

/**
 * Start the Spire session with the given username and password.
 *
 * @example
 * var spire = new Spire();
 * spire.login(your_email, your_password, function (err) {
 *   if (!err) {
 *     // You now have a spire session.
 *     // Start creating channels and subscripions.
 *   }
 * });
 *
 * @param {string} email Email
 * @param {string} password Password
 * @param {function(err)} cb Callback
 */
Spire.prototype.login = function (email, password, cb) {
  var spire = this;
  this.api.login(email, password, function (err, session) {
    if (err) return cb(err);
    spire.session = session;
    cb(null);
  });
};

/**
 * Registers for a new spire account, and authenticates as the newly created account
 *
 * @example
 * var spire = new Spire();
 * spire.register({
 *   email: your_email,
 *   password: your_password,
 *   password_confirmation: your_password_confirmation
 * }, function (err) {
 *   if (!err) {
 *     // Your account has been registered,
 *     // and you now have a spire session.
 *     // Start creating channels and subscripions.
 *   }
 * });
 *
 * @param {object} user User info
 * @param {string} user.email Email
 * @param {string} user.password Password
 * @param {string} [user.password_confirmation] Optional password confirmation
 * @param {function (err)} cb Callback
 */
Spire.prototype.register = function (user, cb) {
  var spire = this;
  this.api.createAccount(user, function (err, session) {
    if (err) return cb(err);
    spire.session = session;
    cb(null);
  });
};

/**
 * Updates your account info.
 *
 * @example
 * var spire = new Spire();
 * spire.update({
 *   email: your_new_email
 * }, function (err, account) {
 *   if (!err) {
 *     // Your account has been updated.
 *   }
 * });
 *
 * @param {object} user User info
 * @param {string} user.email Email
 * @param {string} user.password Password
 * @param {string} [user.password_confirmation] Optional password confirmation
 * @param {function (err)} cb Callback
 */
Spire.prototype.update = function (user, cb) {
  if (!this.session) {
    return cb(new Error("You must log in to spire to do this."));
  }

  this.session.resources.account.update(user, cb);
};

/**
 * Requests a password reset for email.
 *
 * @example
 * var spire = new Spire();
 * spire.passwordResetRequest(your_email, function (err) {
 *   if (!err) {
 *     // A password reset email has been sent.
 *   }
 * });
 *
 * @param {string} email Email
 * @param {function (err)} cb Callback
 */
Spire.prototype.passwordResetRequest = function (email, cb) {
  this.api.passwordResetRequest(email, cb);
};

/**
 * Gets a channel (creates if necessary).
 *
 * @example
 * var spire = new Spire();
 * spire.start(your_api_key, function (err, session) {
 *   spire.channel('foo', function (err, channel) {
 *     if (!err) {
 *       // `channel` is the channel named "foo".
 *     }
 *   });
 * });
 *
 * @param {string} name Channel name to get or create
 * @param {function(err, channel)} cb Callback
 */
Spire.prototype.channel = function (name, cb) {
  if (!this.session) {
    return cb(new Error("You must start spire before you can do this."));
  }

  if (this.session._channels[name]) {
    return cb(null, this.session._channels[name]);
  }
  this._findOrCreateChannel(name, cb);
};

/**
 * Gets a list of all channels.  Will return cached data if it is available,
 * otherwise will make a request.
 *
 * @example
 * var spire = new Spire();
 * spire.start(your_api_key, function (err, session) {
 *   spire.channels(function (err, channels) {
 *     if (!err) {
 *       // `channels` is a hash of all the account's channels
 *     }
 *   });
 * });
 *
 * @param {function (err, channels)} cb Callback
 */
Spire.prototype.channels = function (cb) {
  if (!this.session) {
    return cb(new Error("You must start spire before you can do this."));
  }

  this.spire.session.channels(cb);
};

/**
 * Gets a list of all channels.  Ignores any cached data, and forces the
 * request.
 *
 * @example
 * var spire = new Spire();
 * spire.start(your_api_key, function (err, session) {
 *   spire.channels$(function (err, channels) {
 *     if (!err) {
 *       // `channels` is a hash of all the account's channels
 *     }
 *   });
 * });
 *
 * @param {function (err, channels)} cb Callback
 */
Spire.prototype.channels$ = function (cb) {
  if (!this.session) {
    return cb(new Error("You must start spire before you can do this."));
  }

  this.spire.session.channels$(cb);
};

/**
 * Gets a subscription to the given channels.  Creates the channels and the
 * subscription if necessary.
 *
 * @example
 * var spire = new Spire();
 * spire.start(your_api_key, function (err, session) {
 *   spire.subscription('mySubscription', ['foo', 'bar'], function (err, subscription) {
 *     if (!err) {
 *       // `subscription` is a subscription named 'mySubscription', listening on channels named 'foo' and 'bar'.
 *     }
 *   });
 * });
 *
 * @param {string} Subscription name
 * @param {array or string} channelOrChannels Either a single channel name, or an array of
 *   channel names to subscribe to
 * @param {function (err, subscription)} cb Callback
 */
Spire.prototype.subscription = function (name, channelOrChannels, cb) {
  var channelNames = (typeof channelOrChannels === 'string') ?
    [channelOrChannels] : channelOrChannels;

  var spire = this;
  async.forEach(
    channelNames,
    function (channelName, innerCB) {
      spire._findOrCreateChannel(channelName, innerCB);
    },
    function (err) {
      if (err) return cb(err);
      spire._findOrCreateSubscription(name, channelNames, cb);
    }
  );
};

/**
 * Get the subscriptions for an account.  Will return cached data if it is
 * available, otherwise makes a request.
 *
 * @example
 * var spire = new Spire();
 * spire.start(your_api_key, function (err, session) {
 *   spire.subscriptions(function (err, subscriptions) {
 *     if (!err) {
 *       // `subscriptions` is a hash of all the account's subscriptions
 *     }
 *   });
 * });
 *
 * @param {function (err, subscriptions)} cb Callback
 */
Spire.prototype.subscriptions = function (cb) {
  if (!this.session) {
    return cb(new Error("You must start spire before you can do this."));
  }

  this.session.subscriptions(cb);
};

/**
 * Get the subscriptions for an account.  Ignores any cached data and always
 * makes a request.
 *
 * @example
 * var spire = new Spire();
 * spire.start(your_api_key, function (err, session) {
 *   spire.subscriptions$(function (err, subscriptions) {
 *     if (!err) {
 *       // `subscriptions` is a hash of all the account's subscriptions
 *     }
 *   });
 * });
 *
 * @param {function (err, subscriptions)} cb Callback
 */
Spire.prototype.subscriptions$ = function (cb) {
  if (!this.session) {
    return cb(new Error("You must start spire before you can do this."));
  }

  this.session.subscriptions$(cb);
};

/**
 * Creates an new subscription to a channel or channels, and adds a listener.
 *
 * @example
 * var spire = new Spire();
 * spire.start(your_api_key, function (err, session) {
 *   spire.subscribe('myChannel', options, function (messages) {
 *     // `messages` is array of messages sent to the channel
 *   }, function (err) {
 *   // `err` will be non-null if there was a problem creating the subscription.
 * });
 *
 * @param {array or string} channelOrChannels Either a single channel name, or an array of
 *   channel names to subscribe to
 * @param {object} [options] Options to pass to the listener
 * @param {function (messages)} listener Listener that will get called with each batch of messages
 * @param {function (err, subscription)} [cb] Callback
 */
Spire.prototype.subscribe = function (channelOrChannels, options, listener, cb) {
  if (typeof options === 'function') {
    cb = listener;
    listener = options;
  }

  cb = cb || function () {};

  var name = 'anon-' + Date.now() + '-' + Math.random();

  this.subscription(name, channelOrChannels, function (err, subscription) {
    if (err) return cb(err);
    subscription.addListener('messages', listener);
    subscription.startListening(options);
    return cb(null, subscription);
  });
};

/**
 * Publish to a channel.
 *
 * Creates the channel if necessary.
 *
 * @example
 * var spire = new Spire();
 * spire.publish('my_channel', 'my message', function (err, message) {
 *   if (!err) {
 *     //  Message sent successfully
 *   }
 * });
 *
 * @param {string} channelName Channel name
 * @param {object, string} message Message
 * @param {function (err, subscription)} cb Callback
 */
Spire.prototype.publish = function (channelName, message, cb) {
  var spire = this;
  spire.channel(channelName, function (err, channel) {
    if (err) { return cb(err); }
    channel.publish(message, cb);
  });
};

/**
 * Get Account from url and capability.
 *
 * Use this method to get the account without starting a spire session.
 *
 * If you have a spire session, you should use <code>spire.session.account</code>.
 *
 * @example
 * var spire = new Spire();
 * spire.accountFromUrlAndCapability({
 *   url: account_url,
 *   capability: account_capability
 * }, function (err, account) {
 *   if (!err) {
 *     // ...
 *   }
 * })
 *
 * @param {object} creds Url and Capability
 * @param {string} creds.url Url
 * @param {string} creds.capability Capability
 * @param {function (err, account)} cb Callback
 */
Spire.prototype.accountFromUrlAndCapability = function (creds, cb) {
  this.api.accountFromUrlAndCapability(creds, cb);
};

/**
 * Get Channel from url and capability.
 *
 * Use this method to get a channel without starting a spire session.
 *
 * If you have a spire session, you should use <code>spire.channel</code>.
 *
 * @example
 * var spire = new Spire();
 * spire.channelFromUrlAndCapability({
 *   url: channel_url,
 *   capability: channel_capability
 * }, function (err, channel) {
 *   if (!err) {
 *     // ...
 *   }
 * })
 *
 * @param {object} creds Url and Capability
 * @param {string} creds.url Url
 * @param {string} creds.capability Capability
 * @param {function (err, channel)} cb Callback
 */
Spire.prototype.channelFromUrlAndCapability = function (creds, cb) {
  this.api.channelFromUrlAndCapability(creds, cb);
};

/**
 * Get Subscription from url and capability.
 * Use this method to get a subscription without starting a spire session.
 *
 * If you have a spire session, you should use <code>spire.subscription</code>.
 *
 * @example
 * var spire = new Spire();
 * spire.subscriptionFromUrlAndCapability({
 *   url: subscription_url,
 *   capability: subscription_capability
 * }, function (err, subscription) {
 *   if (!err) {
 *     // ...
 *   }
 * })
 *
 * @param {object} creds Url and Capability
 * @param {string} creds.url Url
 * @param {string} creds.capability Capability
 * @param {function (err, subscription)} cb Callback
 */
Spire.prototype.subscriptionFromUrlAndCapability = function (creds, cb) {
  this.api.subscriptionFromUrlAndCapability(creds, cb);
};

/**
 * Start the Spire session with the url and capability for the session.
 *
 * @example
 * var spire = new Spire();
 * var creds = {
 *   url: session_url,
 *   capability: session_capability
 * };
 * spire._startSessionFromUrlAndCapability(creds, function (err) {
 *   if (!err) {
 *     // You now have a spire session.
 *     // Start creating channels and subscripions.
 *   }
 * });
 *
 * @param {object} creds Url and Capability
 * @param {string} creds.url Url
 * @param {string} creds.capability Capability
 * @param {function (err)} cb Callback
 */
Spire.prototype._startSessionFromUrlAndCapability = function (creds, cb) {
  var spire = this;
  this.api.sessionFromUrlAndCapability(creds, function (err, session) {
    if (err) return cb(err);
    spire.session = session;
    cb(null);
  });
};

/**
 * Number of times to retry creating a channel or subscription before giving up.
 */
Spire.prototype.CREATION_RETRY_LIMIT = 5;

/**
 * Returns the channel with name 'name', creating it if necessary.
 * You should use `Spire.prototype.channel` method instead of this one.  This
 * method ignores cached channels.
 *
 * @param {string} name Channel name
 * @param {function (err, channel)} cb Callback
 */
Spire.prototype._findOrCreateChannel = function (name, cb) {
  if (!this.session) {
    return cb(new Error("You must start spire before you can do that."));
  }

  var spire = this;
  var creationCount = 0;

  function createChannel() {
    creationCount++;
    spire.session.createChannel(name, function (err, channel) {
      if (!err) return cb(null, channel);
      if (err.status !== 409) return cb(err);
      if (creationCount >= spire.CREATION_RETRY_LIMIT) {
        return cb(new Error("Could not create channel: " + name));
      }
      getChannel();
    });
  }

  function getChannel() {
    spire.session.channels$(function (err, channels) {
      if (err) return cb(err);
      if (channels[name]) return cb(null, channels[name]);
      createChannel();
    });
  }

  getChannel();
};

/**
 * Returns the subvscription with name 'name', creating it if necessary.
 * You should use `Spire.prototype.subscribe` method instead of this one.  This
 * method ignores cached subscriptions, and does not create the channels.
 *
 * @param {string} name Subscription name
 * @param {string} channelNames Channel names
 * @param {function (err, subscription)} cb Callback
 */
Spire.prototype._findOrCreateSubscription = function (name, channelNames, cb) {
  if (!this.session) {
    return cb(new Error("You must start spire before you can do that."));
  }

  var spire = this;
  var creationCount = 0;

  function createSubscription() {
    creationCount++;
    spire.session.createSubscription(name, channelNames, function (err, sub) {
      if (!err) return cb(null, sub);
      if (err.status !== 409) return cb(err);
      if (creationCount >= spire.CREATION_RETRY_LIMIT) {
        return cb(new Error("Could not create subscription: " + name));
      }
      getSubscription();
    });
  }

  function getSubscription() {
    spire.session.subscriptions$(function (err, subscriptions) {
      if (err) return cb(err);
      if (subscriptions[name]) return cb(null, subscriptions[name]);
      createSubscription();
    });
  }

  getSubscription();
};

});

require.define("/node_modules/async/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"main":"./index"}
});

require.define("/node_modules/async/index.js", function (require, module, exports, __dirname, __filename) {
    // This file is just added for convenience so this repository can be
// directly checked out into a project's deps folder
module.exports = require('./lib/async');

});

require.define("/node_modules/async/lib/async.js", function (require, module, exports, __dirname, __filename) {
    /*global setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root = this,
        previous_async = root.async;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    else {
        root.async = async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    //// cross-browser compatiblity functions ////

    var _forEach = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _forEach(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _forEach(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    var _indexOf = function (arr, item) {
        if (arr.indexOf) {
            return arr.indexOf(item);
        }
        for (var i = 0; i < arr.length; i += 1) {
            if (arr[i] === item) {
                return i;
            }
        }
        return -1;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        async.nextTick = function (fn) {
            setTimeout(fn, 0);
        };
    }
    else {
        async.nextTick = process.nextTick;
    }

    async.forEach = function (arr, iterator, callback) {
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _forEach(arr, function (x) {
            iterator(x, function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed === arr.length) {
                        callback();
                    }
                }
            });
        });
    };

    async.forEachSeries = function (arr, iterator, callback) {
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed === arr.length) {
                        callback();
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };
    
    async.forEachLimit = function (arr, limit, iterator, callback) {
        if (!arr.length || limit <= 0) {
            return callback(); 
        }
        var completed = 0;
        var started = 0;
        var running = 0;
        
        (function replenish () {
          if (completed === arr.length) {
              return callback();
          }
          
          while (running < limit && started < arr.length) {
            iterator(arr[started], function (err) {
              if (err) {
                  callback(err);
                  callback = function () {};
              }
              else {
                  completed += 1;
                  running -= 1;
                  if (completed === arr.length) {
                      callback();
                  }
                  else {
                      replenish();
                  }
              }
            });
            started += 1;
            running += 1;
          }
        })();
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.forEach].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.forEachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (err, v) {
                results[x.index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);


    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.forEachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.forEach(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.forEach(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        if (!keys.length) {
            return callback(null);
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            _forEach(listeners, function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (_keys(results).length === keys.length) {
                callback(null, results);
            }
        });

        _forEach(keys, function (k) {
            var task = (tasks[k] instanceof Function) ? [tasks[k]]: tasks[k];
            var taskCallback = function (err) {
                if (err) {
                    callback(err);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    taskComplete();
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.waterfall = function (tasks, callback) {
        if (!tasks.length) {
            return callback();
        }
        callback = callback || function () {};
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.nextTick(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    async.parallel = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            async.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.forEach(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.forEachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.queue = function (worker, concurrency) {
        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
                q.tasks.push({data: data, callback: callback});
                if(q.saturated && q.tasks.length == concurrency) q.saturated();
                async.nextTick(q.process);
            },
            process: function () {
                if (workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if(q.empty && q.tasks.length == 0) q.empty();
                    workers += 1;
                    worker(task.data, function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if(q.drain && q.tasks.length + workers == 0) q.drain();
                        q.process();
                    });
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            }
        };
        return q;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _forEach(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                callback.apply(null, memo[key]);
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      }
    };

}());

});

require.define("/spire/api.js", function (require, module, exports, __dirname, __filename) {
    /**
 * @fileOverview API class definition
 */

var Resource = require('./api/resource')
  , Account = require('./api/account')
  , Billing = require('./api/billing')
  , Channel = require('./api/channel')
  , Session = require('./api/session')
  , Subscription = require('./api/subscription')
  ;

/**
 * Abstraction for the Spire API
 *
 * @class Collection of API methods
 *
 * @example
 * var api = new API(options);
 *
 * @constructor
 * @param {object} spire Spire object
 * @param {object} [opts] Options
 * @param {string} [opts.url] Spire api url
 * @param {string} [opts.version] Version of the Spire api to use
 * @param {string} [opts.timeout] Timeout for requests
 */
function API(spire, opts) {
  this.spire = spire;

  opts = opts || {};
  this.url = opts.url || 'https://api.spire.io';
  this.version = opts.version || '1.0';
  this.timeout = opts.timeout || 30 * 1000;

  this.description = null;
  this.schema = null;
}

module.exports = API;


/**
 * Make requests to the api.
 * @function
 * @see Resourse.prototype.request
 */
API.prototype.request = Resource.prototype.request;

/**
 * Discovers urls from Spire API.  Since this description does not change often,
 * we only make the request once and cache the result for subsequent calls.
 *
 * @example
 * api.discover(function (err, discovered) {
 *   if (!err) {
 *     // ...
 *   }
 * });
 *
 * @param {function(err, discovered)} cb Callback
 */
API.prototype.discover = function (cb) {
  var api = this;

  if (this.description) {
    return cb(null, this.description);
  }

  this.request('discover', function (err, description) {
    if (err) return cb(err);
    api.description = description;
    api.schema = description.schema[api.version];
    cb(null, description);
  });
};

/**
 * Creates a spire session from an account key.
 *
 * @param {string} key The acccount key
 * @param {function(err)} cb Callback
 */
API.prototype.createSession = function (key, cb) {
  var api = this;
  this.discover(function (err) {
    if (err) return cb(err);
    api.request('create_session', key, function (err, sessionData) {
      if (err) return cb(err);
      var session = new Session(api.spire, sessionData);
      cb(null, session);
    });
  });
};

/**
 * Logs in with the given email and password.
 *
 * @param {string} email Email
 * @param {string} password Password
 * @param {function(err)} cb Callback
 */
API.prototype.login = function (email, password, cb) {
  var api = this;
  this.discover(function (err) {
    if (err) return cb(err);
    api.request('login', email, password, function (err, sessionData) {
      if (err) return cb(err);
      var session = new Session(api.spire, sessionData);
      cb(null, session);
    });
  });
};

/**
 * Register for a new spire account, and authenticates as the newly created account
 *
 * @param {object} user User info
 * @param {string} user.email Email
 * @param {string} user.password Password
 * @param {string} [user.password_confirmation] Optional password confirmation
 * @param {function (err)} cb Callback
 */
API.prototype.createAccount = function (info, cb) {
  var api = this;
  this.discover(function (err) {
    if (err) return cb(err);
    api.request('create_account', info, function (err, sessionData) {
      if (err) return cb(err);
      var session = new Session(api.spire, sessionData);
      cb(null, session);
    });
  });
};

/**
 * Request a password reset for email.
 *
 * @param {string} email Email
 * @param {function (err)} cb Callback
 */
API.prototype.passwordResetRequest = function (email, cb) {
  var api = this;
  this.discover(function (err) {
    if (err) return cb(err);
    api.request('password_reset', email, cb);
  });
};

/**
 * Get billing information for the account.
 *
 * @param {function (err, billingResource)} cb Callback
 */
API.prototype.billing = function (cb) {
  var api = this;
  this.discover(function (err) {
    if (err) return cb(err);
    api.request('billing', function (err, billingData) {
      if (err) return cb(err);
      var billing = new Billing(api.spire, billingData);
      cb(null, billing);
    });
  });
};

/**
 * Get Account from url and capability.
 *
 * @param {object} creds Url and Capability
 * @param {string} creds.url Url
 * @param {string} creds.capability Capability
 * @param {function (err, account)} cb Callback
 */
API.prototype.accountFromUrlAndCapability = function (creds, cb) {
  var api = this;
  this.discover(function (err) {
    if (err) return cb(err);
    var account = new Account(api.spire, creds);
    account.get(cb);
  });
};

/**
 * Update Account from url and capability.
 *
 * @param {object} account Must contain at least Url and Capability
 * @param {string} creds.url Url
 * @param {string} creds.capability Capability
 * @param {function (err, account)} cb Callback
 */
API.prototype.updateAccountWithUrlAndCapability = function (accountData, cb) {
  var api = this;
  this.discover(function (err) {
    if (err) return cb(err);
    api.request('update_account', accountData, function (err, acc) {
      if (err) return cb(err);
      var account = new Account(api.spire, acc);
      cb(null, account);
    });
  });
};

/**
 * Get Channel from url and capability.
 *
 * @param {object} creds Url and Capability
 * @param {string} creds.url Url
 * @param {string} creds.capability Capability
 * @param {function (err, channel)} cb Callback
 */
API.prototype.channelFromUrlAndCapability = function (creds, cb) {
  var api = this;
  this.discover(function (err) {
    if (err) return cb(err);
    var channel = new Channel(api.spire, creds);
    channel.get(cb);
  });
};

/**
 * Get Session from url and capability.
 *
 * @param {object} creds Url and Capability
 * @param {string} creds.url Url
 * @param {string} creds.capability Capability
 * @param {function (err, subscription)} cb Callback
 */
API.prototype.sessionFromUrlAndCapability = function (creds, cb) {
  var api = this;
  this.discover(function (err) {
    if (err) return cb(err);
    var session = new Session(api.spire, creds);
    session.get(cb);
  });
};

/**
 * Get Subscription from url and capability.
 *
 * @param {object} creds Url and Capability
 * @param {string} creds.url Url
 * @param {string} creds.capability Capability
 * @param {function (err, subscription)} cb Callback
 */
API.prototype.subscriptionFromUrlAndCapability = function (creds, cb) {
  var api = this;
  this.discover(function (err) {
    if (err) return cb(err);
    var subscription = new Subscription(api.spire, creds);
    subscription.get(cb);
  });
};

/**
 * Returns the MIME type for resourceName.
 *
 * @param {string} [name] Name of the resource MIME type to return
 * @returns {string} MIME type of the resource
 */
API.prototype.mediaType = function (resourceName) {
  if (!this.schema) {
    throw "No description object.  Run `spire.api.discover` first.";
  }

  if (!this.schema[resourceName]) {
    throw "No schema for resource " + resourceName;
  }

  return this.schema[resourceName].mediaType;
};

/**
 * Returns the Authorization header for the resource.
 *
 * @param {Resource} resource Resource
 * @returns {string} Authorization header for the resource
 */
API.prototype.authorization = function (resource) {
  return ['Capability', resource.capability].join(' ');
};

/**
 * Requests
 * These define API calls and have no side effects.  They can be run by calling
 *     this.request(<request name>);
 */

/**
 * Gets the api description resource.
 * @name discover
 * @ignore
 */
Resource.defineRequest(API.prototype, 'discover', function () {
  return {
    method: 'get',
    url: this.url,
    headers: {
      accept: "application/json"
    }
  };
});

/**
 * Posts to sessions url with the accont key.
 * @name create_session
 * @ignore
 */
Resource.defineRequest(API.prototype, 'create_session', function (key) {
  return {
    method: 'post',
    url: this.description.resources.sessions.url,
    headers: {
      'Content-Type': this.mediaType('account'),
      'Accept': this.mediaType('session')
    },
    content: {key: key}
  };
});

/**
 * Posts to sessions url with email and password.
 * @name login
 * @ignore
 */
Resource.defineRequest(API.prototype, 'login', function (email, password) {
  return {
    method: 'post',
    url: this.description.resources.sessions.url,
    headers: {
      'Content-Type': this.mediaType('account'),
      'Accept': this.mediaType('session')
    },
    content: {
      email: email,
      password: password
    }
  };
});

/**
 * Posts to accounts url with user info.
 * @name create_account
 * @ignore
 */
Resource.defineRequest(API.prototype, 'create_account', function (account) {
  return {
    method: 'post',
    url: this.description.resources.accounts.url,
    headers: {
      'Content-Type': this.mediaType('account'),
      'Accept': this.mediaType('session')
    },
    content: account
  };
});

/**
 * Posts to accounts url with object containing email.
 * @name password_reset
 * @ignore
 */
Resource.defineRequest(API.prototype, 'password_reset', function (email) {
  return {
    method: 'post',
    url: this.description.resources.accounts.url,
    content: "",
    query: { email: email }
  };
});

/**
 * Gets billing resource.
 * @name billing
 * @ignore
 */
Resource.defineRequest(API.prototype, 'billing', function () {
  return {
    method: 'get',
    url: this.description.resources.billing.url,
    content: "",
    headers: {
      'Accept': 'application/json'
    }
  };
});

/**
 * Updates (puts) to the resouce.
 * @name update
 * @ignore
 */
Resource.defineRequest(API.prototype, 'update_account', function (data) {
  return {
    method: 'put',
    url: data.url,
    content: data,
    headers: {
      'Authorization': "Capability " + data.capability,
      'Accept': this.mediaType('account'),
      'Content-Type': this.mediaType('account')
    }
  };
});

});

require.define("/spire/api/resource.js", function (require, module, exports, __dirname, __filename) {
    /**
 * @fileOverview Resource class definition
 */

var _ = require('underscore')
  , Shred = require('shred')
  , shred = new Shred()
  , ResponseError = require('./response_error')
  , EventEmitter = require('events').EventEmitter
  ;

/**
 * Base class for objects repreenting resources in the spire api.  It is meant
 * to be extended by other classes.
 *
 * <p>Resources have methods for making requests to the spire api.  These methods
 * are defined with `Request.defineRequest`.  Note that this is a method on the
 * Request object itself, not the prototype.  It is used to create methods on
 * the prototype of Resource classes.</p>
 *
 * <p>The `Resource` class provides default requests for the `get`, `put`,
 * `delete`, and `post` methods.  These methods can be overwritten by
 * subclasses.</p>
 *
 * <p>Once a request method has been defined, it can be run with
 * <pre><code>
 *   resource.request(<request name>);
 * </code></pre>
 * </p>
 *
 * <p>Such request methods have no side effects, and return JSON objects direct
 * from the spire api.</p>
 *
 * @class Base class for Spire API Resources
 *
 * @constructor
 * @extends EventEmitter
 * @param {object} spire Spire object
 * @param {object} data Resource data from the spire api
 */
function Resource(spire, data) {
  this.spire = spire;
  this.data = data;
}

Resource.prototype = new EventEmitter();

module.exports = Resource;

/**
 * Creates a request method on given object.
 *
 * `name` is the name of the request.  This is what gets passed to the `request`
 * method when actually calling the request.
 *
 * For instance, a request defined with
 * <pre><code>
 *   defineRequest(somePrototype, 'get', createGetReq);
 * </code></pre>
 *
 * is run by calling
 * <pre><code>
 *   resource.request('get', callback);
 * </code></pre>
 *
 * `fn` is a function that takes any number of arguments and returns a hash
 * describing the http request we are about to send.  Any arguments to this
 * function can be passed to the `request` method.
 *
 * For example, suppose `createGetReq` from above is the following function,
 * which takes an id number as argument as puts it in the query params:
 *
 * <pre><code>
 *   function createGetReq (id) {
 *     return {
 *       method: 'get',
 *       url: this.url(),
 *       query: { id: id },
 *      };
 *   };
 * </code></pre>
 *
 *  You would call that request like this:
 *  <code>resource.request('get', id, callback);</code>
 *
 * @param {object} obj Object to add the request method to.
 * @param {string} name Name of the request method
 * @param {function (*args)} fn Function taking any number of arguments, returning an object describing the HTTP request.
 */
Resource.defineRequest = function (obj, name, fn) {
  obj['_req_' + name] = function () {
    var args = Array.prototype.slice.call(arguments);
    var callback = args.pop();

    var req = fn.apply(this, args);

    shred.request(req)
      .on('error', function (res) {
        var error = new ResponseError(res);
        callback(error);
      })
      .on('success', function (res) {
        callback(null, res.body.data);
      });
  };
};

/**
 * <p>Makes the request with the given name.
 *
 * <p>Arguments are the request name, followed by any number of arguments that will
 * be passed to the function which creates the request description, and a
 * callback.
 */
Resource.prototype.request = function () {
  var args = Array.prototype.slice.call(arguments);
  var reqName = args.shift();
  var cb = args[args.length - 1];
  if (typeof this['_req_' + reqName] !== 'function') {
    return cb(new Error("No request defined for " + reqName));
  }
  this['_req_' + reqName].apply(this, args);
};

/**
 * <p>Gets the resource.
 *
 * <p>Default method that may be overwritten by subclasses.
 *
 * @param {function (err, resource)} cd Callback
 */
Resource.prototype.get = function (cb) {
  var resource = this;
  this.request('get', function (err, data) {
    if (err) return cb(err);
    resource.data = data;
    cb(null, resource);
  });
};

/**
 * <p>Updates (puts to) the resource.
 *
 * <p>Default method that may be overwritten by subclasses.
 *
 * @param {object} data Resource data
 * @param {function (err, resource)} cd Callback
 */
Resource.prototype.update = function (data, cb) {
  var resource = this;
  this.request('update', data, function (err, data) {
    if (err) return cb(err);
    resource.data = data;
    cb(null, resource);
  });
};

/**
 * <p>Delete the resource.
 *
 * <p>Default method that may be overwritten by subclasses.
 *
 * @param {function (err, resource)} cd Callback
 */
Resource.prototype['delete'] = function (data, cb) {
  var resource = this;
  this.request('delete', data, function (err, data) {
    if (err) return cb(err);
    delete resource.data;
    cb(null);
  });
};

/**
 * Returns the url for the resource.
 *
 * @returns {string} url
 */
Resource.prototype.url = function () {
  return this.data.url;
};

/**
 * Returns the capability for the resource.
 *
 * @returns {string} Capability
 */
Resource.prototype.capability = function () {
  return this.data.capability;
};

/**
 * Returns the Authorization header for this resource, or for another capability
 * if one is passed in.
 *
 * @param {Resource} [resource] Optional resource
 * @returns {string} Authorization header
 */
Resource.prototype.authorization = function (resource) {
  var cap;
  if (resource) {
    if (typeof resource.capability === 'function') {
      cap = resource.capability();
    } else {
      cap = resource.capability;
    }
  } else {
    cap = this.capability();
  }
  return "Capability " + cap;
};

/**
 * Returns the resource key.
 *
 * @returns {string} Key
 */
Resource.prototype.key = function () {
  return this.data.key;
};

/**
 * Returns the resource schema for this resource the resource of a given name.
 *
 * @param {string} [name] Optional name of the resource schema to return
 * @returns {string} Schema
 */
Resource.prototype.schema = function (name) {
  name = name || this.resourceName;

  if (!this.spire.api.schema) {
    throw "No description object.  Run `spire.api.discover` first.";
  }

  if (!this.spire.api.schema[name]) {
    throw "No schema for resource " + name;
  }

  return this.spire.api.schema[name];
};

/**
 * Returns the MIME type for this resource or the resource of a given name.
 *
 * @param {string} [name] Optional name of the resource MIME type to return
 * @returns {string} MIME type
 */
Resource.prototype.mediaType = function (name) {
  return this.schema(name).mediaType;
};

/**
 * Requests
 * These define API calls and have no side effects.  They can be run by calling
 *     this.request(<request name>);
 *
 * The requests defined on the Resource class are defaults.  They can be
 * overwritten by subclasses.
 */

/**
 * Gets the resource.
 * @name get
 * @ignore
 */
Resource.defineRequest(Resource.prototype, 'get', function () {
  return {
    method: 'get',
    url: this.url(),
    headers: {
      'Authorization': this.authorization(),
      'Accept': this.mediaType(),
      'Content-Type': this.mediaType()
    }
  };
});

/**
 * Updates (puts) to the resouce.
 * @name update
 * @ignore
 */
Resource.defineRequest(Resource.prototype, 'update', function (data) {
  return {
    method: 'put',
    url: this.url(),
    content: data,
    headers: {
      'Authorization': this.authorization(),
      'Accept': this.mediaType(),
      'Content-Type': this.mediaType()
    }
  };
});

/**
 * Deletes a resource.
 * @name delete
 * @ignore
 */
Resource.defineRequest(Resource.prototype, 'delete', function () {
  return {
    method: 'delete',
    url: this.url(),
    headers: {
      'Authorization': this.authorization(),
      'Accept': this.mediaType(),
      'Content-Type': this.mediaType()
    }
  };
});

});

require.define("/node_modules/underscore/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"main":"underscore.js"}
});

require.define("/node_modules/underscore/underscore.js", function (require, module, exports, __dirname, __filename) {
    //     Underscore.js 1.3.1
//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var slice            = ArrayProto.slice,
      unshift          = ArrayProto.unshift,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) { return new wrapper(obj); };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root['_'] = _;
  }

  // Current version.
  _.VERSION = '1.3.1';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    if (obj.length === +obj.length) results.length = obj.length;
    return results;
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError('Reduce of empty array with no initial value');
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var reversed = _.toArray(obj).reverse();
    if (context && !initial) iterator = _.bind(iterator, context);
    return initial ? _.reduce(reversed, iterator, memo, context) : _.reduce(reversed, iterator);
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    each(obj, function(value, index, list) {
      if (!iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if a given value is included in the array or object using `===`.
  // Aliased as `contains`.
  _.include = _.contains = function(obj, target) {
    var found = false;
    if (obj == null) return found;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    found = any(obj, function(value) {
      return value === target;
    });
    return found;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (_.isFunction(method) ? method || value : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Return the maximum element or (element-based computation).
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.max.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.min.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var shuffled = [], rand;
    each(obj, function(value, index, list) {
      if (index == 0) {
        shuffled[0] = value;
      } else {
        rand = Math.floor(Math.random() * (index + 1));
        shuffled[index] = shuffled[rand];
        shuffled[rand] = value;
      }
    });
    return shuffled;
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }), 'value');
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, val) {
    var result = {};
    var iterator = _.isFunction(val) ? val : function(obj) { return obj[val]; };
    each(obj, function(value, index) {
      var key = iterator(value, index);
      (result[key] || (result[key] = [])).push(value);
    });
    return result;
  };

  // Use a comparator function to figure out at what index an object should
  // be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator) {
    iterator || (iterator = _.identity);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >> 1;
      iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(iterable) {
    if (!iterable)                return [];
    if (iterable.toArray)         return iterable.toArray();
    if (_.isArray(iterable))      return slice.call(iterable);
    if (_.isArguments(iterable))  return slice.call(iterable);
    return _.values(iterable);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    return _.toArray(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head`. The **guard** check allows it to work
  // with `_.map`.
  _.first = _.head = function(array, n, guard) {
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especcialy useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail`.
  // Especially useful on the arguments object. Passing an **index** will return
  // the rest of the values in the array from that index onward. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = function(array, index, guard) {
    return slice.call(array, (index == null) || guard ? 1 : index);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, function(value){ return !!value; });
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return _.reduce(array, function(memo, value) {
      if (_.isArray(value)) return memo.concat(shallow ? value : _.flatten(value));
      memo[memo.length] = value;
      return memo;
    }, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator) {
    var initial = iterator ? _.map(array, iterator) : array;
    var result = [];
    _.reduce(initial, function(memo, el, i) {
      if (0 == i || (isSorted === true ? _.last(memo) != el : !_.include(memo, el))) {
        memo[memo.length] = el;
        result[result.length] = array[i];
      }
      return memo;
    }, []);
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays. (Aliased as "intersect" for back-compat.)
  _.intersection = _.intersect = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = _.flatten(slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.include(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) results[i] = _.pluck(args, "" + i);
    return results;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i, l;
    if (isSorted) {
      i = _.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (i = 0, l = array.length; i < l; i++) if (i in array && array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item) {
    if (array == null) return -1;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
    var i = array.length;
    while (i--) if (i in array && array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
  // We check for `func.bind` first, to fail fast when `func` is undefined.
  _.bind = function bind(func, context) {
    var bound, args;
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(func, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, throttling, more;
    var whenDone = _.debounce(function(){ more = throttling = false; }, wait);
    return function() {
      context = this; args = arguments;
      var later = function() {
        timeout = null;
        if (more) func.apply(context, args);
        whenDone();
      };
      if (!timeout) timeout = setTimeout(later, wait);
      if (throttling) {
        more = true;
      } else {
        func.apply(context, args);
      }
      whenDone();
      throttling = true;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds.
  _.debounce = function(func, wait) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      return memo = func.apply(this, arguments);
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func].concat(slice.call(arguments, 0));
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) { return func.apply(this, arguments); }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    return _.map(obj, _.identity);
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (obj[prop] == null) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function.
  function eq(a, b, stack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a._chain) a = a._wrapped;
    if (b._chain) b = b._wrapped;
    // Invoke a custom `isEqual` method if one is provided.
    if (a.isEqual && _.isFunction(a.isEqual)) return a.isEqual(b);
    if (b.isEqual && _.isFunction(b.isEqual)) return b.isEqual(a);
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = stack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (stack[length] == a) return true;
    }
    // Add the first object to the stack of traversed objects.
    stack.push(a);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          // Ensure commutative equality for sparse arrays.
          if (!(result = size in a == size in b && eq(a[size], b[size], stack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent.
      if ('constructor' in a != 'constructor' in b || a.constructor != b.constructor) return false;
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], stack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    stack.pop();
    return result;
  }

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType == 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Is a given variable an arguments object?
  _.isArguments = function(obj) {
    return toString.call(obj) == '[object Arguments]';
  };
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Is a given value a function?
  _.isFunction = function(obj) {
    return toString.call(obj) == '[object Function]';
  };

  // Is a given value a string?
  _.isString = function(obj) {
    return toString.call(obj) == '[object String]';
  };

  // Is a given value a number?
  _.isNumber = function(obj) {
    return toString.call(obj) == '[object Number]';
  };

  // Is the given value `NaN`?
  _.isNaN = function(obj) {
    // `NaN` is the only value for which `===` is not reflexive.
    return obj !== obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value a date?
  _.isDate = function(obj) {
    return toString.call(obj) == '[object Date]';
  };

  // Is the given value a regular expression?
  _.isRegExp = function(obj) {
    return toString.call(obj) == '[object RegExp]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Has own property?
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function (n, iterator, context) {
    for (var i = 0; i < n; i++) iterator.call(context, i);
  };

  // Escape a string for HTML interpolation.
  _.escape = function(string) {
    return (''+string).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g,'&#x2F;');
  };

  // Add your own custom functions to the Underscore object, ensuring that
  // they're correctly added to the OOP wrapper as well.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      addToWrapper(name, _[name] = obj[name]);
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = idCounter++;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /.^/;

  // Within an interpolation, evaluation, or escaping, remove HTML escaping
  // that had been previously added.
  var unescape = function(code) {
    return code.replace(/\\\\/g, '\\').replace(/\\'/g, "'");
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(str, data) {
    var c  = _.templateSettings;
    var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
      'with(obj||{}){__p.push(\'' +
      str.replace(/\\/g, '\\\\')
         .replace(/'/g, "\\'")
         .replace(c.escape || noMatch, function(match, code) {
           return "',_.escape(" + unescape(code) + "),'";
         })
         .replace(c.interpolate || noMatch, function(match, code) {
           return "'," + unescape(code) + ",'";
         })
         .replace(c.evaluate || noMatch, function(match, code) {
           return "');" + unescape(code).replace(/[\r\n\t]/g, ' ') + ";__p.push('";
         })
         .replace(/\r/g, '\\r')
         .replace(/\n/g, '\\n')
         .replace(/\t/g, '\\t')
         + "');}return __p.join('');";
    var func = new Function('obj', '_', tmpl);
    if (data) return func(data, _);
    return function(data) {
      return func.call(this, data, _);
    };
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // The OOP Wrapper
  // ---------------

  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.
  var wrapper = function(obj) { this._wrapped = obj; };

  // Expose `wrapper.prototype` as `_.prototype`
  _.prototype = wrapper.prototype;

  // Helper function to continue chaining intermediate results.
  var result = function(obj, chain) {
    return chain ? _(obj).chain() : obj;
  };

  // A method to easily add functions to the OOP wrapper.
  var addToWrapper = function(name, func) {
    wrapper.prototype[name] = function() {
      var args = slice.call(arguments);
      unshift.call(args, this._wrapped);
      return result(func.apply(_, args), this._chain);
    };
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      var wrapped = this._wrapped;
      method.apply(wrapped, arguments);
      var length = wrapped.length;
      if ((name == 'shift' || name == 'splice') && length === 0) delete wrapped[0];
      return result(wrapped, this._chain);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      return result(method.apply(this._wrapped, arguments), this._chain);
    };
  });

  // Start chaining a wrapped Underscore object.
  wrapper.prototype.chain = function() {
    this._chain = true;
    return this;
  };

  // Extracts the result from a wrapped and chained object.
  wrapper.prototype.value = function() {
    return this._wrapped;
  };

}).call(this);

});

require.define("/node_modules/shred/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"main":"./lib/shred.js"}
});

require.define("/node_modules/shred/lib/shred.js", function (require, module, exports, __dirname, __filename) {
    // Shred is an HTTP client library intended to simplify the use of Node's
// built-in HTTP library. In particular, we wanted to make it easier to interact
// with HTTP-based APIs.
// 
// See the [examples](./examples.html) for more details.

var _ = require("underscore")
// Ax is a nice logging library we wrote. You can use any logger, providing it
// has `info`, `warn`, `debug`, and `error` methods that take a string.
  , Ax = require("ax")
  , CookieJarLib = require( "cookiejar" )
  , CookieJar = CookieJarLib.CookieJar
;

// Shred takes some options, including a logger and request defaults.

var Shred = function(options) {
  options = (options||{});
  this.agent = options.agent;
  this.defaults = options.defaults||{};
  this.log = options.logger||(new Ax({ level: "info" }));
  this._sharedCookieJar = new CookieJar();
};

// Most of the real work is done in the request and reponse classes.
 
Shred.Request = require("./shred/request");
Shred.Response = require("./shred/response");

// The `request` method kicks off a new request, instantiating a new `Request`
// object and passing along whatever default options we were given.

Shred.prototype = {
  request: function(options) {
    options.logger = this.log;
    options.cookieJar = ( 'cookieJar' in options ) ? options.cookieJar : this._sharedCookieJar; // let them set cookieJar = null
    options.agent = options.agent || this.agent;
    return new Shred.Request(_.defaults(options,this.defaults));
  }
};

// Define a bunch of convenience methods so that you don't have to include
// a `method` property in your request options.

"get put post delete".split(" ").forEach(function(method) {
  Shred.prototype[method] = function(options) {
    options.method = method;
    return this.request(options);
  };
});


module.exports = Shred;

});

require.define("/node_modules/shred/node_modules/ax/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"main":"./lib/ax.js"}
});

require.define("/node_modules/shred/node_modules/ax/lib/ax.js", function (require, module, exports, __dirname, __filename) {
    var inspect = require("util").inspect
  , fs = require("fs")
  , colors = require('colors')
  , _ = require('underscore')
;


// this is a quick-and-dirty logger. there are other nicer loggers out there
// but the ones i found were also somewhat involved. this one has a Ruby
// logger type interface and color codes the console output
//
// we can easily replace this, provide the info, debug, etc. methods are the
// same. or, we can change Haiku to use a more standard node.js interface

var format = function(level,message) {
  var debug = (level=="debug"||level=="error");
  if (!message) { return message.toString(); }
  if (typeof(message) == "object") {
    if (message instanceof Error && debug) {
      return message.stack;
    } else {
      return inspect(message);
    }
  } else {
    return message.toString();
  }
};

var noOp = function(message) { return this; }
var makeLogger = function(level,fn) {
  return function(message) { 
    this.stream.write(this.format(level, message)+"\n");
    return this;
  }
};

var Logger = function(options) {
  var logger = this;
	var options = options||{};
  // this.level = options.level;
  // this.colors = options.colors || this.colors;

  // Default options
  logger.options = _.defaults(options, {
      level: 'info'
    , colors: {
        info: 'green'
      , warn: 'yellow'
      , debug: 'cyan'
      , error: 'red'
      }
    , prefix: ''
  });

  // Allows a prefix to be added to the message.
  //
  //    var logger = new Ax({ module: 'Haiku' })
  //    logger.warn('this is going to be awesome!');
  //    //=> Haiku: this is going to be awesome!
  //
  if (logger.options.module){
    logger.options.prefix = logger.options.module + ': ';
  }

  // Write to stderr or a file
  if (logger.options.file){
    logger.stream = fs.createWriteStream(logger.options.file, {"flags": "a"});
  } else {
      if(process.title === "node")
	  logger.stream = process.stderr;
      else if(process.title === "browser")
	  logger.stream = console[logger.options.level];
  }

  switch(logger.options.level){
    case 'debug':
      _.each(['debug', 'info', 'warn'], function(level){
        logger[level] = Logger.writer(level);
      });
    case 'info':
      _.each(['info', 'warn'], function(level){
        logger[level] = Logger.writer(level);
      });
    case 'warn':
      logger.warn = Logger.writer('warn');
  }
}

// Used to define logger methods
Logger.writer = function(level){
  return function(message){
    var logger = this;

    if(process.title === "node")
	logger.stream.write(logger.format(level, message) + '\n');
    else if(process.title === "browser")
	logger.stream(logger.format(level, message) + '\n');

  };
}


Logger.prototype = {
  info: function(){},
  debug: function(){},
  warn: function(){},
  error: Logger.writer('error'),
  format: function(level, message){
    if (! message) return '';

    var logger = this
      , prefix = logger.options.prefix
      , color = logger.options.colors[level]
    ;

    // TODO: maybe this should handle

    return (prefix + message)[color];
  }
};

module.exports = Logger;

});

require.define("util", function (require, module, exports, __dirname, __filename) {
    // todo

});

require.define("fs", function (require, module, exports, __dirname, __filename) {
    // nothing to see here... no file methods for the browser

});

require.define("/node_modules/shred/node_modules/ax/node_modules/colors/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"main":"colors"}
});

require.define("/node_modules/shred/node_modules/ax/node_modules/colors/colors.js", function (require, module, exports, __dirname, __filename) {
    /*
colors.js

Copyright (c) 2010 Alexis Sellier (cloudhead) , Marak Squires

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

// prototypes the string object to have additional method calls that add terminal colors
var isHeadless = (typeof module !== 'undefined');
['bold', 'underline', 'italic', 'inverse', 'grey', 'yellow', 'red', 'green', 'blue', 'white', 'cyan', 'magenta'].forEach(function (style) {

  // __defineGetter__ at the least works in more browsers
  // http://robertnyman.com/javascript/javascript-getters-setters.html
  // Object.defineProperty only works in Chrome
  String.prototype.__defineGetter__(style, function () {
    return isHeadless ?
             stylize(this, style) : // for those running in node (headless environments)
             this.replace(/( )/, '$1'); // and for those running in browsers:
             // re: ^ you'd think 'return this' works (but doesn't) so replace coerces the string to be a real string
  });
});

// prototypes string with method "rainbow"
// rainbow will apply a the color spectrum to a string, changing colors every letter
String.prototype.__defineGetter__('rainbow', function () {
  if (!isHeadless) {
    return this.replace(/( )/, '$1');
  }
  var rainbowcolors = ['red','yellow','green','blue','magenta']; //RoY G BiV
  var exploded = this.split("");
  var i=0;
  exploded = exploded.map(function(letter) {
    if (letter==" ") {
      return letter;
    }
    else {
      return stylize(letter,rainbowcolors[i++ % rainbowcolors.length]);
    }
  });
  return exploded.join("");
});

function stylize(str, style) {
  var styles = {
  //styles
  'bold'      : [1,  22],
  'italic'    : [3,  23],
  'underline' : [4,  24],
  'inverse'   : [7,  27],
  //grayscale
  'white'     : [37, 39],
  'grey'      : [90, 39],
  'black'     : [90, 39],
  //colors
  'blue'      : [34, 39],
  'cyan'      : [36, 39],
  'green'     : [32, 39],
  'magenta'   : [35, 39],
  'red'       : [31, 39],
  'yellow'    : [33, 39]
  };
  return '\033[' + styles[style][0] + 'm' + str +
         '\033[' + styles[style][1] + 'm';
};

// don't summon zalgo
String.prototype.__defineGetter__('zalgo', function () {
  return zalgo(this);
});

// please no
function zalgo(text, options) {
  var soul = {
    "up" : [
      '̍','̎','̄','̅',
      '̿','̑','̆','̐',
      '͒','͗','͑','̇',
      '̈','̊','͂','̓',
      '̈','͊','͋','͌',
      '̃','̂','̌','͐',
      '̀','́','̋','̏',
      '̒','̓','̔','̽',
      '̉','ͣ','ͤ','ͥ',
      'ͦ','ͧ','ͨ','ͩ',
      'ͪ','ͫ','ͬ','ͭ',
      'ͮ','ͯ','̾','͛',
      '͆','̚'
      ],
    "down" : [
      '̖','̗','̘','̙',
      '̜','̝','̞','̟',
      '̠','̤','̥','̦',
      '̩','̪','̫','̬',
      '̭','̮','̯','̰',
      '̱','̲','̳','̹',
      '̺','̻','̼','ͅ',
      '͇','͈','͉','͍',
      '͎','͓','͔','͕',
      '͖','͙','͚','̣'
      ],
    "mid" : [
      '̕','̛','̀','́',
      '͘','̡','̢','̧',
      '̨','̴','̵','̶',
      '͜','͝','͞',
      '͟','͠','͢','̸',
      '̷','͡',' ҉'
      ]
  },
  all = [].concat(soul.up, soul.down, soul.mid),
  zalgo = {};

  function randomNumber(range) {
    r = Math.floor(Math.random()*range);
    return r;
  };

  function is_char(character) {
    var bool = false;
    all.filter(function(i){
     bool = (i == character);
    });
    return bool;
  }

  function heComes(text, options){
      result = '';
      options = options || {};
      options["up"] = options["up"] || true;
      options["mid"] = options["mid"] || true;
      options["down"] = options["down"] || true;
      options["size"] = options["size"] || "maxi";
      var counts;
      text = text.split('');
       for(var l in text){
         if(is_char(l)) { continue; }
         result = result + text[l];

        counts = {"up" : 0, "down" : 0, "mid" : 0};

        switch(options.size) {
          case 'mini':
            counts.up = randomNumber(8);
            counts.min= randomNumber(2);
            counts.down = randomNumber(8);
          break;
          case 'maxi':
            counts.up = randomNumber(16) + 3;
            counts.min = randomNumber(4) + 1;
            counts.down = randomNumber(64) + 3;
          break;
          default:
            counts.up = randomNumber(8) + 1;
            counts.mid = randomNumber(6) / 2;
            counts.down= randomNumber(8) + 1;
          break;
        }

        var arr = ["up", "mid", "down"];
        for(var d in arr){
          var index = arr[d];
          for (var i = 0 ; i <= counts[index]; i++)
          {
            if(options[index]) {
                result = result + soul[index][randomNumber(soul[index].length)];
              }
            }
          }
        }
      return result;
  };
  return heComes(text);
}

});

require.define("/node_modules/shred/node_modules/cookiejar/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"main":"cookiejar.js"}
});

require.define("/node_modules/shred/node_modules/cookiejar/cookiejar.js", function (require, module, exports, __dirname, __filename) {
    exports.CookieAccessInfo=CookieAccessInfo=function CookieAccessInfo(domain,path,secure,script) {
    if(this instanceof CookieAccessInfo) {
    	this.domain=domain||undefined;
    	this.path=path||"/";
    	this.secure=!!secure;
    	this.script=!!script;
    	return this;
    }
    else {
        return new CookieAccessInfo(domain,path,secure,script)    
    }
}

exports.Cookie=Cookie=function Cookie(cookiestr) {
	if(cookiestr instanceof Cookie) {
		return cookiestr;
	}
    else {
        if(this instanceof Cookie) {
        	this.name = null;
        	this.value = null;
        	this.expiration_date = Infinity;
        	this.path = "/";
        	this.domain = null;
        	this.secure = false; //how to define?
        	this.noscript = false; //httponly
        	if(cookiestr) {
        		this.parse(cookiestr)
        	}
        	return this;
        }
        return new Cookie(cookiestr)
    }
}

Cookie.prototype.toString = function toString() {
	var str=[this.name+"="+this.value];
	if(this.expiration_date !== Infinity) {
		str.push("expires="+(new Date(this.expiration_date)).toGMTString());
	}
	if(this.domain) {
		str.push("domain="+this.domain);
	}
	if(this.path) {
		str.push("path="+this.path);
	}
	if(this.secure) {
		str.push("secure");
	}
	if(this.noscript) {
		str.push("httponly");
	}
	return str.join("; ");
}

Cookie.prototype.toValueString = function toValueString() {
	return this.name+"="+this.value;
}

var cookie_str_splitter=/[:](?=\s*[a-zA-Z0-9_\-]+\s*[=])/g
Cookie.prototype.parse = function parse(str) {
	if(this instanceof Cookie) {
    	var parts=str.split(";")
    	, pair=parts[0].match(/([^=]+)=((?:.|\n)*)/)
    	, key=pair[1]
    	, value=pair[2];
    	this.name = key;
    	this.value = value;
    
    	for(var i=1;i<parts.length;i++) {
    		pair=parts[i].match(/([^=]+)(?:=((?:.|\n)*))?/)
    		, key=pair[1].trim().toLowerCase()
    		, value=pair[2];
    		switch(key) {
    			case "httponly":
    				this.noscript = true;
    			break;
    			case "expires":
    				this.expiration_date = value
    					? Number(Date.parse(value))
    					: Infinity;
    			break;
    			case "path":
    				this.path = value
    					? value.trim()
    					: "";
    			break;
    			case "domain":
    				this.domain = value
    					? value.trim()
    					: "";
    			break;
    			case "secure":
    				this.secure = true;
    			break
    		}
    	}
    
    	return this;
	}
    return new Cookie().parse(str)
}

Cookie.prototype.matches = function matches(access_info) {
	if(this.noscript && access_info.script
	|| this.secure && !access_info.secure
	|| !this.collidesWith(access_info)) {
		return false
	}
	return true;
}

Cookie.prototype.collidesWith = function collidesWith(access_info) {
	if((this.path && !access_info.path) || (this.domain && !access_info.domain)) {
		return false
	}
	if(this.path && access_info.path.indexOf(this.path) !== 0) {
		return false;
	}
	if (this.domain===access_info.domain) {
		return true;
	}
	else if(this.domain && this.domain.charAt(0)===".")
	{
		var wildcard=access_info.domain.indexOf(this.domain.slice(1))
		if(wildcard===-1 || wildcard!==access_info.domain.length-this.domain.length+1) {
			return false;
		}
	}
	else if(this.domain){
		return false
	}
	return true;
}

exports.CookieJar=CookieJar=function CookieJar() {
	if(this instanceof CookieJar) {
    	var cookies = {} //name: [Cookie]
    
    	this.setCookie = function setCookie(cookie) {
    		cookie = Cookie(cookie);
    		//Delete the cookie if the set is past the current time
    		var remove = cookie.expiration_date <= Date.now();
    		if(cookie.name in cookies) {
    			var cookies_list = cookies[cookie.name];
    			for(var i=0;i<cookies_list.length;i++) {
    				var collidable_cookie = cookies_list[i];
    				if(collidable_cookie.collidesWith(cookie)) {
    					if(remove) {
    						cookies_list.splice(i,1);
    						if(cookies_list.length===0) {
    							delete cookies[cookie.name]
    						}
    						return false;
    					}
    					else {
    						return cookies_list[i]=cookie;
    					}
    				}
    			}
    			if(remove) {
    				return false;
    			}
    			cookies_list.push(cookie);
    			return cookie;
    		}
    		else if(remove){
    			return false;
    		}
    		else {
    			return cookies[cookie.name]=[cookie];
    		}
    	}
    	//returns a cookie
    	this.getCookie = function getCookie(cookie_name,access_info) {
    		var cookies_list = cookies[cookie_name];
    		for(var i=0;i<cookies_list.length;i++) {
    			var cookie = cookies_list[i];
    			if(cookie.expiration_date <= Date.now()) {
    				if(cookies_list.length===0) {
    					delete cookies[cookie.name]
    				}
    				continue;
    			}
    			if(cookie.matches(access_info)) {
    				return cookie;
    			}
    		}
    	}
    	//returns a list of cookies
    	this.getCookies = function getCookies(access_info) {
    		var matches=[];
    		for(var cookie_name in cookies) {
    			var cookie=this.getCookie(cookie_name,access_info);
    			if (cookie) {
    				matches.push(cookie);
    			}
    		}
    		matches.toString=function toString(){return matches.join(":");}
            matches.toValueString=function() {return matches.map(function(c){return c.toValueString();}).join(';');}
    		return matches;
    	}
    
    	return this;
	}
    return new CookieJar()
}


//returns list of cookies that were set correctly
CookieJar.prototype.setCookies = function setCookies(cookies) {
	cookies=Array.isArray(cookies)
		?cookies
		:cookies.split(cookie_str_splitter);
	var successful=[]
	for(var i=0;i<cookies.length;i++) {
		var cookie = Cookie(cookies[i]);
		if(this.setCookie(cookie)) {
			successful.push(cookie);
		}
	}
	return successful;
}

});

require.define("/node_modules/shred/lib/shred/request.js", function (require, module, exports, __dirname, __filename) {
    // The request object encapsulates a request, creating a Node.js HTTP request and
// then handling the response.

var HTTP = require("http")
  , HTTPS = require("https")
  , parseUri = require("./parseUri")
  , Emitter = require('events').EventEmitter
  , sprintf = require("sprintf").sprintf
  , _ = require("underscore")
  , Response = require("./response")
  , HeaderMixins = require("./mixins/headers")
  , Content = require("./content")
;

var STATUS_CODES = HTTP.STATUS_CODES;

// The Shred object itself constructs the `Request` object. You should rarely
// need to do this directly.

var Request = function(options) {
  this.log = options.logger;
  this.cookieJar = options.cookieJar;
  processOptions(this,options||{});
  createRequest(this);
};

// A `Request` has a number of properties, many of which help with details like
// URL parsing or defaulting the port for the request.

Object.defineProperties(Request.prototype, {

// - **url**. You can set the `url` property with a valid URL string and all the
//   URL-related properties (host, port, etc.) will be automatically set on the
//   request object.

  url: {
    get: function() {
      if (!this.scheme) { return null; }
      return sprintf("%s://%s:%s%s",
          this.scheme, this.host, this.port,
          (this.proxy ? "/" : this.path) +
          (this.query ? ("?" + this.query) : ""));
    },
    set: function(_url) {
      _url = parseUri(_url);
      this.scheme = _url.protocol;
      this.host = _url.host;
      this.port = _url.port;
      this.path = _url.path;
      this.query = _url.query;
      return this;
    },
    enumerable: true
  },

// - **headers**. Returns a hash representing the request headers. You can't set
//   this directly, only get it. You can add or modify headers by using the
//   `setHeader` or `setHeaders` method. This ensures that the headers are
//   normalized - that is, you don't accidentally send `Content-Type` and
//   `content-type` headers. Keep in mind that if you modify the returned hash,
//   it will *not* modify the request headers.

  headers: {
    get: function() {
      return this.getHeaders();
    },
    enumerable: true
  },

// - **port**. Unless you set the `port` explicitly or include it in the URL, it
//   will default based on the scheme.

  port: {
    get: function() {
      if (!this._port) {
        switch(this.scheme) {
          case "https": return this._port = 443;
          case "http":
          default: return this._port = 80;
        }
      }
      return this._port;
    },
    set: function(value) { this._port = value; return this; },
    enumerable: true
  },

// - **method**. The request method - `get`, `put`, `post`, etc. that will be
//   used to make the request. Defaults to `get`.

  method: {
    get: function() {
      return this._method = (this._method||"GET");
    },
    set: function(value) {
      this._method = value; return this;
    },
    enumerable: true
  },

// - **query**. Can be set either with a query string or a hash (object). Get
//   will always return a properly escaped query string or null if there is no
//   query component for the request.

  query: {
    get: function() {return this._query;},
    set: function(value) {
      var stringify = function (hash) {
        var query = "";
        for (var key in hash) {
          query += encodeURIComponent(key) + '=' + encodeURIComponent(hash[key]) + '&';
        }
        // Remove the last '&'
        query = query.slice(0, -1);
        return query;
      }

      if (value) {
        if (typeof value === 'object') {
          value = stringify(value);
        }
        this._query = value;
      } else {
        this._query = "";
      }
      return this;
    },
    enumerable: true
  },

// - **parameters**. This will return the query parameters in the form of a hash
//   (object).

  parameters: {
    get: function() { return QueryString.parse(this._query||""); },
    enumerable: true
  },

// - **content**. (Aliased as `body`.) Set this to add a content entity to the
//   request. Attempts to use the `content-type` header to determine what to do
//   with the content value. Get this to get back a [`Content`
//   object](./content.html).

  body: {
    get: function() { return this._body; },
    set: function(value) {
      this._body = new Content({
        data: value,
        type: this.getHeader("Content-Type")
      });
      this.setHeader("Content-Type",this.content.type);
      this.setHeader("Content-Length",this.content.length);
      return this;
    },
    enumerable: true
  },

// - **timeout**. Used to determine how long to wait for a response. Does not
//   distinguish between connect timeouts versus request timeouts. Set either in
//   milliseconds or with an object with temporal attributes (hours, minutes,
//   seconds) and convert it into milliseconds. Get will always return
//   milliseconds.

  timeout: {
    get: function() { return this._timeout; }, // in milliseconds
    set: function(timeout) {
      var request = this
        , milliseconds = 0;
      ;
      if (!timeout) return this;
      if (typeof options=="number") { milliseconds = options; }
      else {
        milliseconds = (options.milliseconds||0) +
          (1000 * ((options.seconds||0) +
              (60 * ((options.minutes||0) +
                (60 * (options.hours||0))))));
      }
      this._timeout = milliseconds;
      return this;
    },
    enumerable: true
  }
});

// Alias `body` property to `content`. Since the [content object](./content.html)
// has a `body` attribute, it's preferable to use `content` since you can then
// access the raw content data using `content.body`.

Object.defineProperty(Request.prototype,"content",
    Object.getOwnPropertyDescriptor(Request.prototype, "body"));

// The `Request` object can be pretty overwhelming to view using the built-in
// Node.js inspect method. We want to make it a bit more manageable. This
// probably goes [too far in the other
// direction](https://github.com/spire-io/shred/issues/2).

_.extend(Request.prototype,{
  inspect: function() {
    var request = this;
    var headers = _(request.headers).reduce(function(array,value,key){
      array.push("\t" + key + ": " + value); return array;
    },[]).join("\n");
    var summary = ["<Shred Request> ", request.method.toUpperCase(),
        request.url].join(" ")
    return [ summary, "- Headers:", headers].join("\n");
  }
});

// Allow chainable 'on's:  shred.get({ ... }).on( ... ).  You can pass in a
// single function, a pair (event, function), or a hash:
// { event: function, event: function }
_.extend(Request.prototype,{
  on: function(eventOrHash, listener) {
    var emitter = this.emitter;
    // Pass in a single argument as a function then make it the default response handler
    if (arguments.length === 1 && typeof(eventOrHash) === 'function') {
      emitter.on('response', eventOrHash);
    } else if (arguments.length === 1 && typeof(eventOrHash) === 'object') {
      _(eventOrHash).each(function(value,key) {
        emitter.on(key,value);
      });
    } else {
      emitter.on(eventOrHash, listener);
    }
    return this;
  }
});

// Add in the header methods. Again, these ensure we don't get the same header
// multiple times with different case conventions.
HeaderMixins.gettersAndSetters(Request);

// `processOptions` is called from the constructor to handle all the work
// associated with making sure we do our best to ensure we have a valid request.

var processOptions = function(request,options) {

  request.log.debug("Processing request options ..");

  // We'll use `request.emitter` to manage the `on` event handlers.
  request.emitter = (new Emitter);

  request.agent = options.agent;

  // Set up the handlers ...
  if (options.on) {
    _(options.on).each(function(value,key) {
      request.emitter.on(key,value);
    });
  }

  // Make sure we were give a URL or a host
  if (!options.url && !options.host) {
    request.emitter.emit("request_error",
        new Error("No url or url options (host, port, etc.)"));
    return;
  }

  // Allow for the [use of a proxy](http://www.jmarshall.com/easy/http/#proxies).

  if (options.url) {
    if (options.proxy) {
      request.url = options.proxy;
      request.path = options.url;
    } else {
      request.url = options.url;
    }
  }

  // Set the remaining options.
  request.query = options.query||options.parameters;
  request.method = options.method;
  request.setHeader("user-agent",options.agent||"Shred for Node.js, Version 0.5.0");
  request.setHeaders(options.headers);

  if (request.cookieJar) {
    var cookies = request.cookieJar.getCookies( CookieAccessInfo( request.host, request.path ) );
    if (cookies.length) {
      var cookieString = request.getHeader('cookie')||'';
      for (var cookieIndex = 0; cookieIndex < cookies.length; ++cookieIndex) {
          if ( cookieString.length && cookieString[ cookieString.length - 1 ] != ';' )
          {
              cookieString += ';';
          }
          cookieString += cookies[ cookieIndex ].name + '=' + cookies[ cookieIndex ].value + ';';
      }
      request.setHeader("cookie", cookieString);
    }
  }
  
  // The content entity can be set either using the `body` or `content` attributes.
  if (options.body||options.content) {
    request.content = options.body||options.content;
  }
  request.timeout = options.timeout;

};

// `createRequest` is also called by the constructor, after `processOptions`.
// This actually makes the request and processes the response, so `createRequest`
// is a bit of a misnomer.

var createRequest = function(request) {
  var timeout ;

  request.log.debug("Creating request ..");
  request.log.debug(request);

  var reqParams = {
    host: request.host,
    port: request.port,
    method: request.method,
    path: request.path + (request.query ? '?'+request.query : ""),
    headers: request.getHeaders(),
    // Node's HTTP/S modules will ignore this, but we are using the
    // browserify-http module in the browser for both HTTP and HTTPS, and this
    // is how you differentiate the two.
    scheme: request.scheme,
    // Use a provided agent.  'Undefined' is the default, which uses a global
    // agent.
    agent: request.agent
  };

  var http = request.scheme == "http" ? HTTP : HTTPS;

  // Set up the real request using the selected library. The request won't be
  // sent until we call `.end()`.
  request._raw = http.request(reqParams, function(response) {
    request.log.debug("Received response ..");

    // We haven't timed out and we have a response, so make sure we clear the
    // timeout so it doesn't fire while we're processing the response.
    clearTimeout(timeout);

    // Construct a Shred `Response` object from the response. This will stream
    // the response, thus the need for the callback. We can access the response
    // entity safely once we're in the callback.
    response = new Response(response, request, function(response) {

      // Set up some event magic. The precedence is given first to
      // status-specific handlers, then to responses for a given event, and then
      // finally to the more general `response` handler. In the last case, we
      // need to first make sure we're not dealing with a a redirect.
      var emit = function(event) {
        var emitter = request.emitter;
        var textStatus = STATUS_CODES[response.status] ? STATUS_CODES[response.status].toLowerCase() : null;
        if (emitter.listeners(response.status).length > 0 || emitter.listeners(textStatus).length > 0) {
          emitter.emit(response.status, response);
          emitter.emit(textStatus, response);
        } else {
          if (emitter.listeners(event).length>0) {
            emitter.emit(event, response);
          } else if (!response.isRedirect) {
            emitter.emit("response", response);
            console.warn("Request has no event listener for status code " + response.status);
          }
        }
      };

      // Next, check for a redirect. We simply repeat the request with the URL
      // given in the `Location` header. We fire a `redirect` event.
      if (response.isRedirect) {
        request.log.debug("Redirecting to "
            + response.getHeader("Location"));
        request.url = response.getHeader("Location");
        emit("redirect");
        createRequest(request);

      // Okay, it's not a redirect. Is it an error of some kind?
      } else if (response.isError) {
        emit("error");
      } else {
      // It looks like we're good shape. Trigger the `success` event.
        emit("success");
      }
    });
  });

  // We're still setting up the request. Next, we're going to handle error cases
  // where we have no response. We don't emit an error event because that event
  // takes a response. We don't response handlers to have to check for a null
  // value. However, we [should introduce a different event
  // type](https://github.com/spire-io/shred/issues/3) for this type of error.
  request._raw.on("error", function(error) {
    request.emitter.emit("request_error", error);
  });

  // TCP timeouts should also trigger the "response_error" event.
  request._raw.on('socket', function () {
    request._raw.socket.on('timeout', function () {
      // This should trigger the "error" event on the raw request, which will
      // trigger the "response_error" on the shred request.
      request._raw.abort();
    });
  });


  // We're almost there. Next, we need to write the request entity to the
  // underlying request object.
  if (request.content) {
    request.log.debug("Streaming body: '" +
        request.content.body.slice(0,59) + "' ... ");
    request._raw.write(request.content.body);
  }

  // Finally, we need to set up the timeout. We do this last so that we don't
  // start the clock ticking until the last possible moment.
  if (request.timeout) {
    timeout = setTimeout(function() {
      request.log.debug("Timeout fired, aborting request ...");
      request._raw.abort();
      request.emit("timeout", request);
    },request.timeout);
  }

  // The `.end()` method will cause the request to fire. Technically, it might
  // have already sent the headers and body.
  request.log.debug("Sending request ...");
  request._raw.end();
};

module.exports = Request;

});

require.define("http", function (require, module, exports, __dirname, __filename) {
    // todo

});

require.define("https", function (require, module, exports, __dirname, __filename) {
    // todo

});

require.define("/node_modules/shred/lib/shred/parseUri.js", function (require, module, exports, __dirname, __filename) {
    // parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License

function parseUri (str) {
	var	o   = parseUri.options,
		m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
		uri = {},
		i   = 14;

	while (i--) uri[o.key[i]] = m[i] || "";

	uri[o.q.name] = {};
	uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
		if ($1) uri[o.q.name][$1] = $2;
	});

	return uri;
};

parseUri.options = {
	strictMode: false,
	key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
	q:   {
		name:   "queryKey",
		parser: /(?:^|&)([^&=]*)=?([^&]*)/g
	},
	parser: {
		strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
		loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
	}
};

module.exports = parseUri;

});

require.define("events", function (require, module, exports, __dirname, __filename) {
    if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.toString.call(xs) === '[object Array]'
    }
;

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = list.indexOf(listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

});

require.define("/node_modules/shred/node_modules/sprintf/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"main":"./lib/sprintf"}
});

require.define("/node_modules/shred/node_modules/sprintf/lib/sprintf.js", function (require, module, exports, __dirname, __filename) {
    /**
sprintf() for JavaScript 0.7-beta1
http://www.diveintojavascript.com/projects/javascript-sprintf

Copyright (c) Alexandru Marasteanu <alexaholic [at) gmail (dot] com>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of sprintf() for JavaScript nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL Alexandru Marasteanu BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


Changelog:
2010.11.07 - 0.7-beta1-node
  - converted it to a node.js compatible module

2010.09.06 - 0.7-beta1
  - features: vsprintf, support for named placeholders
  - enhancements: format cache, reduced global namespace pollution

2010.05.22 - 0.6:
 - reverted to 0.4 and fixed the bug regarding the sign of the number 0
 Note:
 Thanks to Raphael Pigulla <raph (at] n3rd [dot) org> (http://www.n3rd.org/)
 who warned me about a bug in 0.5, I discovered that the last update was
 a regress. I appologize for that.

2010.05.09 - 0.5:
 - bug fix: 0 is now preceeded with a + sign
 - bug fix: the sign was not at the right position on padded results (Kamal Abdali)
 - switched from GPL to BSD license

2007.10.21 - 0.4:
 - unit test and patch (David Baird)

2007.09.17 - 0.3:
 - bug fix: no longer throws exception on empty paramenters (Hans Pufal)

2007.09.11 - 0.2:
 - feature: added argument swapping

2007.04.03 - 0.1:
 - initial release
**/

var sprintf = (function() {
	function get_type(variable) {
		return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
	}
	function str_repeat(input, multiplier) {
		for (var output = []; multiplier > 0; output[--multiplier] = input) {/* do nothing */}
		return output.join('');
	}

	var str_format = function() {
		if (!str_format.cache.hasOwnProperty(arguments[0])) {
			str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
		}
		return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
	};

	str_format.format = function(parse_tree, argv) {
		var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
		for (i = 0; i < tree_length; i++) {
			node_type = get_type(parse_tree[i]);
			if (node_type === 'string') {
				output.push(parse_tree[i]);
			}
			else if (node_type === 'array') {
				match = parse_tree[i]; // convenience purposes only
				if (match[2]) { // keyword argument
					arg = argv[cursor];
					for (k = 0; k < match[2].length; k++) {
						if (!arg.hasOwnProperty(match[2][k])) {
							throw(sprintf('[sprintf] property "%s" does not exist', match[2][k]));
						}
						arg = arg[match[2][k]];
					}
				}
				else if (match[1]) { // positional argument (explicit)
					arg = argv[match[1]];
				}
				else { // positional argument (implicit)
					arg = argv[cursor++];
				}

				if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
					throw(sprintf('[sprintf] expecting number but found %s', get_type(arg)));
				}
				switch (match[8]) {
					case 'b': arg = arg.toString(2); break;
					case 'c': arg = String.fromCharCode(arg); break;
					case 'd': arg = parseInt(arg, 10); break;
					case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
					case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
					case 'o': arg = arg.toString(8); break;
					case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
					case 'u': arg = Math.abs(arg); break;
					case 'x': arg = arg.toString(16); break;
					case 'X': arg = arg.toString(16).toUpperCase(); break;
				}
				arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
				pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
				pad_length = match[6] - String(arg).length;
				pad = match[6] ? str_repeat(pad_character, pad_length) : '';
				output.push(match[5] ? arg + pad : pad + arg);
			}
		}
		return output.join('');
	};

	str_format.cache = {};

	str_format.parse = function(fmt) {
		var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
		while (_fmt) {
			if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
				parse_tree.push(match[0]);
			}
			else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
				parse_tree.push('%');
			}
			else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
				if (match[2]) {
					arg_names |= 1;
					var field_list = [], replacement_field = match[2], field_match = [];
					if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
						field_list.push(field_match[1]);
						while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
							if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
								field_list.push(field_match[1]);
							}
							else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
								field_list.push(field_match[1]);
							}
							else {
								throw('[sprintf] huh?');
							}
						}
					}
					else {
						throw('[sprintf] huh?');
					}
					match[2] = field_list;
				}
				else {
					arg_names |= 2;
				}
				if (arg_names === 3) {
					throw('[sprintf] mixing positional and named placeholders is not (yet) supported');
				}
				parse_tree.push(match);
			}
			else {
				throw('[sprintf] huh?');
			}
			_fmt = _fmt.substring(match[0].length);
		}
		return parse_tree;
	};

	return str_format;
})();

var vsprintf = function(fmt, argv) {
	argv.unshift(fmt);
	return sprintf.apply(null, argv);
};

exports.sprintf = sprintf;
exports.vsprintf = vsprintf;
});

require.define("/node_modules/shred/lib/shred/response.js", function (require, module, exports, __dirname, __filename) {
    // The `Response object` encapsulates a Node.js HTTP response.

var _ = require("underscore")
  , Content = require("./content")
  , HeaderMixins = require("./mixins/headers")
  , CookieJarLib = require( "cookiejar" )
  , Cookie = CookieJarLib.Cookie
;

// Browser doesn't have zlib.
var zlib = null;
try {
  zlib = require('zlib');
} catch (e) {
  console.warn("no zlib library");
}

// Construct a `Response` object. You should never have to do this directly. The
// `Request` object handles this, getting the raw response object and passing it
// in here, along with the request. The callback allows us to stream the response
// and then use the callback to let the request know when it's ready.
var Response = function(raw, request, callback) { 
  var response = this;
  this._raw = raw;

  // The `._setHeaders` method is "private"; you can't otherwise set headers on
  // the response.
  this._setHeaders.call(this,raw.headers);
  
  // store any cookies
  if (request.cookieJar && this.getHeader('set-cookie')) {
    var cookieStrings = this.getHeader('set-cookie');
    var cookieObjs = []
      , cookie;

    for (var i = 0; i < cookieStrings.length; i++) {
      var cookieString = cookieStrings[i];
      if (!cookieString) {
        continue;
      }

      if (!cookieString.match(/domain\=/i)) {
        cookieString += '; domain=' + request.host;
      }

      if (!cookieString.match(/path\=/i)) {
        cookieString += '; path=' + request.path;
      }

      try {
        cookie = new Cookie(cookieStr);
        if (cookie) {
          cookieObjs.push(cookie);
        }
      } catch (e) {
        console.warn("Tried to set bad cookie: " + cookieString);
      }
    }

    request.cookieJar.setCookies(cookies);
  }

  this.request = request;
  this.client = request.client;
  this.log = this.request.log;

  // Stream the response content entity and fire the callback when we're done.
  // Store the incoming data in a array of Buffers which we concatinate into one
  // buffer at the end.  We need to use buffers instead of strings here in order
  // to preserve binary data.
  var chunkBuffers = [];
  var dataLength = 0;
  raw.on("data", function(chunk) {
    chunkBuffers.push(chunk);
    dataLength += chunk.length;
  });
  raw.on("end", function() {
    var body;
    if (typeof Buffer === 'undefined') {
      // Just concatinate into a string
      body = chunkBuffers.join('');
    } else {
      // Initialize new buffer and add the chunks one-at-a-time.
      body = new Buffer(dataLength);
      for (var i = 0, pos = 0; i < chunkBuffers.length; i++) {
        chunkBuffers[i].copy(body, pos);
        pos += chunkBuffers[i].length;
      }
    }

    var setBodyAndFinish = function (body) {
      response._body = new Content({ 
      	body: body,
        type: response.getHeader("Content-Type")
      });
      callback(response);
    }

    if (zlib && response.getHeader("Content-Encoding") === 'gzip'){
      zlib.gunzip(body, function (err, gunzippedBody) {
        body = gunzippedBody.toString();
        setBodyAndFinish(body);
      })
    }
    else{
      setBodyAndFinish(body);
    }
  });
};

// The `Response` object can be pretty overwhelming to view using the built-in
// Node.js inspect method. We want to make it a bit more manageable. This
// probably goes [too far in the other
// direction](https://github.com/spire-io/shred/issues/2).

Response.prototype = {
  inspect: function() {
    var response = this;
    var headers = _(response.headers).reduce(function(array,value,key){
      array.push("\t" + key + ": " + value); return array;
    },[]).join("\n");
    var summary = ["<Shred Response> ", response.status].join(" ")
    return [ summary, "- Headers:", headers].join("\n");
  }
};

// `Response` object properties, all of which are read-only:
Object.defineProperties(Response.prototype, {
  
// - **status**. The HTTP status code for the response. 
  status: {
    get: function() { return this._raw.statusCode; },
    enumerable: true
  },

// - **content**. The HTTP content entity, if any. Provided as a [content
//   object](./content.html), which will attempt to convert the entity based upon
//   the `content-type` header. The converted value is available as
//   `content.data`. The original raw content entity is available as
//   `content.body`.
  body: {
    get: function() { return this._body; }
  },
  content: {
    get: function() { return this.body; },
    enumerable: true
  },

// - **isRedirect**. Is the response a redirect? These are responses with 3xx
//   status and a `Location` header.
  isRedirect: {
    get: function() {
      return (this.status>299
          &&this.status<400
          &&this.getHeader("Location"));
    },
    enumerable: true
  },

// - **isError**. Is the response an error? These are responses with status of
//   400 or greater.
  isError: {
    get: function() {
      return (this.status>399)
    },
    enumerable: true
  }
});

// Add in the [getters for accessing the normalized headers](./headers.js).
HeaderMixins.getters(Response);
HeaderMixins.privateSetters(Response);

// Work around Mozilla bug #608735 [https://bugzil.la/608735], which causes
// getAllResponseHeaders() to return {} if the response is a CORS request.
// xhr.getHeader still works correctly.
var getHeader = Response.prototype.getHeader;
Response.prototype.getHeader = function (name) {
  return (getHeader.call(this,name) ||
    (typeof this._raw.getHeader === 'function' && this._raw.getHeader(name)));
};

module.exports = Response;

});

require.define("/node_modules/shred/lib/shred/content.js", function (require, module, exports, __dirname, __filename) {
    var _ = require("underscore");

// The purpose of the `Content` object is to abstract away the data conversions
// to and from raw content entities as strings. For example, you want to be able
// to pass in a Javascript object and have it be automatically converted into a
// JSON string if the `content-type` is set to a JSON-based media type.
// Conversely, you want to be able to transparently get back a Javascript object
// in the response if the `content-type` is a JSON-based media-type.

// One limitation of the current implementation is that it [assumes the `charset` is UTF-8](https://github.com/spire-io/shred/issues/5).

// The `Content` constructor takes an options object, which *must* have either a
// `body` or `data` property and *may* have a `type` property indicating the
// media type. If there is no `type` attribute, a default will be inferred.
var Content = function(options) {
  this.body = options.body;
  this.data = options.data;
  this.type = options.type;
};

Content.prototype = {
  // Treat `toString()` as asking for the `content.body`. That is, the raw content entity.
  //
  //     toString: function() { return this.body; }
  //
  // Commented out, but I've forgotten why. :/
};


// `Content` objects have the following attributes:
Object.defineProperties(Content.prototype,{
  
// - **type**. Typically accessed as `content.type`, reflects the `content-type`
//   header associated with the request or response. If not passed as an options
//   to the constructor or set explicitly, it will infer the type the `data`
//   attribute, if possible, and, failing that, will default to `text/plain`.
  type: {
    get: function() {
      if (this._type) {
        return this._type;
      } else {
        if (this._data) {
          switch(typeof this._data) {
            case "string": return "text/plain";
            case "object": return "application/json";
          }
        }
      }
      return "text/plain";
    },
    set: function(value) {
      this._type = value;
      return this;
    },
    enumerable: true
  },

// - **data**. Typically accessed as `content.data`, reflects the content entity
//   converted into Javascript data. This can be a string, if the `type` is, say,
//   `text/plain`, but can also be a Javascript object. The conversion applied is
//   based on the `processor` attribute. The `data` attribute can also be set
//   directly, in which case the conversion will be done the other way, to infer
//   the `body` attribute.
  data: {
    get: function() {
      if (this._body) {
        return this.processor.parser(this._body);
      } else {
        return this._data;
      }
    },
    set: function(data) {
      if (this._body&&data) Errors.setDataWithBody(this);
      this._data = data;
      return this;
    },
    enumerable: true
  },

// - **body**. Typically accessed as `content.body`, reflects the content entity
//   as a UTF-8 string. It is the mirror of the `data` attribute. If you set the
//   `data` attribute, the `body` attribute will be inferred and vice-versa. If
//   you attempt to set both, an exception is raised.
  body: {
    get: function() {
      if (this._data) {
        return this.processor.stringify(this._data);
      } else {
        return this.processor.stringify(this._body);
      }
    },
    set: function(body) {
      if (this._data&&body) Errors.setBodyWithData(this);
      this._body = body;
      return this;
    },
    enumerable: true
  },

// - **processor**. The functions that will be used to convert to/from `data` and
//   `body` attributes. You can add processors. The two that are built-in are for
//   `text/plain`, which is basically an identity transformation and
//   `application/json` and other JSON-based media types (including custom media
//   types with `+json`). You can add your own processors. See below.
  processor: {
    get: function() {
      var processor = Content.processors[this.type];
      if (processor) {
        return processor;
      } else {
        // Return the first processor that matches any part of the
        // content type. ex: application/vnd.foobar.baz+json will match json.
        processor = _(this.type.split(";")[0]
          .split(/\+|\//)).detect(function(type) {
            return Content.processors[type];
          });
        return Content.processors[processor]||
          {parser:identity,stringify:toString};
      }
    },
    enumerable: true
  },

// - **length**. Typically accessed as `content.length`, returns the length in
//   bytes of the raw content entity.
  length: {
    get: function() { return this.body.length; }
  }
});

Content.processors = {};

// The `registerProcessor` function allows you to add your own processors to
// convert content entities. Each processor consists of a Javascript object with
// two properties:
// - **parser**. The function used to parse a raw content entity and convert it
//   into a Javascript data type.
// - **stringify**. The function used to convert a Javascript data type into a
//   raw content entity.
Content.registerProcessor = function(types,processor) {
  
// You can pass an array of types that will trigger this processor, or just one.
// We determine the array via duck-typing here.
  if (types.forEach) {
    types.forEach(function(type) {
      Content.processors[type] = processor;
    });
  } else {
    // If you didn't pass an array, we just use what you pass in.
    Content.processors[types] = processor;
  }
};

// Register the identity processor, which is used for text-based media types.
var identity = function(x) { return x; }
  , toString = function(x) { return x.toString(); }
Content.registerProcessor(
  ["text/html","text/plain","text"],
  { parser: identity, stringify: toString });

// Register the JSON processor, which is used for JSON-based media types.
Content.registerProcessor(
  ["application/json; charset=utf-8","application/json","json"],
  {
    parser: function(string) {
      return JSON.parse(string);
    },
    stringify: function(data) {
      return JSON.stringify(data); }});

// Error functions are defined separately here in an attempt to make the code
// easier to read.
var Errors = {
  setDataWithBody: function(object) {
    throw new Error("Attempt to set data attribute of a content object " +
        "when the body attributes was already set.");
  },
  setBodyWithData: function(object) {
    throw new Error("Attempt to set body attribute of a content object " +
        "when the data attributes was already set.");
  }
}
module.exports = Content;

});

require.define("/node_modules/shred/lib/shred/mixins/headers.js", function (require, module, exports, __dirname, __filename) {
    // The header mixins allow you to add HTTP header support to any object. This
// might seem pointless: why not simply use a hash? The main reason is that, per
// the [HTTP spec](http://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#sec4.2),
// headers are case-insensitive. So, for example, `content-type` is the same as
// `CONTENT-TYPE` which is the same as `Content-Type`. Since there is no way to
// overload the index operator in Javascript, using a hash to represent the
// headers means it's possible to have two conflicting values for a single
// header.
// 
// The solution to this is to provide explicit methods to set or get headers.
// This also has the benefit of allowing us to introduce additional variations,
// including snake case, which we automatically convert to what Matthew King has
// dubbed "corset case" - the hyphen-separated names with initial caps:
// `Content-Type`. We use corset-case just in case we're dealing with servers
// that haven't properly implemented the spec.
var _ = require("underscore")
;

// Convert headers to corset-case. **Example:** `CONTENT-TYPE` will be converted
// to `Content-Type`.

var corsetCase = function(string) {
  return string.toLowerCase()
      .replace("_","-")
      .replace(/(^|-)(\w)/g, 
          function(s) { return s.toUpperCase(); });
};

// We suspect that `initializeHeaders` was once more complicated ...
var initializeHeaders = function(object) {
  return {};
};

// Access the `_headers` property using lazy initialization. **Warning:** If you
// mix this into an object that is using the `_headers` property already, you're
// going to have trouble.
var $H = function(object) {
  return object._headers||(object._headers=initializeHeaders(object));
};

// Hide the implementations as private functions, separate from how we expose them.

// The "real" `getHeader` function: get the header after normalizing the name.
var getHeader = function(object,name) {
  return $H(object)[corsetCase(name)];
};

// The "real" `getHeader` function: get one or more headers, or all of them
// if you don't ask for any specifics. 
var getHeaders = function(object,names) {
  var keys = (names && names.length>0) ? names : Object.keys($H(object));
  var hash = keys.reduce(function(hash,key) {
    hash[key] = getHeader(object,key);
    return hash;
  },{});
  // Freeze the resulting hash so you don't mistakenly think you're modifying
  // the real headers.
  Object.freeze(hash);
  return hash;
};

// The "real" `setHeader` function: set a header, after normalizing the name.
var setHeader = function(object,name,value) {
  $H(object)[corsetCase(name)] = value;
  return object;
};

// The "real" `setHeaders` function: set multiple headers based on a hash.
var setHeaders = function(object,hash) {
  for( var key in hash ) { setHeader(object,key,hash[key]); };
  return this;
};

// Here's where we actually bind the functionality to an object. These mixins work by
// exposing mixin functions. Each function mixes in a specific batch of features.
module.exports = {
  
  // Add getters.
  getters: function(constructor) {
    constructor.prototype.getHeader = function(name) { return getHeader(this,name); };
    constructor.prototype.getHeaders = function() { return getHeaders(this,_(arguments)); };
  },
  // Add setters but as "private" methods.
  privateSetters: function(constructor) {
    constructor.prototype._setHeader = function(key,value) { return setHeader(this,key,value); };
    constructor.prototype._setHeaders = function(hash) { return setHeaders(this,hash); };
  },
  // Add setters.
  setters: function(constructor) {
    constructor.prototype.setHeader = function(key,value) { return setHeader(this,key,value); };
    constructor.prototype.setHeaders = function(hash) { return setHeaders(this,hash); };
  },
  // Add both getters and setters.
  gettersAndSetters: function(constructor) {
    constructor.prototype.getHeader = function(name) { return getHeader(this,name); };
    constructor.prototype.getHeaders = function() { return getHeaders(this,_(arguments)); };
    constructor.prototype.setHeader = function(key,value) { return setHeader(this,key,value); };
    constructor.prototype.setHeaders = function(hash) { return setHeaders(this,hash); };
  },
};
});

require.define("/spire/api/response_error.js", function (require, module, exports, __dirname, __filename) {
    /**
 * @fileOverview ResponseError class definition
 */

/**
 * ResponseError is a wrapper for request errors, this makes it easier to pass
 * an error to the callbacks of the async functions that still retain their
 * extra contextual information passed into the arguments of requests's error
 * handler
 *
 * @class HTTP Response Error
 * @constructor
 * @param {object} response Response HTTP client
 */
var ResponseError = function (response) {
  this.message = 'ResponseError: ' + response.status;
  this.response = response;
  this.status = response.status;
};

ResponseError.prototype = new Error();

module.exports = ResponseError;

});

require.define("/spire/api/account.js", function (require, module, exports, __dirname, __filename) {
    /**
 * @fileOverview Account Resource class definition
 */

var Resource = require('./resource')
  ;

/**
 * Represents an account in the spire api.
 *
 * @class Account resource
 *
 * @constructor
 * @extends Resource
 * @param spire {object} Spire object
 * @param data {object} Account data from the spire api
 */
function Account(spire, data) {
  this.spire = spire;
  this.data = data;
  this.resourceName = 'account';
}

Account.prototype = new Resource();

module.exports = Account;

/**
 * Resets the account
 *
 * Note that this passes a session to the callback, and not an account.
 * This is because many of the session urls will have changed.
 *
 * @param {function (err, session)} cb Callback
 */
Account.prototype.reset = function (cb) {
  var account = this;
  this.request('reset', function (err, sessionData) {
    if (err) return cb(err);
    account.data = sessionData.resources.account;
    cb(null, sessionData);
  });
};

/**
 * Updates the billing plan for the account.
 *
 * @param {object} info New billing plan data
 * @param {function (err, account)} cb Callback
 */
Account.prototype.updateBillingSubscription = function (info, cb) {
  var account = this;
  this.request('update_billing_subscription', info, function (err, data) {
    if (err) return cb(err);
    account.data = data;
    cb(null, account);
  });
};

/**
 * Requests
 * These define API calls and have no side effects.  They can be run by calling
 *     this.request(<request name>);
 */

/**
 * Reset your account
 * @name reset_key
 * @ignore
 */
Resource.defineRequest(Account.prototype, 'reset', function () {
  return {
    method: 'post',
    url: this.url(),
    headers: {
      'Accept': this.mediaType(),
      'Authorization': this.authorization()
    }
  };
});

/**
 * Updates the billing subscription with the given data.
 * @name update_billing_subscription
 * @ignore
 */
Resource.defineRequest(Account.prototype, 'update_billing_subscription', function (info) {
  var billing = this.data.billing;
  return {
    method: 'put',
    url: billing.url,
    content: info,
    headers: {
      'Accept': this.mediaType(),
      'Content-Type': this.mediaType(),
      'Authorization': this.authorization('invioces')
    }
  };
});

/**
 * Gets the billing invoices for the account.
 * @name billing_invoices
 * @ignore
 */
Resource.defineRequest(Account.prototype, 'billing_invoices', function () {
  var invoices = this.data.billing.invoices;
  return {
    method: 'get',
    url: invoices.url,
    headers: {
      'Accept': "application/json",
      'Authorization': "Capability " + invoices.capability
    }
  };
});

/**
 * Gets the upcoming billing invoices for the account.
 * @name billing_invoices_upcoming
 * @ignore
 */
Resource.defineRequest(Account.prototype, 'billing_invoices_upcoming', function () {
  var upcoming = this.data.billing.invoices.upcoming;
  return {
    method: 'get',
    url: upcoming,
    headers: {
      'Accept': "application/json",
      'Authorization': "Capability " + upcoming.capability
    }
  };
});

});

require.define("/spire/api/billing.js", function (require, module, exports, __dirname, __filename) {
    /**
 * @fileOverview Billing Resource class definition
 */

var Resource = require('./resource');

/**
 * Represents a billing subscription in the spire api.
 *
 * @class Billing Resource
 *
 * @constructor
 * @extends Resource
 * @param spire {object} Spire object
 * @param data {object} Billing data from the spire api
 */
function Billing(spire, data) {
  this.spire = spire;
  this.data = data;
  this.resourceName = 'billing';
}

Billing.prototype = new Resource();

module.exports = Billing;

});

require.define("/spire/api/channel.js", function (require, module, exports, __dirname, __filename) {
    /**
 * @fileOverview Channel Resource class definition
 */
var Resource = require('./resource');

/**
 * Represents a channel in the spire api.
 *
 * @class Channel Resource
 *
 * @constructor
 * @extends Resource
 * @param {object} spire Spire object
 * @param {object} data  Channel data from the spire api
 */
function Channel(spire, data) {
  this.spire = spire;
  this.data = data;
  this.resourceName = 'channel';
}

Channel.prototype = new Resource();

module.exports = Channel;

/**
 * Returns the channel name.
 *
 * @returns {string} Channel name
 */
Channel.prototype.name = function () {
  return this.data.name;
};

/**
 * Publishes a message to the channel.
 *
 * The messages can be a string, or any json'able object.
 *
 * @example
 * spire.channel('myChannel', function (err, channel) {
 *   channel.publish('hello world', function (err, message) {
 *     if (!err) {
 *       // Message has been published.
 *     }
 *   });
 * });
 *
 * @param {string|object} message Message to publish
 * @param {function (err, message)} cb Callback
 */
Channel.prototype.publish = function (message, cb) {
  this.request('publish', { content: message }, cb);
};

/**
 * Gets a subscription to a channel, creating it if necessary.
 *
 * @example
 * spire.channel('myChannel', function (err, channel) {
 *   channel.subscription('mySubscription', function (err, subscription) {
 *     if (!err) {
 *       // `subscription` is the new subscription.
 *     }
 *   });
 * });
 *
 * @param {string} subName Subscription name
 * @param {function (err, subscription)} cb Callback
 */
Channel.prototype.subscription = function (subName, cb) {
  if (!cb) {
    cb = subName;
    subName = null;
  }
  this.spire.subscription(subName, this.name(), cb);
};

/**
 * Requests
 *
 * These define API calls and have no side effects.  They can be run by calling
 *     this.request(<request name>);
 */

/**
 * @name publish
 * @ignore
 * Publishes a message to the channel.
 */
Resource.defineRequest(Channel.prototype, 'publish', function (message) {
  return {
    method: 'post',
    url: this.url(),
    headers: {
      'Authorization': this.authorization(),
      'Accept': this.mediaType('message'),
      'Content-Type': this.mediaType('message')
    },
    content: message
  };
});

});

require.define("/spire/api/session.js", function (require, module, exports, __dirname, __filename) {
    /**
 * @fileOverview Session Resource class definition
 */

var Resource = require('./resource')
  , Account = require('./account')
  , Channel = require('./channel')
  , Subscription = require('./subscription')
  , _ = require('underscore')
  ;

/**
 * Represents a session in the spire api.
 *
 * <p>Sessions contain other resources, like channels and subscriptions.  These
 * can be accessed in the <code>session.resources</code> object.</p>
 *
 * <p>One important resource inside <code>session</code> is the account resource
 * <code>session.account</code>, which is only given to sessions authenticated
 * with an email and password.  The account resource is documented in its own
 * class.</p>
 *
 * <p>Session objects maintain lists of channels and subscriptions.  If you call
 * the <code>session.channels</code> or <code>session.subscriptions</code>
 * methods, you will get back cached data if it exists.  Use the <code>$</code>
 * cache-bypass methods: <code>session.channels$</code> and
 * <code>session.subscriptions$</code> to get fresh data from the api.</p>
 *
 * @class Session Resource
 *
 * @constructor
 * @extends Resource
 * @param {object} spire Spire object
 * @param {object} data Session data from the spire api
 */
function Session(spire, data) {
  this.spire = spire;
  this.data = data;
  this.resourceName = 'session';

  this._channels = {};
  this._subscriptions = {};

	this._storeResources();

}

Session.prototype = new Resource();

module.exports = Session;

/**
 * <p>Gets the Session resource.
 *
 * @param {function (err, session)} cb Callback
 */
Session.prototype.get = function (cb) {
  var session = this;
  this.request('get', function (err, data) {
    if (err) return cb(err);
    session.data = data;
    session._storeResources();
    cb(null, session);
  });
};

/**
 * Gets the account resource.  Only available to sessions that are authenticated
 * with an email and password.
 *
 * Returns a value from the cache, if one if available.
 *
 * @example
 * spire.session.account(function (err, account) {
 *   if (!err) {
 *     // `account` is account resource.
 *   }
 * });
 *
 * @param {function (err, account)} cb Callback
 */
Session.prototype.account = function (cb) {
  if (this._account) return cb(null, this._account);
  this.account$(cb);
};

/**
 * Gets the account resource.  Only available to sessions that are authenticated
 * with an email and password.
 *
 * Always gets a fresh value from the api.
 *
 * @example
 * spire.session.account$(function (err, account) {
 *   if (!err) {
 *     // `account` is account resource.
 *   }
 * });
 * @param {function (err, account)} cb Callback
 */
Session.prototype.account$ = function (cb) {
  var session = this;
  this.request('account', function (err, account) {
    if (err) return cb(err);
    session._account = new Account(session.spire, account);
    cb(null, session._account);
  });
};

/**
 * Resets the account resource.  Only available to sessions that are authenticated
 * with an email and password.
 * *
 * @example
 * spire.session.resetAccount(function (err, session) {
 *   if (!err) {
 *     // `session` is session with new account resource.
 *   }
 * });
 * @param {function (err, session)} cb Callback
 */
Session.prototype.resetAccount = function (cb) {
  var session = this;
  this._account.reset(function (err, sessionData) {
    if (err) return cb(err);
		session.data = sessionData;
		session._storeResources();
    cb(null, session);
  });
};

/**
 * Gets the channels collection.  Returns a hash of Channel resources.
 *
 * Returns a value from the cache, if one if available.
 *
 * @example
 * spire.session.channels(function (err, channels) {
 *   if (!err) {
 *     // `channels` is a hash of all the account's channels
 *   }
 * });
 *
 * @param {function (err, channels)} cb Callback
 */
Session.prototype.channels = function (cb) {
  if (this._channels) return cb(null, this._channels);
  this.channels$(cb);
};

/**
 * Gets the channels collection.  Returns a hasg of Channel resources.
 *
 * Always gets a fresh value from the api.
 *
 * @example
 * spire.session.channels$(function (err, channels) {
 *   if (!err) {
 *     // `channels` is a hash of all the account's channels
 *   }
 * });
 *
 * @param {function (err, channels)} cb Callback
 */
Session.prototype.channels$ = function (cb) {
  var session = this;
  this.request('channels', function (err, channelsData) {
    if (err) return cb(err);
    _.each(channelsData, function (channel, name) {
      session._memoizeChannel(new Channel(session.spire, channel));
    });
    cb(null, session._channels);
  });
};

/**
 * Gets the subscriptions collection.  Returns a hash of Subscription resources.
 *
 * Returns a value from the cache, if one if available.
 *
 * @example
 * spire.session.subscriptions(function (err, subscriptions) {
 *   if (!err) {
 *     // `subscriptions` is a hash of all the account's subscriptions
 *   }
 * });
 *
 * @param {function (err, channels)} cb Callback
 */
Session.prototype.subscriptions = function (cb) {
  if (this._subscriptions) return cb(null, this._subscriptions);
  this.subscriptions$(cb);
};

/**
 * Gets the subscriptions collection.  Returns a hash of Subscription resources.
 *
 * Always gets a fresh value from the api.
 *
 * @example
 * spire.session.subscriptions$(function (err, subscriptions) {
 *   if (!err) {
 *     // `subscriptions` is a hash of all the account's subscriptions
 *   }
 * });
 *
 * @param {function (err, channels)} cb Callback
 */
Session.prototype.subscriptions$ = function (cb) {
  var session = this;
  this.request('subscriptions', function (err, subscriptions) {
    if (err) return cb(err);
    _.each(subscriptions, function (subscription, name) {
      session._memoizeSubscription(new Subscription(session.spire, subscription));
    });
    cb(null, session._subscriptions);
  });
};

/**
 * Creates a channel.  Returns a Channel resource.  Errors if a channel with the
 * specified name exists.
 *
 * @param {string} name Channel name
 * @param {function (err, channel)} cb Callback
 */
Session.prototype.createChannel = function (name, cb) {
  var session = this;
  this.request('create_channel', name, function (err, data) {
    if (err) return cb(err);
    var channel = new Channel(session.spire, data);
    session._memoizeChannel(channel);
    cb(null, channel);
  });
};

/**
 * Creates a subscription to any number of channels.  Returns a Subscription
 * resource.  Errors if a subscription with the specified name exists.
 *
 * @param {string} name Subscription name
 * @param {array} channelNames Array of channel names to subscribe to.  Can be empty.
 * @param {function (err, subscription)} cb Callback
 */
Session.prototype.createSubscription = function (subName, channelNames, cb) {
  var session = this;
  this.channels(function (channels) {
    var channelUrls = _.map(channelNames, function (name) {
      return session._channels[name].url();
    });
    session.request('create_subscription', subName, channelUrls, function (err, sub) {
      if (err) return cb(err);
      var subscription = new Subscription(session.spire, sub);
      session._memoizeSubscription(subscription);
      cb(null, subscription);
    });
  });
};

 /**
 * Stores the channel resource in a hash by its name.
 *
 * @param channel {object} Channel to store
 */
Session.prototype._memoizeChannel = function (channel) {
  this._channels[channel.name()] = channel;
};

/**
 * Stores the subscription resource in a hash by its name.
 *
 * @param subscription {object} Subscription to store
 */
Session.prototype._memoizeSubscription = function (subscription) {
  this._subscriptions[subscription.name()] = subscription;
};

/**
 * Stores the resources.
 */
Session.prototype._storeResources = function () {
  var session = this;
	var resources = {};
  _.each(this.data.resources, function (resource, name) {
    // Turn the account object into an instance of Resource.
    if (name === 'account') {
      resource = new Account(session.spire, resource);
      session._account = resource;
    }
    resources[name] = resource;
  });

  this.resources = resources;
};
/**
 * Requests
 * These define API calls and have no side effects.  They can be run by calling
 *     this.request(<request name>);
 */

/**
 * Gets the account resource.
 * @name account
 * @ignore
 */
Resource.defineRequest(Session.prototype, 'account', function () {
  var resource = this.data.resources.account;
  return {
    method: 'get',
    url: resource.url,
    headers: {
      'Authorization': this.authorization(resource),
      'Accept': this.mediaType('account')
    }
  };
});

/**
 * Gets the channels collection.
 * @name channels
 * @ignore
 */
Resource.defineRequest(Session.prototype, 'channels', function () {
  var collection = this.data.resources.channels;
  return {
    method: 'get',
    url: collection.url,
    headers: {
      'Authorization': this.authorization(collection),
      'Accept': this.mediaType('channels')
    }
  };
});

/**
 * Gets a channel by name.  Returns a collection with a single value: { name: channel }.
 * @name channel_by_name
 * @ignore
 */
Resource.defineRequest(Session.prototype, 'channel_by_name', function (name) {
  var collection = this.data.resources.channels;
  return {
    method: 'get',
    url: collection.url,
    query: { name: name },
    headers: {
      'Authorization': this.authorization(collection),
      'Accept': this.mediaType('channels')
    }
  };
});

/**
 * Creates a channel.  Returns a channel object.
 * @name create_channel
 * @ignore
 */
Resource.defineRequest(Session.prototype, 'create_channel', function (name) {
  var collection = this.data.resources.channels;
  return {
    method: 'post',
    url: collection.url,
    content: { name: name },
    headers: {
      'Authorization': this.authorization(collection),
      'Accept': this.mediaType('channel'),
      'Content-Type': this.mediaType('channel')
    }
  };
});

/**
 * Gets the subscriptions collection.
 * @name subscrtiptions
 * @ignore
 */
Resource.defineRequest(Session.prototype, 'subscriptions', function () {
  var collection = this.data.resources.subscriptions;
  return {
    method: 'get',
    url: collection.url,
    headers: {
      'Authorization': this.authorization(collection),
      'Accept': this.mediaType('subscriptions')
    }
  };
});

/**
 * Creates a subscrtiption.  Returns a subscription object.
 * @name create_subscription
 * @ignore
 */
Resource.defineRequest(Session.prototype, 'create_subscription', function (name, channelUrls) {
  var collection = this.data.resources.subscriptions;
  return {
    method: 'post',
    url: collection.url,
    content: {
      name: name,
      channels: channelUrls
    },
    headers: {
      'Authorization': this.authorization(collection),
      'Accept': this.mediaType('subscription'),
      'Content-Type': this.mediaType('subscription')
    }
  };
});


});

require.define("/spire/api/subscription.js", function (require, module, exports, __dirname, __filename) {
    /**
 * @fileOverview Subscription Resource class definition
 */

var Resource = require('./resource')
  , _ = require('underscore')
  , async = require('async')
  ;

/**
 * Represents a subscription in the spire api.
 *
 * <p>There are a few ways to get messages from a subscription.
 *
 * <p>The first is to call <code>subscription.retrieveMessages</code> directly.
 * This is the most general method, and supports a number of options.
 *
 * <p>There are convenience methods <code>subscription.poll</code and
 * <code>subscription.longPoll</code> which wrap <code>retrieveMessages</code>.
 * The only difference is that <code>subscription.poll</code> has a timeout of
 * 0, so the request will always come back right away, while
 * <code>subscription.longPoll</code> has a 30 second timeout, so the request
 * will wait up to 30 seconds for new messages to arrive before returning.
 *
 * <p>You can also use the <code>message</code> and <code>messages</code> events to
 * listen for new messages on the subscription.
 *
 * <p><pre><code>
 *    subscription.addListener('message', function (message) {
 *      console.log('Message received: ' + message.content);
 *    });
 *
 *    subscription.addListener('messages', function (messages) {
 *      console.log('Received ' + messages.length + ' messages.');
 *    });
 *
 *    subscription.startListening();
 * </code></pre>
 * </p>
 *
 * <p>The `messages` event fires first and contains the all the messages that were
 * received in a single request.  The `message` event fires once per message.
 *
 * @class Subscription Resource
 *
 * @constructor
 * @extends Resource
 * @param {object} spire Spire object
 * @param {object} data Subscription data from the spire api
 */
function Subscription(spire, data) {
  this.spire = spire;
  this.data = data;
  this.resourceName = 'subscription';

  this.last = null;
  this.listening = false;
}

Subscription.prototype = new Resource();

module.exports = Subscription;

/**
 * Gets the name of the subscription.
 *
 * @returns {string} Name
 */
Subscription.prototype.name = function () {
  return this.data.name;
};

/**
 * Starts long polling for the subscription.
 *
 * <p>The <code>message</code> and <code>messages</code> events will fire when a
 * request comes back with messages.  The <code>message</code> event will fire
 * once per message, while the <code>messages</code> event fires every time a
 * request comes back with more than one message.
 *
 * @example
 * subscription.addListener('message', function (message) {
 *   console.log('Message received: ' + message.content);
 * });
 *
 * subscription.addListener('messages', function (messages) {
 *   console.log('Received ' + messages.length + ' messages.');
 * });
 *
 * subscription.startListening();
 *
 * // Stop Listening after 100 seconds.
 * setTimout(function () {
 *   subscription.stopListening();
 *  }, 100000);
 *
 * @param {object} [options] Optional options argument
 * @param {number} [options.last] Optional last message
 * @param {number} [options.delay] Optional delay
 * @param {number} [options.timeout] Optional timeout
 * @param {string} [options.orderBy] Optional ordering ('asc' or 'desc')
 * @param {function (err, messages)} cb Callback
 */
Subscription.prototype.startListening = function (opts) {
  this.listening = true;
  this._listen(opts);
};

/**
 * Stops listening on the subscription.
 */
Subscription.prototype.stopListening = function () {
  this.listening = false;
};

/**
 * Gets messages for the subscription.
 *
 * <p>This method only makes one request.  Use
 * <code>subscription.startListening</code> to poll repeatedly.
 *
 * @example
 * subscription.retrieveMessages(function (err, messages) {
 *   if (!err) {
 *     // `messages` is an array of messages (possably empty)
 *   }
 * });
 *
 * @param {object} [options] Optional options argument
 * @param {number} [options.last] Optional last message
 * @param {number} [options.delay] Optional delay
 * @param {number} [options.timeout] Optional timeout
 * @param {string} [options.orderBy] Optional ordering ('asc' or 'desc')
 * @param {function (err, messages)} cb Callback
 */
Subscription.prototype.retrieveMessages = function (options, cb) {
  var subscription = this;
  if (!cb) {
    cb = options;
    options = {};
  }

  options.orderBy = options.orderBy || 'desc';

  this.request('messages', options, function (err, messagesData) {
    if (err) {
      subscription.emit('error', err);
      return cb(err);
    }

    var messages = messagesData.messages;

    if (messages.length && subscription.listening) {
      subscription.emit('messages', messages);
      _.each(messages, function (message) {
        subscription.emit('message', message);
      });
    }

    cb(null, messages);
  });
};

/**
 * Gets new messages for the subscription.  This method forces a 0 second
 * timeout, so the request will come back immediately, but may have an empty
 * array of messages if there are no new ones.
 *
 * <p>This method only makes one request.  Use
 * <code>subscription.startListening</code> to poll repeatedly.
 *
 * @example
 * subscription.poll(function (err, messages) {
 *   if (!err) {
 *     // `messages` is an array of messages (possably empty)
 *   }
 * });
 *
 * @param {object} [options] Optional options argument
 * @param {number} [options.delay] Optional delay
 * @param {string} [options.orderBy] Optional ordering ('asc' or 'desc')
 * @param {function (err, messages)} cb Callback
 */
Subscription.prototype.poll = function (options, cb) {
  if (!cb) {
    cb = options;
    options = {};
  }
  options.timeout = 0;
  this.longPoll(options, cb);
};

/**
 * Gets new messages for the subscription.
 *
 * <p>This method defaults to a 30 second timeout, so the request will wait up to
 * 30 seconds for a new message to come in.  You can increase the wait time with
 * the <code>options.timeout</code> paraameter.
 *
 * <p>This method only makes one request.  Use `subscription.startListening` to
 * poll repeatedly.
 *
 * @example
 * subscription.longPoll({ timeout: 60 }, function (err, messages) {
 *   if (!err) {
 *     // `messages` is an array of messages (possably empty)
 *   }
 * });
 *
 * @param {object} [options] Optional options argument
 * @param {number} [options.delay] Optional delay
 * @param {string} [options.orderBy] Optional ordering ('asc' or 'desc')
 * @param {number} [options.timeout] Optional timeout
 * @param {function (err, messages)} cb Callback
 */
Subscription.prototype.longPoll = function (options, cb) {
  var subscription = this;
  if (!cb) {
    cb = options;
    options = {};
  }

  // timeout option of 0 means no long poll,
  // so we force it here.
  options.last = this.last;
  options.timeout = options.timeout || 30;
  this.retrieveMessages(options, function (err, messages) {
    if (err) return cb(err);
    if (messages.length) {
      if (options.orderBy === 'asc') {
        subscription.last = _.first(messages).timestamp;
      } else {
        subscription.last = _.last(messages).timestamp;
      }
    }
    cb(null, messages);
  });
};

/**
 * Repeatedly polls for new messages until `subscription.stopListening` is
 * called.
 *
 * You should use `subscription.startListening` instead of calling this method
 * directly.
 */
Subscription.prototype._listen = function (opts) {
  var subscription = this;
  opts = opts || {};
  async.whilst(
    function () { return subscription.listening; },
    function (cb) {
      subscription.longPoll(opts, cb);
    },
    function () {}
  );
};

/**
 * Requests
 *
 * These define API calls and have no side effects.  They can be run by calling
 *     this.request(<request name>);
 */

/**
 * Gets the messages for the subscription, according to various parameters.
 * @name messages
 * @ignore
 */
Resource.defineRequest(Subscription.prototype, 'messages', function (options) {
  options = options || {};
  return {
    method: 'get',
    url: this.url(),
    query: {
      'timeout': options.timeout || 0,
      'last-message': options.last || 0,
      'order-by': options.orderBy || 'desc',
      'delay': options.delay || 0
    },
    headers: {
      'Authorization': this.authorization(),
      'Accept': this.mediaType('events')
    }
  };
});

});

require.define("/node_modules/http-browserify/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"main":"index.js","browserify":"browser.js"}
});

require.define("/node_modules/http-browserify/browser.js", function (require, module, exports, __dirname, __filename) {
    var http = module.exports;
var EventEmitter = require('events').EventEmitter;
var Request = require('./lib/request');

http.request = function (params, cb) {
    if (!params) params = {};
    if (!params.host) params.host = window.location.host.split(':')[0];
    if (!params.port) params.port = window.location.port;
    
    var req = new Request(new xhrHttp, params);
    if (cb) req.on('response', cb);
    return req;
};

http.get = function (params, cb) {
    params.method = 'GET';
    var req = http.request(params, cb);
    req.end();
    return req;
};

var xhrHttp = (function () {
    if (typeof window === 'undefined') {
        throw new Error('no window object present');
    }
    else if (window.XMLHttpRequest) {
        return window.XMLHttpRequest;
    }
    else if (window.ActiveXObject) {
        var axs = [
            'Msxml2.XMLHTTP.6.0',
            'Msxml2.XMLHTTP.3.0',
            'Microsoft.XMLHTTP'
        ];
        for (var i = 0; i < axs.length; i++) {
            try {
                var ax = new(window.ActiveXObject)(axs[i]);
                return function () {
                    if (ax) {
                        var ax_ = ax;
                        ax = null;
                        return ax_;
                    }
                    else {
                        return new(window.ActiveXObject)(axs[i]);
                    }
                };
            }
            catch (e) {}
        }
        throw new Error('ajax not supported in this browser')
    }
    else {
        throw new Error('ajax not supported in this browser');
    }
})();

http.STATUS_CODES = {
    100 : 'Continue',
    101 : 'Switching Protocols',
    102 : 'Processing', // RFC 2518, obsoleted by RFC 4918
    200 : 'OK',
    201 : 'Created',
    202 : 'Accepted',
    203 : 'Non-Authoritative Information',
    204 : 'No Content',
    205 : 'Reset Content',
    206 : 'Partial Content',
    207 : 'Multi-Status', // RFC 4918
    300 : 'Multiple Choices',
    301 : 'Moved Permanently',
    302 : 'Moved Temporarily',
    303 : 'See Other',
    304 : 'Not Modified',
    305 : 'Use Proxy',
    307 : 'Temporary Redirect',
    400 : 'Bad Request',
    401 : 'Unauthorized',
    402 : 'Payment Required',
    403 : 'Forbidden',
    404 : 'Not Found',
    405 : 'Method Not Allowed',
    406 : 'Not Acceptable',
    407 : 'Proxy Authentication Required',
    408 : 'Request Time-out',
    409 : 'Conflict',
    410 : 'Gone',
    411 : 'Length Required',
    412 : 'Precondition Failed',
    413 : 'Request Entity Too Large',
    414 : 'Request-URI Too Large',
    415 : 'Unsupported Media Type',
    416 : 'Requested Range Not Satisfiable',
    417 : 'Expectation Failed',
    418 : 'I\'m a teapot', // RFC 2324
    422 : 'Unprocessable Entity', // RFC 4918
    423 : 'Locked', // RFC 4918
    424 : 'Failed Dependency', // RFC 4918
    425 : 'Unordered Collection', // RFC 4918
    426 : 'Upgrade Required', // RFC 2817
    500 : 'Internal Server Error',
    501 : 'Not Implemented',
    502 : 'Bad Gateway',
    503 : 'Service Unavailable',
    504 : 'Gateway Time-out',
    505 : 'HTTP Version not supported',
    506 : 'Variant Also Negotiates', // RFC 2295
    507 : 'Insufficient Storage', // RFC 4918
    509 : 'Bandwidth Limit Exceeded',
    510 : 'Not Extended' // RFC 2774
};

});

require.define("/node_modules/http-browserify/lib/request.js", function (require, module, exports, __dirname, __filename) {
    var EventEmitter = require('events').EventEmitter;
var Response = require('./response');
var isSafeHeader = require('./isSafeHeader');

var Request = module.exports = function (xhr, params) {
    var self = this;
    self.xhr = xhr;
    self.body = '';
    
    var uri = params.host + ':' + params.port + (params.path || '/');
    
    xhr.open(
        params.method || 'GET',
        (params.scheme || 'http') + '://' + uri,
        true
    );
    
    if (params.headers) {
        Object.keys(params.headers).forEach(function (key) {
            if (!isSafeHeader(key)) return;
            var value = params.headers[key];
            if (Array.isArray(value)) {
                value.forEach(function (v) {
                    xhr.setRequestHeader(key, v);
                });
            }
            else xhr.setRequestHeader(key, value)
        });
    }
    
    var res = new Response(xhr);
    res.on('ready', function () {
        self.emit('response', res);
    });
    
    xhr.onreadystatechange = function () {
        res.handle(xhr);
    };
};

Request.prototype = new EventEmitter;

Request.prototype.setHeader = function (key, value) {
    if ((Array.isArray && Array.isArray(value))
    || value instanceof Array) {
        for (var i = 0; i < value.length; i++) {
            this.xhr.setRequestHeader(key, value[i]);
        }
    }
    else {
        this.xhr.setRequestHeader(key, value);
    }
};

Request.prototype.write = function (s) {
    this.body += s;
};

Request.prototype.end = function (s) {
    if (s !== undefined) this.write(s);
    this.xhr.send(this.body);
};

});

require.define("/node_modules/http-browserify/lib/response.js", function (require, module, exports, __dirname, __filename) {
    var EventEmitter = require('events').EventEmitter;
var isSafeHeader = require('./isSafeHeader');

var Response = module.exports = function (xhr) {
    this.xhr = xhr;
    this.offset = 0;
};

Response.prototype = new EventEmitter;

var capable = {
    streaming : true,
    status2 : true
};

function parseHeaders (xhr) {
    var lines = xhr.getAllResponseHeaders().split(/\r?\n/);
    var headers = {};
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line === '') continue;
        
        var m = line.match(/^([^:]+):\s*(.*)/);
        if (m) {
            var key = m[1].toLowerCase(), value = m[2];
            
            if (headers[key] !== undefined) {
                if ((Array.isArray && Array.isArray(headers[key]))
                || headers[key] instanceof Array) {
                    headers[key].push(value);
                }
                else {
                    headers[key] = [ headers[key], value ];
                }
            }
            else {
                headers[key] = value;
            }
        }
        else {
            headers[line] = true;
        }
    }
    return headers;
}

Response.prototype.getHeader = function (key) {
    var header = this.headers ? this.headers[key.toLowerCase()] : null;
    if (header) return header;

    // Work around Mozilla bug #608735 [https://bugzil.la/608735], which causes
    // getAllResponseHeaders() to return {} if the response is a CORS request.
    // xhr.getHeader still works correctly.
    if (isSafeHeader(key)) {
      return this.xhr.getResponseHeader(key);
    }
    return null;
};

Response.prototype.handle = function () {
    var xhr = this.xhr;
    if (xhr.readyState === 2 && capable.status2) {
        try {
            this.statusCode = xhr.status;
            this.headers = parseHeaders(xhr);
        }
        catch (err) {
            capable.status2 = false;
        }
        
        if (capable.status2) {
            this.emit('ready');
        }
    }
    else if (capable.streaming && xhr.readyState === 3) {
        try {
            if (!this.statusCode) {
                this.statusCode = xhr.status;
                this.headers = parseHeaders(xhr);
                this.emit('ready');
            }
        }
        catch (err) {}
        
        try {
            this.write();
        }
        catch (err) {
            capable.streaming = false;
        }
    }
    else if (xhr.readyState === 4) {
        if (!this.statusCode) {
            this.statusCode = xhr.status;
            this.emit('ready');
        }
        this.write();
        
        if (xhr.error) {
            this.emit('error', xhr.responseText);
        }
        else this.emit('end');
    }
};

Response.prototype.write = function () {
    var xhr = this.xhr;
    if (xhr.responseText.length > this.offset) {
        this.emit('data', xhr.responseText.slice(this.offset));
        this.offset = xhr.responseText.length;
    }
};

});

require.define("/node_modules/http-browserify/lib/isSafeHeader.js", function (require, module, exports, __dirname, __filename) {
    // Taken from http://dxr.mozilla.org/mozilla/mozilla-central/content/base/src/nsXMLHttpRequest.cpp.html
var unsafeHeaders = [
    "accept-charset",
    "accept-encoding",
    "access-control-request-headers",
    "access-control-request-method",
    "connection",
    "content-length",
    "cookie",
    "cookie2",
    "content-transfer-encoding",
    "date",
    "expect",
    "host",
    "keep-alive",
    "origin",
    "referer",
    "set-cookie",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "user-agent",
    "via"
];

module.exports = function (headerName) {
    if (!headerName) return false;
    return (unsafeHeaders.indexOf(headerName.toLowerCase()) === -1)
};

});

require.alias("http-browserify", "/node_modules/http");

require.alias("http-browserify", "/node_modules/https");
