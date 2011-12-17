describe('$.spire.requests.accounts.update', function(){
  var account
  ;

  beforeEach(function(){
    helpers.account(function(err, session){
      if (err) throw err;
      else account = session.resources.account;
    });
  });

  it('should exist', function(){
    expect($.spire.requests.accounts.update).toBeDefined();
  });

  it('should update an account', function(){
    var callback = sinon.spy()
      , email = helpers.randomEmail()
    ;

    account.email = email;
    account.password = 'blahblah';

    $.spire.requests.accounts.update(account, callback);

    waitsFor(function(){ return callback.called; }
    , 'waiting for account creation'
    , 10000);

    runs(function(){
      var err = callback.getCall(0).args[0]
        , account = callback.getCall(0).args[1]
      ;

      expect(err).toBeFalsy();

      expect(account).toBeAResourceObject();
      expect(account).toHaveACapability();
      expect(account.email).toBe(email);
    });
  });

  describe('when there are errors', function(){
    it('should pass errors to the callback', function(){
      this.fail('needs error handling tests and code');
    });
  }); // describe('when there are errors', ...
});
