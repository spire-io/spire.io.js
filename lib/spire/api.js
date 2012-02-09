var Description = require('./api/description');
var Sessions = require('./api/sessions');
var Channels = require('./api/channels');
var Subscriptions = require('./api/subscriptions');
var messages = require('./api/messages');
var accounts = require('./api/accounts');
var billing = require('./api/billing');

var API = function (spire) {
  this.spire = spire;

  this.description = new Description(spire);
  this.accounts = new Accounts(spire);
  this.sessions = new Sessions(spire);
  this.channels = new Channels(spire);
  this.subscriptions = new Subscriptions(spire);
  this.messages = new Messages(spire);
  this.billing = new Billing(spire);

  this._description = null;
  this._schema = null;
};

module.exports = API;

API.prototype.discover = function (cb) {
  var api = this;
  var spire = this.spire;

  if (this._description) {
    return cb(null, this._description);
  }

  this.description.get(function (err, description) {
    if (err) cb(err);
    api._description = description;
    cb(null, description);
  });
};

