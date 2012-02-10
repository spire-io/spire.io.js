var Resource = require('./resource');

function Account (spire, data) {
  this.spire = spire;
  this.data = data;
};

Account.prototype = new Resource();

module.exports = Account;

Resource.defineRequest(Accounts.prototype, 'update', function (account) {
  return {
    method: 'put',
    url: this.url(),
    headers: {
      'Content-Type': this.mediaType(),
      'Accept': this.mediaType(),
    },
    content: account,
  };
});

Resource.defineRequest(Accounts.prototype, 'reset', function () {
  return {
    method: 'post',
    url: this.url(),
    headers: {
      'Content-Type': this.mediaType(),
      'Accept': this.mediaType(),
      'Authorization': this.capability()
    }
  };
});

Resource.defineRequest(Accounts.prototype, 'update_billing_subscription', function (info) {
  var billing = this.data.billing;
  return {
    method: 'put',
    url: billing.url,
    content: info,
    headers: {
      'Content-Type': this.mediaType(),
      'Accept': this.mediaType(),
      'Authorization': "Capability " + billing.capability
    }
  };
});

Resource.defineRequest(Accounts.prototype, 'billing_invoices', function () {
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

Resource.defineRequest(Accounts.prototype, 'billing_invoices_upcoming', function () {
  var upcoming = this.data.billing.invoices.upcoming;
  return {
    method: 'get',
    url: invoices.url.upcoming;
    headers: {
      'Accept': "application/json",
      'Authorization': "Capability " + upcoming.capability
    }
  };
});

Resource.defineRequest(Accounts.prototype, 'password_reset', function (email) {
  return {
    method: 'post',
    url: this.data.description.resources.accounts.url,
    content: "",
    query: { email: email }
});

Account.prototype.create = function (data, cb) {
  var account = this;
  this.request('create', data, function (err, data) {
    if (err) return cb(err);
    account.data = data;
    cb(null, account);
  });
};

// ## Account.prototype.update
// Update the current account with the new account information
// See Spire docs for available settings
//
// @param info {object}
// @param cb {function(err, account)} Callback
Account.prototype.update = function (info, cb) {
  var account = this;
  this.request('update', info, function (err, data) {
    if (err) return cb(err);
    account.data = data;
    cb(null, account);
  });
};

Account.prototype.reset = function (cb) {
  var account = this;
  this.request('reset', function (err, data) {
    if (err) return cb(err);
    account.data = data;
    cb(null, account);
  });
};

Account.prototype.updateBillingSubscription = function (info, cb) {
  var account = this;
  this.request('update_billing_subscription', info, function (err, data) {
    if (err) return cb(err);
    account.data = data;
    cb(account);
  });
};

// ## Account.prototype.passwordResetRequest
// Request a password reset email be sent to email
//
// @param email {string}
// @params cd {function(err)}
Account.prototype.passwordResetRequest = function (email, cb) {
  this.request("password_reset", function (err) {
    if (err) return cb(err);
    cb(null);
  });
};

