var _ = require('underscore')
  , API = require('./api')
  ;

var Billing = function (data) {
  _.extend(this, data);
};

Billing.prototype.update = function (info, cb) {
  API.billing.update(info, cb);
};

module.exports = {
  // ## getPlans
  // Gets a billing object than contains a list of all the plans available
  //
  // @param cb {function (err, billing) Callback
  getPlans: function (cb) {
    API.billing(cb);
  };
};
