// # spire.headers
//
// Helpers for generating header values for the http requests to the
// spire.io API.
var Headers = function (spire) {
  this.spire = spire;
};

module.exports = Headers;

// ## spire.headers.authorization
//
// Generate the authorization header for a resource with a capability.
// Requires a resource object with a `capability` key.
//
//     authorization = spire.headers.authorization(subscription);
//     //=> 'Capability 5iyTrZrcGw/X4LxhXJRIEn4HwFKSFB+iulVKkUjqxFq30cFBqEm'
//
Headers.prototype.authorization = function(resource){
  return ['Capability', resource.capability].join(' ');
};

// ## spire.headers.mediaType
//
// Generate either a 'content-type' or 'authorization' header, requires a
// string with the name of the resource so it can extract the media type
// from the API's schema.
//
//     spire.headers.mediaType('channel');
//     //=> 'application/vnd.spire-io.channel+json;version=1.0'
Headers.prototype.mediaType = function(resourceName){
  var spire = this.spire;
  return spire.schema[spire.options.version][resourceName].mediaType
};

