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
function Account (spire, data) {
  this.spire = spire;
  this.data = data;
  this.resourceName = 'account';
};

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
      'Authorization': this.authorization(invioces)
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
    url: invoices.url.upcoming,
    headers: {
      'Accept': "application/json",
      'Authorization': "Capability " + upcoming.capability
    }
  };
});
