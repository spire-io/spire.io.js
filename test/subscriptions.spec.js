describe('Subscriptions', function(){
  beforeEach(function(){
    runs(function(){
      this.spire = createSpire();

      if (this.key) {
        this.spire.start(this.key, function (err) {
          finished = true;
        });
      } else {
        this.spire.register({
          email: helpers.randomEmail(),
          password: 'foobarbaz'
        }, function (err) {
          finished = true;
        });
      }
    });

    waitsFor(function () {
      return finished;
    }, 'Session registration or start', 10000);

  });

  describe('Create a subscription using spire.subscriptionFromUrlAndCapability', function() {
    runs(function(){
      var algernon = this;
      // Our friend Algernon here doesn't assert anything, I just wanted to
      // make sure this method didn't crash like it used to
      this.spire.channel('constantinople', function(err, channel){
        channel.subscription('istanbul', function(err, subscription){
          algernon.subscriptionData = subscription.data;
          algernon.spire.subscriptionFromUrlAndCapability(algernon.subscriptionData, function(err, subscription){
            algernon.subscriptionResource = subscription;
          });
        });
      });
    });
  });
});