var Resource = require('./resource');

function Account (spire, data) {
  this.spire = spire;
  this.data = data;
  this.resourceName = 'account';
};

Account.prototype = new Resource();

module.exports = Account;

Resource.defineRequest(Account.prototype, 'update_billing_subscription', function (info) {
  var billing = this.data.billing;
  return {
    method: 'put',
    url: billing.url,
    content: info,
    headers: {
      'Accept': this.mediaType(),
      'Content-Type': this.mediaType(),
      'Authorization': this.authorization(invioces.capability)
    }
  };
});

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

Resource.defineRequest(Account.prototype, 'billing_invoices_upcoming', function () {
  var upcoming = this.data.billing.invoices.upcoming;
  return {
    method: 'get',
    url: invoices.url.upcoming,
    headers: {
      'Accept': "application/json",
      'Authorization': "Capability " + upcoming.capability
    }
  };
});

Account.prototype.updateBillingSubscription = function (info, cb) {
  var account = this;
  this.request('update_billing_subscription', info, function (err, data) {
    if (err) return cb(err);
    account.data = data;
    cb(account);
  });
};
