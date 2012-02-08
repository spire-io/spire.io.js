// # spire.accounts
//
// Provides a high level interface for accounts. This is what the spire.io
// website uses for logging in, registration, and account updates.
var Accounts = function (spire) {
  this.spire = spire;
};

module.exports = Accounts;

// ## spire.accounts.create
//
// Wrapper for creating an account, makes a call for the API description
// then creates the account. It requires an account object (with at least an
// `email` and a `password`) and a `callback`. The `callback` will be called
// with the arguments: `error` and `session`. The `session` is a session
// resource.
//
//     var account = { email: 'jxson@jxson.cc'
//         , password: 'topsecret'
//         }
//     ;
//
//     spire.accounts.create(account, function(err, session){
//       // seriously, do something useful with this error...
//       if (err) throw err;
//
//       console.log(session);
//     });
//
Accounts.prototype.create = function(account, callback){
  var spire = this.spire;
  spire.requests.description.get(function(err, description){
    if (err) return callback(err);

    spire.requests.accounts.create(account, callback);
  });
};

// ## spire.accounts.update
//
// Wrapper for updating an account, it requires an authenticated `account`
// resource and a `callback`. The callback will be triggered with the
// arguments: an `error` object and an `account` resource object.
//
//     account.email = 'something-else@test.com';
//
//     spire.accounts.update(account, function(err, account){
//       if (err) throw err;
//
//       console.log(account);
//     });
//
Accounts.prototype.update = function(account, callback){
  var spire = this.spire;
  spire.requests.description.get(function(err, description){
    if (err) return callback(err);

    spire.requests.accounts.update(account, callback);
  });
};

// ## spire.accounts.authenticate
//
// Creates a session for a given account, expects an `account` object with
// `password` and `email` properties and a `callback`. The callback gets
// called with the arguments `error`, `session`
//
//
//     var account = { email: 'jxson@jxson.cc'
//         , password: 'totally-secure'
//         }
//     ;
//
//     spire.accounts.authenticate(account, function(err, session){
//       if (err) return callback(err);
//
//       console.log(session);
//     });
//
Accounts.prototype.authenticate = function(account, callback){
  var spire = this.spire;
  spire.requests.description.get(function(err, description){
    if (err) return callback(err);

    var options = { key: spire.options.key
        , email: account.email
        , password: account.password
        }
    ;

    spire.requests.sessions.create(options, callback);
  });
};

