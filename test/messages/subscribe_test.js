describe('$.spire.messages.subscribe(channel, callback)', function(){
  var account
  ;

  beforeEach(function(){
    helpers.account(function(err, session){
      if (err) throw err;
      else account = session.resources.account;
    });
  });

  it('should trigger the callback when there are messages', function(){
    var callback = sinon.spy()
      , channel = helpers.randomChannelName()
    ;

    $.spire.options.key = account.key;

    $.spire.messages.subscribe(channel, callback);

    $.each(['tonto', 'injun joe', 'hiawatha'], function(i, indian){
      $.spire.messages.publish({ channel: channel
      , content: indian + ' says how'
      });
    });

    waitsFor(function(){ return callback.called; }
    , 'subscription to comeback with smoke signals...'
    , 10000);

    runs(function(){
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
    var callback = sinon.spy()
      , channel = helpers.randomChannelName()
    ;

    $.spire.options.key = account.key;

    $.spire.messages.publish({ channel: channel
    , content: 'robocop says "My name is Murphy."'
    }, function(err, msg){
      if (err) throw err;
      else $.spire.messages.subscribe(channel, callback);
    });

    waitsFor(function(){ return callback.called; }
    , 'The first subscription GET request to come back'
    , 10000);

    runs(function(){
      $.spire.messages.publish({ channel: channel
      , content: 'darthvader says "I am your father"'
      });
    });

    waitsFor(function(){ return callback.callCount >= 2; }
    ,'long-polling to come back with the last message'
    , 10000);

    runs(function(){
      var err = callback.getCall(1).args[0]
        , messages = callback.getCall(1).args[1]
        , message = messages[0]
      ;

      expect(err).toBeFalsy();

      expect(messages).toBeDefined();
      expect(messages.length).toBe(1);
      expect(message.content).toBe('darthvader says "I am your father"');
      expect(message.key).toBeDefined();
      expect(message.timestamp).toBeDefined();
    });
  });

  describe('when there are errors in the subscription', function(){
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
        , channel = helpers.randomChannelName()
      ;

      $.spire.options.key = account.key;

      $.spire.messages.subscribe(channel, callback);

      waitsFor(function(){ return callback.called; }
      , '$.spire.messages.subscribe'
      , 10000);


      runs(function(){
        var err = callback.getCall(0).args[0]
        ;

        expect(err).toBeTruthy();
      });
    });
  }); // describe('when there are errors in the subscription', ...
}); // describe('$.spire.messages.subscribe(channel, callback)', ...
