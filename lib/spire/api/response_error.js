// # ResponseError
//
// ResponseError is a wrapper for request errors, this makes it easier to pass an
// error to the callbacks of the async functions that still retain their extra
// contextual information passed into the `arguments` of `requests`'s `error`
// handler
//
//     @constructor
//     @param {object} response Response HTTP client
var ResponseError = function (response) {
  this.message = 'ResponseError: ' + response.status;
  this.response = response;
  this.status = response.status;
};

ResponseError.prototype = new Error();

module.exports = ResponseError;
