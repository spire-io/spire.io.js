describe('$.spire.requests.subscriptions.get', function(){
  var subscription
  ;

  beforeEach(function(){
    helpers.subscription(function(err, sub){
      if (err) throw err;
      else subscription = sub;
    });
  });

  it('should exist', function(){
    expect($.spire.requests.subscriptions.get).toBeDefined();
  });

  it('should create a subscription', function(){
    var callback = sinon.spy()
      , options = { subscription: subscription
        , timeout: 1
        }
    ;

    $.spire.requests.subscriptions.get(options, callback);

    waitsFor(function(){ return callback.called; }
    , 'waiting to get a test subscription'
    , 10000);

    runs(function(){
      var err = callback.getCall(0).args[0]
        , events = callback.getCall(0).args[1]
      ;

      expect(err).toBeFalsy();

      expect(events).toBeDefined();
      expect(events.messages).toBeDefined();
      expect(events.messages instanceof Array).toBe(true);
    });
  });

  describe('when there are errors', function(){
    it('should pass errors to the callback', function(){
      this.fail('needs error handling tests and code');
    });
  }); // describe('when there are errors', ...
});
