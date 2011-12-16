describe('$.spire.requests.billing.get', function(){

  beforeEach(function(){
  });

  it('should exist', function(){
    expect($.spire.requests.billing.get).toBeDefined();
  });

  it('should get the billing options', function(){
    var callback = sinon.spy()
    ;

    $.spire.requests.description.get(function(err, desc){
      if (err) throw err;

      $.spire.requests.billing.get(callback);
    });

    waitsFor(function(){ return callback.called; }
    , 'waiting on the billing request'
    , 10000);

    runs(function(){
      var err = callback.getCall(0).args[0]
        , billing = callback.getCall(0).args[1]
      ;

      expect(err).toBeFalsy();
      expect(billing).toBeDefined();
      expect(billing).toBeAResourceObject();
      expect(billing.plans instanceof Array).toBe(true);

      $(billing.plans).each(function(i, plan){
        expect(plan.description).toBeDefined();
        expect(plan.id).toBeDefined();
        expect(plan.name).toBeDefined();
        expect(plan.price).toBeDefined();
        expect(plan.features).toBeDefined();
        expect(plan.features.queue).toBeDefined();
        expect(plan.features.queue.limit).toBeDefined();
        expect(plan.features.rps).toBeDefined();
      });
    });
  });

  describe('when there are errors', function(){
    var stub
      , account
    ;

    beforeEach(function(){
      helpers.account(function(err, session){
        if (err) throw err;
        else account = session.resources.account;

        $.spire.options.key = account.key;

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
      ;

      $.spire.requests.description.get(function(err, desc){
        if (err) throw err;

        $.spire.requests.billing.get(callback);
      });

      waitsFor(function(){ return callback.called; }
      , 'waiting for stuff'
      , 10000);


      runs(function(){
        var err = callback.getCall(0).args[0]
        ;

        expect(err).toBeTruthy();
      });
    });
  }); // describe('when there are errors', ...
});
