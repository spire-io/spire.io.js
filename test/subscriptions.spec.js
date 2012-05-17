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

  describe('Create a subscripiton with a expiration', function () {
    beforeEach(function () {
      var finished = false;
      runs(function () {
        var that = this;
        this.spire.session.createChannel('expiration channel', function (err, chan) {
          that.chan = chan;
          that.spire.session.createSubscription({
            name: 'expiration sub',
            channelNames: ['expiration channel'],
            expiration: 250
          }, function (err, sub) {
            that.sub = sub;
            finished = true;
          });
        });
      });

      waitsFor(function () {
        return finished;
      }, 'channel and subscription creation', 10000);
    });

    describe("After the timout wait", function () {
      beforeEach(function () {
        var finished = false;
        runs(function () {
          var that = this;
          setTimeout(function () {
            finished = true;
          }, 1000);
        });

        waitsFor(function () {
          return finished;
        }, 'expiration wait', 10000);
      });

      describe("getting all subscriptions", function () {
        beforeEach(function () {
          var finished = false;
          runs(function () {
            var that = this;
            this.spire.session.subscriptions$(function (err, subs) {
              that.subs = subs;
              finished = true;
            });
          });

          waitsFor(function () {
            return finished;
          }, 'getting subscripitons', 10000);
        });

        // FIXME: Uncomment once GC is running on build
        //it('should not include the expiration subscription', function () {
        //  expect(this.subs['expiration sub']).toBeFalsy();
        //});
      });
    });
  });

  describe('Create a subscription using spire.subscriptionFromUrlAndCapabilities', function() {
    beforeEach(function () {
      var finished = false;
      runs(function(){
        var algernon = this;
        // Our friend Algernon here doesn't assert anything, I just wanted to
        // make sure this method didn't crash like it used to
        this.spire.session.createSubscription({
          name: 'constantinople',
          channelNames: ['istanbul']
        }, function (err, subscription) {
          algernon.url = subscription.url();
          var creds = {
            url: subscription.url(),
            capabilities: subscription.data.capabilities
          };
          algernon.spire.api.subscriptionFromUrlAndCapabilities(creds, function(err, subscription){
            algernon.err = err;
            algernon.subscription = subscription;
            subscription.retrieveEvents({ timeout: 0 }, function (err, events) {
              algernon.eventsErr = err;
              algernon.events = events;
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

    it('should make a successfull request for events', function () {
      expect(this.eventsErr).toBeFalsy();
      expect(this.events.messages).toEqual([]);
    });
  });
});
