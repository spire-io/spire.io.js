describe('spire.requests.description.get', function(){
  it('should exist', function(){
    expect(spire.requests.description.get).toBeDefined();
  });

  it('should get the description successfully', function(){
    var callback = sinon.spy()
    ;

    spire.requests.description.get(callback);

    waitsFor(function(){ return callback.called; }
    , 'waiting on the description request'
    , 10000);

    runs(function(){
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

  describe('when there are errors', function(){
    var stub
    ;

    beforeEach(function(){
      spire.resources = null;

      stub = sinon.stub(window, 'reqwest', function(options){
        return options.error();
      });
    });

    afterEach(function(){
      window.reqwest.restore();
    });

    it('should pass errors to the callback', function(){
      var callback = sinon.spy()
      ;

      spire.requests.description.get(callback);

      waitsFor(function(){ return callback.called; }
      , 'waiting on the description request'
      , 10000);


      runs(function(){
        var err = callback.getCall(0).args[0]
        ;

        expect(err).toBeTruthy();
      });
    });
  }); // describe('when there are errors', ...
}); // describe('spire.requests.description.get', ...
