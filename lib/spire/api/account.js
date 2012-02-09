var defineRequest = require('./define_request');

var Accounts = function (spire) {
  this.spire = spire;
};

module.exports = Accounts;

defineRequest(Accounts, 'create', function (account) {
  var spire = this.spire;
  return {
    method: 'post',
    url: spire.resources.accounts.url,
    headers: {
      'Content-Type': spire.headers.mediaType('account'),
      'Accept': spire.headers.mediaType('session')
    },
    content: account,
  };
});

defineRequest(Accounts, 'update', function (account) {
  return {
    method: 'put',
    url: spire.resources.accounts.url,
    headers: {
      'Content-Type': spire.headers.mediaType('account'),
      'Accept': spire.headers.mediaType('session')
    },
    content: account,
  };
});

defineRequest(Accounts, 'reset', function (account) {
  var spire = this.spire;
  return {
    method: 'post',
    url: account.url,
    headers: {
      'Content-Type': spire.headers.mediaType('account'),
      'Accept': spire.headers.mediaType('account'),
      'Authorization': spire.headers.authorization(account)
    }
  };
});
