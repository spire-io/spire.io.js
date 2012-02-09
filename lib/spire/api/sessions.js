var defineRequest = require('./define_request');

var Sessions = function (spire) {
  this.spire = spire;
};

module.exports = Sessions;

defineRequest(Sessions, 'get', function () {
  var spire = this.spire;
  return {
    method: 'get',
    url: spire.session.url,
    headers: {
      'Accept': spire.headers.mediaType('session'),
      'Authorization': spire.headers.authorization(session)
    }
  };
});

defineRequest(Sessions, 'create', function (key) {
  var spire = this.spire;
  return {
    method: 'post',
    url: spire.resources.sessions.url,
    headers: {
      'Content-Type': spire.headers.mediaType('account'),
      'Accept': spire.headers.mediaType('session')
    },
    content: {key: key}
  }
});

defineRequest(Sessions, 'login', function (email, password) {
  var spire = this.spire;
  return {
    method: 'post',
    url: spire.resources.sessions.url,
    headers: {
      'Content-Type': spire.headers.mediaType('account'),
      'Accept': spire.headers.mediaType('session')
    },
    content: {
      email: email,
      password: password
    }
  }
});
