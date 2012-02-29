describe('Subscriptions', function(){
  beforeEach(function(){
    var finished = false;
    runs(function(){
      this.spire = createSpire();

      if (this.secret) {
        this.spire.start(this.secret, function (err) {
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

  describe('Create a subscription using spire.subscriptionFromUrlAndCapabilities', function() {
    beforeEach(function () {
      var finished = false;
      runs(function(){
        var algernon = this;
        // Our friend Algernon here doesn't assert anything, I just wanted to
        // make sure this method didn't crash like it used to
        this.spire.subscription('constantinople', 'istanbul', function (err, subscription) {
          algernon.url = subscription.url();
          var creds = {
            url: subscription.url(),
            capabilities: subscription.data.capabilities
          };
          algernon.spire.subscriptionFromUrlAndCapabilities(creds, function(err, subscription){
            algernon.err = err;
            algernon.subscription = subscription;
            subscription.retrieveMessages({ timeout: 0 }, function (err, messages) {
              algernon.messagesErr = err;
              algernon.messages = messages;
              finished = true;
            });
          });
        });
      });

      waitsFor(function () {
        return finished;
      }, 'subscriptionFromUrlAndCapability and retreiveMessages', 10000);
    });

    it('should have a subscription', function () {
      expect(this.subscription).toBeTruthy();
      expect(this.err).toBeFalsy();
    });

    it('should have the correct url', function () {
      expect(this.subscription.url()).toBe(this.url);
    });

    it('should make a successfull request for messages', function () {
      expect(this.messagesErr).toBeFalsy();
      expect(this.messages).toEqual([]);
    });
  });
});
