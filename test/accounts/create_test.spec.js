describe('spire.accounts.create(account, [callback])', function(){
  it('should exist', function(){
    expect(spire.accounts.create).toBeDefined();
  });

  it('should create an account', function(){
    var callback = sinon.spy()
      , properties = { email: helpers.randomEmail()
        , password: 'totally-secure'
        }
    ;

    spire.accounts.create(properties, callback);

    waitsFor(function(){ return callback.called; }
    ,'account creation'
    , 10000);

    runs(function(){
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

  describe('when there are errors', function(){
    var stub
      , account
    ;

    beforeEach(function(){
      helpers.account(function(err, session){
        if (err) throw err;
        else account = session.resources.account;

        stub = sinon.stub(spire, 'shred', function(options){
          return options.error();
        });
      });
    });

    afterEach(function(){
      spire.shred.restore();
    });

    it('should pass errors to the callback', function(){
      var callback = sinon.spy()
        , properties = { email: helpers.randomEmail()
          , password: 'totally-secure'
          }
      ;

      spire.accounts.create(properties, callback);

      waitsFor(function(){ return callback.called; }
      , 'account creation'
      , 10000);

      runs(function(){
        var err = callback.getCall(0).args[0]
        ;

        expect(err).toBeTruthy();
      });
    });
  }); // describe('when there are errors', ...
});
