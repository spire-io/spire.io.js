var defineRequest = require('./define_request');

var Billing = function (spire) {
  this.spire = spire;
};

module.exports = Billing;

defineRequest(Billing, 'get', function () {
  var spire = this.spire;
  return {
    method: 'get',
    url: spire.resources.billing.url,
    headers: {
      'Content-Type': spire.headers.mediaType('billing'),
      'Accept': spire.headers.mediaType('billing')
    }
  };
});
