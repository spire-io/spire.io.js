describe('$.spire.requests.sessions.create', function(){
  var account
  ;

  beforeEach(function(){
    helpers.account(function(err, session){
      if (err) throw err;
      else account = session.resources.account;
    });
  });

  it('should exist', function(){
    expect($.spire.requests.sessions.create).toBeDefined();
  });

  it('should create a session successfully', function(){
    var callback = sinon.spy()
      , options = { key: account.key }
    ;

    $.spire.requests.sessions.create(options, callback);

    waitsFor(function(){ return callback.called; }
    , 'waiting for session creation'
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
    it('should pass errors to the callback', function(){
      this.fail('needs error handling tests and code');
    });
  }); // describe('when there are errors', ...
});
