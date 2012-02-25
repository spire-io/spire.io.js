/**
 * @fileOverview ResponseError class definition
 */

/**
 * ResponseError is a wrapper for request errors, this makes it easier to pass
 * an error to the callbacks of the async functions that still retain their
 * extra contextual information passed into the arguments of requests's error
 * handler
 *
 * @class HTTP Response Error
 * @constructor
 * @param {object} response Response HTTP client
 * @param {object} request Request description
 */
var ResponseError = function (response, request) {
  this.message = 'ResponseError: ' + response.status;
  this.response = response;
  this.status = response.status;
  this.request = request;
};

ResponseError.prototype = new Error();

module.exports = ResponseError;
