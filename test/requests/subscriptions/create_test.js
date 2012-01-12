describe('spire.requests.subscriptions.create', function(){
  var channel
    , session
  ;

  beforeEach(function(){
    helpers.channel(function(err, c, s){
      if (err) throw err;

      channel = c;
      session = s;
    });
  });

  it('should exist', function(){
    expect(spire.requests.subscriptions.create).toBeDefined();
  });

  it('should create a subscription', function(){
    var callback = sinon.spy()
      , options = { channels: [ channel ]
        , events: [ 'messages' ]
        , session: session
        }
    ;

    spire.requests.subscriptions.create(options, callback);

    waitsFor(function(){ return callback.called; }
    , 'waiting for the subscription creation request'
    , 10000);

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

  describe('when there are errors', function(){
    var stub
      , channel
      , session
    ;

    beforeEach(function(){
      helpers.channel(function(err, c, s){
        if (err) throw err;

        channel = c;
        session = s;

        stub = sinon.stub(window, 'reqwest', function(options){
          return options.error();
        });
      });
    });

    afterEach(function(){
      window.reqwest.restore();
    });

    it('should pass errors to the callback', function(){
      var callback = sinon.spy()
        , options = { channels: [ channel ]
          , events: [ 'messages' ]
          , session: session
          }
      ;

      spire.requests.subscriptions.create(options, callback);

      waitsFor(function(){ return callback.called; }
      , 'waiting for the subscription creation request'
      , 10000);

      runs(function(){
        var err = callback.getCall(0).args[0]
        ;

        expect(err).toBeTruthy();
      });
    });
  }); // describe('when there are errors', ...
});
