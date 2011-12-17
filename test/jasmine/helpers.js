var helpers = {}
;

//`helpers.account(callback)` - async: makes an async call to the
// spire.io API to create a test account and triggers the `callback`, the
// `callback` will be triggered with two args `err`, and the authenticated
// `session` for the newly created account:
//
//     var account
//     ;
//
//     helpers.account(function(err, session){
//       if (err) throw err;
//       else account = session.resources.account;
//     });
//
// `helpers.account()` also wraps any work needed to handle async in the
// jasmine test suite so it can be used in a `beforeEach` call without the
// need to worry about async setup. Your `it` blocks will simply wait for the
// `helpers.account()` function to do it's work before running.
helpers.account = function(callback){
  var properties = { email: helpers.randomEmail()
      , password: 'super-secret'
      }
    , done
  ;

  waitsFor(function(){ return done; }
  , 'waiting for test account ' + properties.email
  , 10000);

  $.spire.accounts.create(properties, function(err, session){
    done = true;

    runs(function(){ callback(err, session); });
  });
};

// `helpers.channel(callback)` - async: wraps account and channel creation set
// up:
//     var channel
//     ;
//
//     helpers.channel(function(err, channel, session){
//       if (err) throw err;
//       else channel = channel;
//     });
//
// `helpers.channel()` also wraps any work needed to handle async in the
// jasmine test suite so it can be used in a `beforeEach` call without the
// need to worry about async setup. Your `it` blocks will simply wait for the
// `helpers.channel()` function to do it's work before running.
helpers.channel = function(callback){
  helpers.account(function(err, session){
    if (err) throw err;
    else $.spire.options.key = session.resources.account.key;

    var done
      , options = { session: session
        , name: helpers.randomChannelName()
        }
    ;

    waitsFor(function(){ return done; }
    , 'waiting for test channel creation'
    , 10000);

    $.spire.requests.channels.create(options, function(err, channel){
      done = true;

      runs(function(){ callback(err, channel, options.session); });
    });
  });
};

helpers.subscription = function(callback){
  helpers.channel(function(err, channel, session){
    var options = { channels: [ channel ]
        , events: [ 'messages' ]
        , session: session
        }
      , done
    ;

    waitsFor(function(){ return done; }
    , 'waiting for a test subscription creation'
    , 10000);

    $.spire
      .requests
      .subscriptions
      .create(options, function(err, subscription){
        done = true;

        runs(function(){ callback(err, subscription); });
      });
  })
};

//
// waitsFor(function(){ return callback.called; }
// , 'waiting for the subscription creation request'
// , 10000);
//
// runs(function(){

// `helpers.randomChannelName()`: creates a random string to use as a channel
// name.
helpers.randomChannelName = function(){
  return 'random channel ' + (new Date().getTime());
};

helpers.randomEmail = function(){
  return 'test-' + (new Date().getTime()) + '@spire.io';
};

beforeEach(function(){
  this.addMatchers({
    toBeAResourceObject: function(expected){
      var isDefined = !!this.actual
        , hasURL = !!this.actual.url && typeof this.actual.url === 'string'
      ;

      return isDefined && hasURL;
    },
    toIncludeASchemaFor: function(resource, version){
      var hasSchema = !!this.actual.schema
        , hasVersion = !!this.actual.schema[version]
        , hasResource = !!this.actual.schema[version][resource]
        , hasMediaType = !!this.actual
          .schema[version][resource]
          .mediaType
      ;

      return hasSchema && hasVersion && hasResource && hasMediaType;
    },
    toIncludeResource: function(resource){
      var hasResources = !!this.actual.resources
        , hasResource = !! this.actual.resources[resource]
        , resource = this.actual.resources[resource]
        , hasResourceURL
      ;
      if (resource){
        hasResourceURL = resource.url && typeof resource.url === 'string'
      } else {
        hasResourceURL = false;
      }

      return hasResources && hasResource && hasResourceURL;
    },
    toHaveACapability: function(){
      var capability = this.actual.capability;

      return !!capability && typeof capability === 'string'
    }
  });
});
