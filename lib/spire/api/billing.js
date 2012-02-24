/**
 * @fileOverview Billing Resource class definition
 */

var Resource = require('./resource');

/**
 * Represents a billing subscription in the spire api.
 *
 * @class Billing Resource
 *
 * @constructor
 * @extends Resource
 * @param spire {object} Spire object
 * @param data {object} Billing data from the spire api
 */
function Billing(spire, data) {
  this.spire = spire;
  this.data = data;
  this.resourceName = 'billing';
}

Billing.prototype = new Resource();

module.exports = Billing;
