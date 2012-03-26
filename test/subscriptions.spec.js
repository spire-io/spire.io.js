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

  describe('Create a subscripiton with a timeout', function () {
    beforeEach(function () {
      var finished = false;
      runs(function () {
        var that = this;
        this.spire.session.createChannel('timeout channel', function (err, chan) {
          that.chan = chan;
          that.spire.session.createSubscription({
            name: 'timeout sub',
            channelNames: ['timeout channel'],
            timeout: 250
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
            // HACK TO TRIGGER SHARK GC
            that.chan.publish('blah', function () {
              setTimeout(function () {
                finished = true;
              }, 500);
            });
          }, 500);
        });

        waitsFor(function () {
          return finished;
        }, 'timeout wait', 10000);
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

        it('should not include the timeout subscription', function () {
          expect(this.subs['timeout sub']).toBeFalsy();
        });
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
        this.spire.subscription('constantinople', 'istanbul', function (err, subscription) {
          algernon.url = subscription.url();
          var creds = {
            url: subscription.url(),
            capabilities: subscription.data.capabilities
          };
          algernon.spire.subscriptionFromUrlAndCapabilities(creds, function(err, subscription){
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
