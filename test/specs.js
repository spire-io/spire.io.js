
$.spire.options
  .key = 'lFIUcdH%2BH1N7AdiG2Lqh05wk%2Feybo1ACgTBvCrzA3q6ZtraW52MvuQ%3D%3D';

describe('jquery.spire.js', function(){
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

  describe('$.spire', function(){
    it('should exist', function(){
      expect($.spire).toBeDefined();
    });

    it('should have the url option already set', function(){
      expect($.spire.options).toBeDefined();
      expect($.spire.options.url).toBe('http://api.spire.io');
    });
  });

  describe('requests', function(){
    it('$.spire.requests should exist', function(){
      expect($.spire.requests).toBeDefined();
    });

    describe('description', function(){
      var callback;

      it('$.spire.requests.description should exist', function(){
        expect($.spire.requests.description).toBeDefined();
      });

      it('can get a success', function(){
        callback = sinon.spy();

        $.spire.requests.description(callback);

        waitsFor(function(){ return callback.called; }, '', 10000);

        runs(function(){
          // Leave this, there was some weirdness with the way the callbacks
          // are triggered on the window. This makes sure we are getting the
          // callback before trying to extract it's args
          expect(callback).toHaveBeenCalled();

          var err = callback.getCall(0).args[0]
            , description = callback.getCall(0).args[1]
            , resources
            , schema
          ;

          expect(err).toBeFalsy();
          expect(description).toBeDefined();

          // resources
          expect(description).toIncludeResource('accounts');
          expect(description).toIncludeResource('sessions');

          // schema
          expect(description).toIncludeASchemaFor('account', '1.0');
          expect(description).toIncludeASchemaFor('channel', '1.0');
          expect(description).toIncludeASchemaFor('events', '1.0');
          expect(description).toIncludeASchemaFor('message', '1.0');
          expect(description).toIncludeASchemaFor('session', '1.0');
          expect(description).toIncludeASchemaFor('subscription', '1.0');
        });
      });

      describe('err requests', function(){

      });
    }); // describe('description', ...

    describe('sessions', function(){
      it('$.spire.requests.sessions should exist', function(){
        expect($.spire.requests.sessions).toBeDefined();
      });

      describe('create', function(){
        it('$.spire.requests.sessions.create should exist', function(){
          expect($.spire.requests.sessions.create).toBeDefined();
        });

        it('can get a success', function(){
          callback = sinon.spy();

          $.spire.requests.sessions.create(callback);

          waitsFor(function(){ return callback.called; }, '', 10000);

          runs(function(){
            expect(callback).toHaveBeenCalled();

            var err = callback.getCall(0).args[0]
              , session = callback.getCall(0).args[1]
            ;

            expect(err).toBeFalsy();

            expect(session).toBeAResourceObject();
            expect(session).toHaveACapability();

            expect(session).toIncludeResource('channels');
            expect(session).toIncludeResource('subscriptions');
          });
        });
      }); // describe('create', ...
    }); // describe('sessions', ...

    describe('channels', function(){
      it('$.spire.requests.channels should exist', function(){
        expect($.spire.requests.channels).toBeDefined();
      });

      describe('create', function(){
        it('$.spire.requests.channels should exist', function(){
          expect($.spire.requests.channels.create).toBeDefined();
        });

        describe('without a session', function(){
          it('can get a success ', function(){
            callback = sinon.spy();

            $.spire
              .requests
              .channels
              .create('jquery.spire.js specs channel', callback);

            waitsFor(function(){ return callback.called; }, '', 10000);

            runs(function(){
              expect(callback).toHaveBeenCalled();

              var err = callback.getCall(0).args[0]
                , channel = callback.getCall(0).args[1]
              ;

              expect(err).toBeFalsy();

              expect(channel).toBeAResourceObject();
              expect(channel).toHaveACapability();
              expect(channel.name).toBeDefined();
            });
          });
        }); // describe('without a session', ...

        describe('with a session', function(){
          it('can get a success', function(){
            callback = sinon.spy();

            $.spire.requests.sessions.create(function(err, session){
              $.spire
                .requests
                .channels
                .create('jquery.spire.js specs channel', session, callback);
            });

            waitsFor(function(){ return callback.called; }, '', 10000);

            runs(function(){
              expect(callback).toHaveBeenCalled();

              var err = callback.getCall(0).args[0]
                , channel = callback.getCall(0).args[1]
              ;

              expect(err).toBeFalsy();

              expect(channel).toBeAResourceObject();
              expect(channel).toHaveACapability();
              expect(channel.name).toBeDefined();
            });
          });
        }); // describe('with a session', ...
      }); // describe('create', ...
    }); // describe('channels', ...

    describe('subscriptions', function(){
      it('$.spire.requests.subscriptions should exist', function(){
        expect($.spire.requests.subscriptions).toBeDefined();
      });

      describe('create', function(){
        it('$.spire.requests.subscriptions.create should exist', function(){
          expect($.spire.requests.subscriptions.create).toBeDefined();
        });

        it('can get a success', function(){
          callback = sinon.spy();

          $.spire.requests.subscriptions.create('random chanel', callback);

          waitsFor(function(){ return callback.called; }, '', 10000);

          runs(function(){
            expect(callback).toHaveBeenCalled();

            var err = callback.getCall(0).args[0]
              , subscription = callback.getCall(0).args[1]
            ;

            expect(err).toBeFalsy();

            expect(subscription).toBeAResourceObject();
            expect(subscription).toHaveACapability();
          });
        });
      }); // describe('create', ...

      describe('get', function(){
        it('spire.requests.subscriptions.get should exist', function(){
          expect($.spire.requests.subscriptions.get).toBeDefined();
        });

        it('can get a success', function(){
            callback = sinon.spy();

            $.spire
              .requests
              .subscriptions
              .create('random channel', function(err, subscription){
                $.spire
                  .requests
                  .subscriptions
                  .get(subscription, callback);
              });

            waitsFor(function(){ return callback.called; }, '', 10000);

            runs(function(){
              expect(callback).toHaveBeenCalled();

              var err = callback.getCall(0).args[0]
                , events = callback.getCall(0).args[1]
              ;

              expect(err).toBeFalsy();

              expect(events).toBeDefined();
              expect(events.messages).toBeDefined();
              expect(events.messages instanceof Array).toBe(true);
            });
        });
      }); // describe('get', ...
    }); // describe('subscriptions', ...
  });
/*****************************************************************************

* Messages
* subscriptions
* subscribe

*****************************************************************************/
});
