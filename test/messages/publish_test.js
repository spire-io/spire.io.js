describe('$.spire.messages.publish(message, [callback])', function(){
  it('should exist', function(){
    expect($.spire.messages.publish).toBeDefined();
  });

  describe('with a callback', function(){
    var account
    ;

    beforeEach(function(){
      helpers.account(function(err, session){
        if (err) throw err;
        else account = session.resources.account;
      });
    });

    it('should handle a callback', function(){
      var callback = sinon.spy()
        , message = { channel: helpers.randomChannelName()
          , content: 'Godzilla attacks!'
          }
      ;

      $.spire.options.key = account.key;

      $.spire.messages.publish(message, callback);

      waitsFor(function(){ return callback.called; }
      , 'waiting for a message to be published'
      , 10000);

      runs(function(){
        expect(callback).toHaveBeenCalled();

        var err = callback.getCall(0).args[0]
          , messageResource = callback.getCall(0).args[1]
        ;

        expect(err).toBeFalsy();

        expect(message).toBeDefined();
        expect(message.content).toBe(messageResource.content);
      });
    });
    
    describe('when there are errors in sending the message', function(){
      it('should pass errors to the callback', function(){
        this.fail('needs error handling tests and code');
      });
    }); // describe('when there are errors in sending the message', ...    
  }); // describe('with a callback', ...

  describe('without a callback', function(){
    var account
    ;

    beforeEach(function(){
      helpers.account(function(err, session){
        if (err) throw err;
        else account = session.resources.account;
      });
    });

    it('should not throw', function(){
      var callback = sinon.spy()
        , message = { channel: helpers.randomChannelName()
          , content: 'Mothra attacks!'
          }
      ;

      $.spire.options.key = account.key;

      expect(function(){ $.spire.messages.publish(message); }).not.toThrow();
    });
    
    describe('when there are errors in sending the message', function(){
      it('it should throw', function(){
        this.fail('needs error handling tests and code');
      });
    }); // describe('when there are errors in sending the message', ...
  }); // describe('without a callback', ...
}); // describe('$.spire.messages.publish', ...
