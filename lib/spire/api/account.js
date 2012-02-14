var Resource = require('./resource');

// # Account Resource
// Represents an account in the spire api.
//
// Inherits from `Resource`
//
// @constructor
// @param spire {object} Spire object
// @param data {object} Account data from the spire api
function Account (spire, data) {
  this.spire = spire;
  this.data = data;
  this.resourceName = 'account';
};

Account.prototype = new Resource();

module.exports = Account;

// ## Public Interface

// ### Account.prototype.updateBillingSubscription
// Updates the billing plan for the account.
//
// @param {object} info New billing plan data
// @param {function (err, account)} cb Callback
Account.prototype.updateBillingSubscription = function (info, cb) {
  var account = this;
  this.request('update_billing_subscription', info, function (err, data) {
    if (err) return cb(err);
    account.data = data;
    cb(account);
  });
};

// ## Requests
// These define API calls and have no side effects.  They can be run by calling
//     this.request(<request name>);

// ### update_billing_subscription
// Updates the billing subscription with the given data.
Resource.defineRequest(Account.prototype, 'update_billing_subscription', function (info) {
  var billing = this.data.billing;
  return {
    method: 'put',
    url: billing.url,
    content: info,
    headers: {
      'Accept': this.mediaType(),
      'Content-Type': this.mediaType(),
      'Authorization': this.authorization(invioces)
    }
  };
});

// ### billing_invoices
// Gets the billing invoices for the account.
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

// ### billing_invoices_upcoming
// Gets the upcoming billing invoices for the account.
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
