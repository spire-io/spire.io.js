describe('spire.requests.channels.getByName', function(){
  var session
  ;

  beforeEach(function(){
    // log in and create a channel named "bar"
    helpers.channel("bar", function(err, ch, sess){
      if (err) throw err;
      session = sess;
    });
  });

  it('should exist', function(){
    expect(spire.requests.channels.getByName).toBeDefined();
  });

  it('should get the channel', function(){
    var callback = sinon.spy()
    ;

    var options = {
      session: session,
      name: 'bar'
    };

    spire.requests.channels.getByName(options, callback);

    waitsFor(function(){ return callback.called; }
    , 'waiting on the channel creation request'
    , 10000);

    runs(function(){
      var err = callback.getCall(0).args[0]
        , channels = callback.getCall(0).args[1]
      ;

      expect(err).toBeFalsy();

      expect(channels.bar).toBeDefined();
      expect(channels.bar).toBeAResourceObject();
      expect(channels.bar).toHaveACapability();
      expect(channels.bar.name).toEqual('bar');
    });
  });
});
