var defineRequest = require('./define_request');

var Subscriptions = function (spire) {
  this.spire = spire;
};

module.exports = Subscriptions;

defineRequest(Subscriptions, 'create', function (name, channels, events) {
  var spire = this.spire;
  var subscriptions = spire.session.resources.subscriptions;
  var data = {
    events: events,
    channels: [],
    name: name
  };

  // **!** The subscription create request wants an array of channel urls
  // not 'channel' resource objects.
  for (var i = 0; i < channels.length; i++) {
    data.channels.push(options.channels[i].url);
  }

  return {
    method: 'post',
    url: subscriptions.url,
    headers: {
      'Content-Type': spire.headers.mediaType('subscription'),
      'Accept': spire.headers.mediaType('subscription'),
      'Authorization': spire.headers.authorization(subscriptions)
    },
    content: data,
  };
});


defineRequest(Subscriptions, 'create', function (url, options) {
  var spire = this.spire;

  var data = {
    timeout: options.timeout || spire.options.timeout/1000,
    "order-by": options['order_by'] || options.order_by || 'desc',
    limit: options.limit || '10',
    delay: options.delay || 0,
  // TODO: Fix this
    //"last-message": subscription["last-message"] || options["last-message"] || options.last_message || 0
  };

  return {
    method: 'get',
    url: url,
    headers: {
      'Content-Type': spire.headers.mediaType('events'),
      'Accept': spire.headers.mediaType('events'), 
      'Authorization': spire.headers.authorization(subscription)
    },
    query: data
  };
});
