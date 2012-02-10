var Description = require('./api/description');
var Sessions = require('./api/sessions');
var Channels = require('./api/channels');
var Subscriptions = require('./api/subscriptions');
var messages = require('./api/messages');
var accounts = require('./api/accounts');
var billing = require('./api/billing');

var API = function (spire, opts) {
  this.spire = spire;

  opts ||= {};
  this.url = opts.url || 'https://api.spire.io';
  this.version = opts.version || '1.0';
  this.timeout = opts.timout || 30 * 1000;

  this.accounts = new Accounts(spire);
  this.sessions = new Sessions(spire);
  this.channels = new Channels(spire);
  this.subscriptions = new Subscriptions(spire);
  this.messages = new Messages(spire);
  this.billing = new Billing(spire);

  this.description = null;
  this.schema = null;
};

module.exports = API;


Resource.defineRequest(API.prototype, 'discover', function () {
  return {
    method: 'get',
    url: this.spire.options.url,
    headers: {
      accept: "application/json"
    }
  };
});

API.prototype.request = Resource.prototype.request;

API.prototype.discover = function (cb) {
  var api = this;
  var spire = this.spire;

  if (this.description) {
    return cb(null, this.description);
  }

  this.request('discover', function (err, description) {
    if (err) cb(err);
    api.description = description;
    api.schema = descrption.schema[api.version];
    cb(null, description);
  });
};




=====
Resource.defineRequest(Sessions, 'create', function (key) {
  var spire = this.spire;
  return {
    method: 'post',
    url: spire.resources.sessions.url,
    headers: {
      'Content-Type': spire.headers.mediaType('account'),
      'Accept': spire.headers.mediaType('session')
    },
    content: {key: key}
  }
});

Resource.defineRequest(Sessions, 'login', function (email, password) {
  var spire = this.spire;
  return {
    method: 'post',
    url: spire.resources.sessions.url,
    headers: {
      'Content-Type': spire.headers.mediaType('account'),
      'Accept': spire.headers.mediaType('session')
    },
    content: {
      email: email,
      password: password
    }
  }
});

