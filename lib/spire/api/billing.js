var Resource = require('./resource');

function Billing (spire, data) {
  this.spire = spire;
  this.data = data;
  this.resourceName = 'billing';
};

Billing.prototype = new Resource();

module.exports = Billing;
