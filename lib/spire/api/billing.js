var Resource = require('./resource');

function Billing (spire, data) {
  this.spire = spire;
  this.data = data;
};

Billing.prototype = new Resource();

module.exports = Billing;
