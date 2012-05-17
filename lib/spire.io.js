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

var API = require('./spire/api')
  , Shred = require('shred')
  ;

/**
 * Spire API Client
 *
 * @class <strong>Spire API Client</strong>
 *
 * @example
 * var spire = new Spire();
 *
 * @example
 * var spire = new Spire({
 *   secret: my_account_secret
 * });
 *
 * @constructor
 * @param {object} [opts] Options for Spire
 * @param {string} [secret] The account API secret.  If you do you not set this, you
 * must call one of:
 *   * `spire.start(secret, callback)`
 *   * `spire.login(email, password, callback)` or
 *   * `spire.register(user, callback)
 *   before you can start creating channels.
 * @param {string} [opts.url] Spire url do use (defaults to 'https://api.spire.io')
 * @param {string} opts.version Version of Spire api to use (defaults to '1.0')
 * @param {number} opts.timeout Timeout for requests (defaults to 30 seconds)
 * @param {boolean} opts.logCurl Log all requests as curl commands (defaults to false)
 */
function Spire(opts) {
  opts = opts || {};
  this.api = new API(this, opts);
  this.session = null;
  this.shred = new Shred({
    logCurl: opts.logCurl
  });
}

module.exports = Spire;

/**
 * Start the Spire session with the given account secret.
 *
 * @example
 * var spire = new Spire();
 * spire.start(your_api_secret, function (err, session) {
 *   if (!err) {
 *     // `session` is a spire session.
 *     // Start creating channels and subscripions.
 *   }
 * });
 *
 * @param {string} secret The acccount secret
 * @param {function(err, session)} cb Callback
 */
Spire.prototype.start = function (secret, cb) {
  var spire = this;
  this.api.createSession(secret, function (err, session) {
    if (err) return cb(err);
    spire.session = session;
    cb(null, session);
  });
};

/**
 * Start the Spire session with the given username and password.
 *
 * @example
 * var spire = new Spire();
 * spire.login(your_email, your_password, function (err, session) {
 *   if (!err) {
 *     // `session` is a spire session.
 *     // Start creating channels and subscripions.
 *   }
 * });
 *
 * @param {string} email Email
 * @param {string} password Password
 * @param {function(err, session)} cb Callback
 */
Spire.prototype.login = function (email, password, cb) {
  var spire = this;
  this.api.login(email, password, function (err, session) {
    if (err) return cb(err);
    spire.session = session;
    cb(null, session);
  });
};

/**
 * Retrieve an application with a given application key.
 *
 * @example
 * var spire = new Spire();
 * spire.getApplication('key-for-your-app', function (err, application) {
 *   if (!err) {
 *     // 'application' will now hold your application object.
 *   }
 * });
 *
 * @param {string} application_key Application key
 * @param {function(err, application)} cb Callback
 */
Spire.prototype.getApplication = function (application_key, cb) {
  var spire = this;
  this.api.getApplication(application_key, function (err, application) {
    if (err) return cb(err);
    cb(null, application);
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
 *     // Your account has been registered.
 *     // `session` is a spire session.
 *     // Start creating channels and subscripions.
 *   }
 * });
 *
 * @param {object} user User info
 * @param {string} user.email Email
 * @param {string} user.password Password
 * @param {string} [user.password_confirmation] Optional password confirmation
 * @param {function (err, session)} cb Callback
 */
Spire.prototype.register = function (user, cb) {
  var spire = this;
  this.api.createAccount(user, function (err, session) {
    if (err) return cb(err);
    spire.session = session;
    cb(null, session);
  });
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
 * Number of times to retry creating a channel or subscription before giving up.
 */
Spire.prototype.CREATION_RETRY_LIMIT = 5;
