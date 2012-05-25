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
  /**
   * The error message.
   */
  this.message = 'ResponseError: ' + response.status;

  /**
   * Actual response from the server.
   */
  this.response = response;

  /**
   * Status of the response.
   */
  this.status = response.status;

  /**
   * The request.
   */
  this.request = request;
};

ResponseError.prototype = new Error();

module.exports = ResponseError;
