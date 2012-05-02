/**
 * @fileOverview Member Resource class definition
 */
var Resource = require('./resource');

/**
 * Represents a member in the spire api.
 *
 * @class Member Resource
 *
 * @constructor
 * @extends Resource
 * @param {object} spire Spire object
 * @param {object} data  Member data from the spire api
 */
function Member(spire, data) {
  this.spire = spire;
  this.data = data;
  this.resourceName = 'member';
}

Member.prototype = new Resource();

module.exports = Member;

/**
 * Returns the member email.
 *
 * @returns {string} Member email
 */
Member.prototype.email = function () {
  return this.data.email;
};

/**
 * Returns the members profile.
 *
 * @returns {string} Member profile
 */
Member.prototype.profile = function () {
  return this.data.profile;
};