describe('spire.requests.channels.getAll', function(){
  var session
  ;

  beforeEach(function(){
    // log in and create a channel named "foo"
    helpers.channel("foo", function(err, ch, sess){
      if (err) throw err;
      session = sess;
    });
  });

  it('should exist', function(){
    expect(spire.requests.channels.getAll).toBeDefined();
  });

  it('should get all the channels', function(){
    var callback = sinon.spy()
    ;

    var options = { session: session };
    spire.requests.channels.getAll(options, callback);

    waitsFor(function(){ return callback.called; }
    , 'waiting on the channel creation request'
    , 10000);

    runs(function(){
      var err = callback.getCall(0).args[0]
        , channels = callback.getCall(0).args[1]
      ;

      expect(err).toBeFalsy();

      expect(channels.foo).toBeDefined();
      expect(channels.foo).toBeAResourceObject();
      expect(channels.foo).toHaveACapability();
      expect(channels.foo.name).toEqual('foo');
    });
  });
});
