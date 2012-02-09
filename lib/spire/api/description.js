var defineRequest = require('./define_request');

var Description = function (spire) {
  this.spire = spire;
};

defineRequest(Description, 'get', function () {
  return {
    method: 'get',
    url: spire.options.url,
    headers: {
      accept: "application/json"
    }
  };
});

module.exports = Description;
