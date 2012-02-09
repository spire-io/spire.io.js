// # ResponseError
//
// ResponseError is a wrapper for request errors, this makes it easier to pass an
// error to the callbacks of the async functions that still retain their extra
// contextual information passed into the `arguments` of `requests`'s `error`
// handler
var ResponseError = function (response) {
  this.name = 'ResponseError';
  this.message = 'ResponseError';
  this.response = response;
  this.status = response.status;
};

ResponseError.prototype = new Error();

module.exports = ResponseError;
