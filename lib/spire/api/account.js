var Resource = require('./resource');

function Account (spire, data) {
  this.spire = spire;
  this.data = data;
};

Account.prototype = new Resource();

module.exports = Account;

Resource.defineRequest(Accounts.prototype, 'create', function (account) {
  return {
    method: 'post',
    url: this.url(),
    headers: {
      'Content-Type': this.mediaType(),
      'Accept': this.mediaType(),
    },
    content: account,
  };
});

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

Account.prototype.create = function (data, cb) {
  var account = this;
  this.request('create', data, function (err, data) {
    if (err) return cb(err);
    account.data = data;
    cb(null, account);
  });
};

Account.prototype.update = function (data, cb) {
  var account = this;
  this.request('update', data, function (err, data) {
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
