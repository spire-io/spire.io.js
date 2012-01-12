describe('spire.requests.messages.create', function(){
  var channel
  ;

  beforeEach(function(){
    helpers.channel(function(err, chan){
      if (err) throw err;
      else channel = chan;
    });
  });

  it('should exist', function(){
    expect(spire.requests.messages.create).toBeDefined();
  });

  it('should create a message', function(){
    var callback = sinon.spy()
      , options = { channel: channel
        , content: { author: 'rowboat cop'
          , body: 'Call Me Murphy, I mean Abed.'
          }
        }
    ;

    spire.requests.messages.create(options, callback);

    waitsFor(function(){ return callback.called; }
    , 'waiting for a message to be created'
    , 10000);

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

  describe('when there are errors', function(){
    var stub
      , channel
    ;

    beforeEach(function(){
      helpers.channel(function(err, chan){
        if (err) throw err;
        else channel = chan;

        stub = sinon.stub(spire, 'ajax', function(options){
          return options.error();
        });
      });
    });

    afterEach(function(){
      spire.ajax.restore();
    });

    it('should pass errors to the callback', function(){
      var callback = sinon.spy()
        , options = { channel: channel
          , content: { author: 'rowboat cop'
            , body: 'Call Me Murphy, I mean Abed.'
            }
          }
      ;

      spire.requests.messages.create(options, callback);

      waitsFor(function(){ return callback.called; }
      , 'waiting for a message to be created'
      , 10000);


      runs(function(){
        var err = callback.getCall(0).args[0]
        ;

        expect(err).toBeTruthy();
      });
    });
  }); // describe('when there are errors', ...
});
