
$.spire
  .options
  .key = 'c9KfjaIirRlg9YKpCck97Q-1321321628';

// $.spire
//   .options
//   .timeout = 0;

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

  xdescribe('$.spire', function(){
    it('should exist', function(){
      expect($.spire).toBeDefined();
    });

    it('should have the url option already set', function(){
      expect($.spire.options).toBeDefined();
      expect($.spire.options.url).toBe('http://api.spire.io');
    });
  });

  describe('messages', function(){
    xit('should exist', function(){
      expect($.spire.messages).toBeDefined();
    });

    describe('subscribe', function(){
      xit('should exist', function(){
        expect($.spire.messages.subscribe).toBeDefined();
      });

      xit('should hook the callback to fire on new message events', function(){
        var channel = 'cowboys and indians ' + (new Date().getTime());

        var callback = sinon.spy();

        $.spire.messages.subscribe(channel, callback);

        $.each(['tonto', 'injun joe', 'hiawatha'], function(i, indian){
          $.spire.messages.publish({ channel: channel
          , content: indian + ' says how'
          });
        });

        waitsFor(function(){ return callback.called; }, '', 10000);

        runs(function(){
          expect(callback).toHaveBeenCalled();

          var err = callback.getCall(0).args[0]
            , messages = callback.getCall(0).args[1]
          ;

          expect(err).toBeFalsy();

          expect(messages).toBeDefined();
          expect(messages.length).toBeDefined();

          $.each(messages, function(i, message){
            expect(message.content).toBeDefined();
            expect(message.content.match('says how')).toBeTruthy();
            expect(message.key).toBeDefined();
          });
        });
      });

      it('should handle long-polling', function(){
        var channel = 'cyborgs ' + (new Date().getTime())
          , callback = sinon.spy()
        ;

        $.spire.messages.publish({ channel: channel
        , content: 'robocop says "My name is Murphy."'
        }, function(err, msg){
          $.spire.messages.subscribe(channel, function(err, messages){
            if (err) throw err;

            console.log('messages', messages);
            callback();
          });
        });

        waitsFor(function(){ return callback.called; }, '', 10000);

        runs(function(){
          console.log('callback fired the first time');

          $.spire.messages.publish({ channel: channel
          , content: 'darthvader says "I am your father"'
          });
        });

        waitsFor(function(){ return callback.callCount > 2; }
        ,'long-polling to come back with the last message'
        , 10000);

        runs(function(){
          // ...
        });

        // runs(function(){
        //   expect(callback).toHaveBeenCalled();
        //
        //   var err = callback.getCall(0).args[0]
        //     // , messages = callback.getCall(0).args[1]
        //   ;
        //
        //   expect(err).toBeFalsy();
        //   //
        //   // expect(messages).toBeDefined();
        //   // expect(messages.length).toBeDefined();
        //   //
        //   // $.each(messages, function(i, message){
        //   //   expect(message.content).toBeDefined();
        //   //   expect(message.content.match('says how')).toBeTruthy();
        //   //   expect(message.key).toBeDefined();
        //   // });
        // });
      });
    }); // describe('subscribe', ...

    xdescribe('publish', function(){
      it('should exist', function(){
        expect($.spire.messages.publish).toBeDefined();
      });

      it('should handle a callback', function(){
        var channel = 'rowboat cop ' + (new Date().getTime())
          , callback = sinon.spy()
          , OGmessage = { channel: channel
            , content: 'Abed was the meanest mean girl'
            }
        ;

        $.spire.messages.publish(OGmessage, callback);

        waitsFor(function(){ return callback.called; }, '', 10000);

        runs(function(){
          expect(callback).toHaveBeenCalled();

          var err = callback.getCall(0).args[0]
            , message = callback.getCall(0).args[1]
          ;

          expect(err).toBeFalsy();

          expect(message).toBeDefined();
          expect(message.content).toBe(OGmessage.content);
        });
      });

      it('should not require a callback', function(){
        var channel = 'rowboat cop ' + (new Date().getTime())
          , message = { channel: channel
            , content: 'Abed was the meanest mean girl'
            }
        ;

        expect(function(){
          $.spire.messages.publish(message);
        }).not.toThrow();
      });
    }); // describe('subscribe', ...
  }); // describe('messages', ...

  xdescribe('requests', function(){
    it('$.spire.requests should exist', function(){
      expect($.spire.requests).toBeDefined();
    });

    describe('description.get', function(){
      it('$.spire.requests.description should exist', function(){
        expect($.spire.requests.description).toBeDefined();
        expect($.spire.requests.description.get).toBeDefined();
      });

      it('can get a success', function(){
        var callback = sinon.spy();

        $.spire.requests.description.get(callback);

        waitsFor(function(){ return callback.called; }, '', 10000);

        runs(function(){
          // Leave this, there was some weirdness with the way the callbacks
          // are triggered on the window. This makes sure we are getting the
          // callback before trying to extract it's args
          expect(callback).toHaveBeenCalled();

          var err = callback.getCall(0).args[0]
            , description = callback.getCall(0).args[1]
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
          var callback = sinon.spy()
            , options = { key: $.spire.options.key }
          ;

          $.spire.requests.sessions.create(options, callback);

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
            var callback = sinon.spy()
              , sessionOptions = { key: $.spire.options.key }
              , channelOptions
            ;

            // needs a session first, using the cached one via $.spire.connect
            $.spire.connect(function(session){
              channelOptions = { session: session
              , name: 'jquery.spire.js specs channel'
              };

              $.spire.requests.channels.create(channelOptions, callback);
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
        }); // describe('without a session', ...
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
          var callback = sinon.spy();


          $.spire.connect(function(session){
            var options = { session: session
            , name: 'jquery.spire.js specs channel'
            };

            $.spire.requests.channels.create(options, function(e, channel){
              var options = { channels: [ channel ]
                  , events: [ 'messages' ]
                  , session: session
                  }
              ;

             $.spire.requests.subscriptions.create(options, callback);
            });
          });

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

            $.spire.connect(function(session){
              var options = { session: session
              , name: 'jquery.spire.js specs channel'
              };

              $.spire.requests.channels.create(options, function(e, channel){
                var options = { channels: [ channel ]
                    , events: [ 'messages' ]
                    , session: session
                    }
                ;

               $.spire.requests
                .subscriptions.create(options, function(err, subscription){
                  var options = { subscription: subscription
                      , timeout: 1 // I don't want to wait
                      }
                  ;

                  $.spire.requests.subscriptions.get(options, callback);
               });
              });
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

    describe('messages', function(){
      it('spire.requests.messages should exist', function(){
        expect($.spire.requests.messages).toBeDefined();
      });

      describe('create', function(){
        it('spire.requests.messages.create should exist', function(){
          expect($.spire.requests.messages.create).toBeDefined();
        });

        it('can get a success', function(){
          var callback = sinon.spy()
          ;

          $.spire.connect(function(session){
            var options = { session: session
            , name: 'jquery.spire.js specs channel'
            };

            $.spire.requests.channels.create(options, function(err, channel){
              var options = { channel: channel
                  , content: { author: 'rowboat cop'
                    , body: 'Call Me Murphy, I mean Abed.'
                    }
                  }
              ;

              $.spire.requests.messages.create(options, callback);
            });
          });

          waitsFor(function(){ return callback.called; }, '', 10000);

          runs(function(){
            expect(callback).toHaveBeenCalled();

            var err = callback.getCall(0).args[0]
              , message = callback.getCall(0).args[1]
            ;

            expect(err).toBeFalsy();

            expect(message).toBeDefined();
            expect(message.content).toBeDefined();
            expect(message.content.author).toBe('rowboat cop');
            expect(message.content.body).toBe('Call Me Murphy, I mean Abed.');
          });
        });
      }); // describe('create', ...
    }); // describe('messages', ...

    describe('accounts', function(){
      it('$.spire.requests.accounts should exist', function(){
        expect($.spire.requests.accounts).toBeDefined();
      });

      describe('create', function(){
        it('$.spire.requests.accounts.create should exist', function(){
          expect($.spire.requests.accounts.create).toBeDefined();
        });

        it('can get a success', function(){
          var callback = sinon.spy()
            , stamp = new(Date)().getTime()
            , account = { email: 'random-' + stamp + '@email.com'
              , password: 'totallysecure'
              }
          ;

          $.spire.requests.description.get(function(){
            $.spire.requests.accounts.create(account, callback);
          });

          waitsFor(function(){ return callback.called; }, '', 10000);

          runs(function(){
            expect(callback).toHaveBeenCalled();

            var err = callback.getCall(0).args[0]
              , session = callback.getCall(0).args[1]
            ;

            expect(err).toBeFalsy();

            expect(session).toBeAResourceObject();
            expect(session).toHaveACapability();

            expect(session.resources).toBeDefined();

            expect(session.resources.channels).toBeAResourceObject();
            expect(session.resources.channels).toHaveACapability();

            expect(session.resources.account).toBeAResourceObject();
            expect(session.resources.account).toHaveACapability();

            expect(session.resources.subscriptions).toBeAResourceObject();
            expect(session.resources.subscriptions).toHaveACapability();
          });
        });
      }); // describe('create', ...
    }); // describe('accounts', ...
  });
});
