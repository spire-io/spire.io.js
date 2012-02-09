var defineRequest = require('./define_request');

var Channels = function (spire) {
  this.spire = spire;
};

defineRequest(Channels, 'get', function (url) {
  var spire = this.spire;
  return {
    method: 'get',
    url: url,
    headers: {
      'Authorization': spire.headers.authorization(channel),
      'Accept': spire.headers.mediaType('channel')
    },
  }
});

defineRequest(Channels, 'getAll', function () {
  var spire = this.spire;
  var channels = spire.session.resources.channels;
  return {
    method: 'get',
    url: channels.url,
    headers: {
      'Authorization': spire.headers.authorization(channels),
      'Accept': spire.headers.mediaType('channels')
    }
  };
});

defineRequest(Channels, 'getByName', function (name) {
  var spire = this.spire;
  var channels = spire.session.resources.channels;
  return {
    method: 'get',
    url: channels.url,
    headers: {
      'Authorization': spire.headers.authorization(channels),
      'Accept': spire.headers.mediaType('channels')
    },
    query: {
      name: name
    }
  };
});

defineRequest(Channels, 'create', function (name) {
  var spire = this.spire;
  var channels = spire.session.resources.channels;

  return {
    method: 'post',
    url: channels.url,
    headers: {
      'Content-Type': spire.headers.mediaType('channel'),
      'Accept': spire.headers.mediaType('channel'),
      'Authorization': spire.headers.authorization(channels)
    },
    content: { name: name }
  }
});
