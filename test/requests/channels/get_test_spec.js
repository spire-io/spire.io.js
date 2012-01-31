describe('spire.requests.channels.get', function(){
  var session
    , channel
  ;

  beforeEach(function(){
    // log in and create a channel
    helpers.channel(function(err, ch, sess){
      if (err) throw err;
      channel = ch;
      session = sess;
    });
  });

  it('should exist', function(){
    expect(spire.requests.channels.get).toBeDefined();
  });

  it('should get the channel', function(){
    var callback = sinon.spy()
    ;

    spire.requests.channels.get(channel, callback);

    waitsFor(function(){ return callback.called; }
    , 'waiting on the channel creation request'
    , 10000);

    runs(function(){
      var err = callback.getCall(0).args[0]
        , channel = callback.getCall(0).args[1]
      ;

      expect(err).toBeFalsy();

      expect(channel).toBeAResourceObject();
      expect(channel).toHaveACapability();
      expect(channel.name).toBeDefined();
    });
  });
});
