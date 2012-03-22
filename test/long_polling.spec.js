describe('Long polling', function () {
  beforeEach(function () {
    var finished = false;
    runs(function () {
      this.spire = createSpire();

      var that = this;
      var createChannelAndSub = function () {
        that.spire.channel('chan', function (err, chan) {
          that.channel = chan;
          chan.subscription('new_sub1', function (err, sub) {
            that.sub1 = sub;
            finished = true;
          });
        });
      };

      if (this.secret) {
        this.spire.start(this.secret, createChannelAndSub);
      } else {
        this.spire.register({
          email: helpers.randomEmail(),
          password: 'foobarbaz'
        }, createChannelAndSub);
      }
    });

    waitsFor(function () {
      return finished;
    }, 'Channel and subscription creation', 10000);
  });

  describe('Will only return a single message once', function () {
    beforeEach(function () {
      var finished = false;
      runs(function () {
        var that = this;
        this.channel.publish('Message 1', function (err, mes) {
          that.channel.publish('Message 2', function (err, mes) {
            that.sub1.longPoll({ timeout: 5 }, function (err, events) {
              that.messages1 = events.messages;
              that.channel.publish('Message 3', function (err, mes) {
                that.sub1.longPoll({ timeout: 5 }, function (err, events) {
                  that.messages2 = events.messages;
                  finished = true;
                });
              });
            });
          });
        });
      });

      waitsFor(function () {
        return finished;
      }, 'Publishing and polling on a channel', 10000);
    });

    it('should return the correct batches of messages', function () {
      expect(this.messages1[0].content).toBe('Message 1');
      expect(this.messages1[1].content).toBe('Message 2');
      expect(this.messages2[0].content).toBe('Message 3');
    });
  }); // Will only return a single message once

  describe('Waits for the message we published', function () {
    beforeEach(function () {
      var finished = false;
      runs(function () {
        var that = this;
        this.sub1.addListener('messages', function (messages) {
          that.messages = messages;
        });
        this.sub1.startListening({
          timeout: 5
        });

        setTimeout(function () {
          that.channel.publish('Goodnight moon.', function (err, mes) {
            setTimeout(function () {
              finished = true;
              that.sub1.stopListening();
            }, 1000);
          });
        }, 1000);
      });

      waitsFor(function () {
        return finished;
      }, 'Publish to channel', 10000);
    });

    it('should get back an array with one message', function () {
      expect(this.messages.length).toBe(1);
    });

    it('should get back our message', function () {
      expect(this.messages[0].content).toBe('Goodnight moon.');
    });
  }); // Waits for the message we published
}); // Long polling

