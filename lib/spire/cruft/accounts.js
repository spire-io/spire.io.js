var API = require('./api')
  ;

// # Account
// Object representing a Spire account
//
// @constructor
// @param data {object} Account data as returned from Spire
var Account = function (data) {
  _.extend(this, data);
};

// ## Account.prototype.passwordResetRequest
// Request a password reset email be sent to email
//
// @param email {string}
// @params cd {function(err)}
Account.prototype.passwordResetRequest = function (email, cb) {
  API.passwordResetRequest(email, cb);
};

// ## Account.prototype.update
// Update the current account with the new account information
// See Spire docs for available settings
//
// @param info {object}
// @param cb {function(err, account)} Callback
Account.prototype.update = function (info, cb) {
  API.account.update(info, cb);
};


