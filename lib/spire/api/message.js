var defineRequest = require('./define_request');

var Messages = function (spire) {
  this.spire = spire;
};

module.exports = Messages;

defineRequest(Messages, 'get', function (channel, content) {
  var spire = this.spire;
  return {
    method: 'post',
    url: channel.url,
    headers: {
      'Content-Type': spire.headers.mediaType('message'),
      'Accept': spire.headers.mediaType('message'),
      'Authorization': spire.headers.authorization(channel)
    },
    content: { content: content },
  };
});
