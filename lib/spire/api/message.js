/**
 * @fileOverview Message Resource class definition
 */
var Resource = require('./resource');

/**
 * Represents a message in the spire api.
 *
 * @class Message Resource
 *
 * @constructor
 * @extends Resource
 * @param {object} spire Spire object
 * @param {object} data Message data from the spire api
 */
function Message(spire, data) {
  this.spire = spire;
  this.data = data;
  this.content = data.content;
  this.type = data.type;
  this.timestamp = data.timestamp
  this.resourceName = 'message';
}

Message.prototype = new Resource();

module.exports = Message;
