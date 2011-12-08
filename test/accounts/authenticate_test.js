describe('$.spire.accounts.authenticate(account, callback)', function(){
  var account
  ;

  beforeEach(function(){
    helpers.account(function(err, session){
      if (err) throw err;
      else account = session.resources.account;
    });
  });


  xit('should exist', function(){
    expect($.spire.accounts.authenticate).toBeDefined();
  });

  xit('should authenticate an account', function(){
    var callback = sinon.spy()
      , properties = { email: account.email
        , password: 'super-secret'
        }
    ;

    $.spire.accounts.authenticate(properties, callback);

    waitsFor(function(){ return callback.called; }
    , 'account authentication for ' + account.email
    , 10000);

    runs(function(){
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

  describe('when there are errors', function(){
    var stub
      , account
    ;

    beforeEach(function(){
      helpers.account(function(err, session){
        if (err) throw err;
        else account = session.resources.account;

        stub = sinon.stub(jQuery, 'ajax', function(options){
          return options.error();
        });
      });
    });

    afterEach(function(){
      jQuery.ajax.restore();
    });

    it('should pass errors to the callback', function(){
      var callback = sinon.spy()
        , properties = { email: account.email
          , password: 'super-secret'
          }
      ;

      $.spire.accounts.authenticate(properties, callback);

      waitsFor(function(){ return callback.called; }
      , 'account authentication for ' + account.email
      , 10000);


      runs(function(){
        var err = callback.getCall(0).args[0]
        ;

        expect(err).toBeTruthy();
      });
    });
  }); // describe('when there are errors', ...
}); // describe('$spire.accounts.authenticate(account, [callback])', ...
