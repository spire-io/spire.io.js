var Resource = require('./resource');

function Channel (spire, data) {
  this.spire = spire;
  this.data = data;
};

Resource.defineRequest(Channel.prototype, 'getByName', function (name) {
  var spire = this.spire;
  var channels = spire.session.resources.channels;
  return {
    method: 'get',
    url: channels.url,
    headers: {
      'Authorization': this.authorization(),
      'Accept': this.spire.mediaType('channels')
    },
    query: {
      name: name
    }
  };
});

Resource.defineRequest(Channel.prototype, 'publish', function (message) {
  var spire = this.spire;
  return {
    method: 'post',
    url: this.url,
    headers: {
      'Authorization': this.authorization(),
      'Accept': this.mediaType()
    },
    content: message,
  };
});

Channel.prototype.name = function () {
  return this.data.name;
};

Channel.prototype.getByName = function (name, cb) {
  var channel = this;
  this.request('getByName', name, function (err, data) {
    if (err) return cb(err);
    channel.data = data;
    cb(null, channel);
  });
};

Channel.prototype.publish = function (message, cb) {
  this.request('publish', { content: message }, cb);
};
