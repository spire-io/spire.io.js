var noop = function () {};

describe('Channels', function () {
  beforeEach(function () {
    var finished = false;

    runs(function () {
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

  describe('Create a channel', function () {
    beforeEach(function () {
      var finished = false;

      runs(function () {
        var that = this;
        this.spire.channel('foo', function (err, channel) {
          finished = true;
          that.channel = channel;
        });
      });

      waitsFor(function () {
        return finished;
      }, 'channel get or create', 10000);
    });

    it('should return a channel resource', function () {
      expect(this.channel).toBeTruthy();
      expect(this.channel).toBeAResourceObject();
    });

    describe('Creating a channel with the same name', function () {
      beforeEach(function () {
        var finished = false;

        runs(function () {
          var that = this;
          this.spire.channel('foo', function (err, channel) {
            finished = true;
            that.channel2 = channel;
          });
        });

        waitsFor(function () {
          return finished;
        }, 'channel get or create', 10000);
      });

      it('should be the same channel as before', function () {
        expect(this.channel2.key).toEqual(this.channel.key);
      });
    }); // Creating a channel with the same name

    describe('Publish to a channel', function () {
      beforeEach(function () {
        var finished = false;
        runs(function () {
          var that = this;
          this.messages = this.channel.publish('Hello world!', function (err, message) {
            that.message = message;
            finished = true;
          });
        });

        waitsFor(function () {
          return finished;
        }, 'publish to channel', 10000);
      });

      it('Returns the message we sent', function () {
        expect(this.message.content).toBe('Hello world!');
      });

      describe('Create a subscription to a channel', function () {
        beforeEach(function () {
          var finished = false;
          var that = this;
          this.spire.subscribe('sub_name', 'foo', function (err, sub) {
            that.sub = sub;
            finished = true;
          });

          waitsFor(function () {
            return finished;
          }, 'subscribing to a channel', 10000);
        });

        it('should return a subscription resource', function () {
          expect(this.sub).toBeAResourceObject();
        });

        describe('Creating subscription with the same name', function () {
          beforeEach(function () {
            var finished = false;
            var that = this;
            this.spire.subscribe('sub_name', 'foo', function (err, sub) {
              that.sub2 = sub;
              finished = true;
            });

            waitsFor(function () {
              return finished;
            }, 'subscribing to a channel', 10000);
          });

          it('should return the previously created subscription', function () {
            expect(this.sub2.url()).toBe(this.sub.url());
          });
        }); // Create a subscription with the same name

        describe('Listen for the message we sent', function () {
          beforeEach(function () {
            var finished = false;
            runs(function () {
              var that = this;
              this.sub.poll(function(err, messages) {
                finished = true;
                that.messages = messages;
              });
            });

            waitsFor(function () {
              return finished;
            }, 'Listening on a subscription', 10000);
          });

          it('should get an array of messages', function () {
            expect(this.messages instanceof Array).toBeTruthy();
          });

          it('should get back the message we sent', function () {
            expect(this.messages[0].content).toBe('Hello world!');
          });

          it('should not give us any other messages', function () {
            expect(this.messages.length).toBe(1);
          });

        }); // Listen for the message we sent
      }); // Create a subscription to a channel
    }); // Publish to a channel

    describe('Event listening on a channel', function () {
      beforeEach(function () {
        var finished = false;
        runs(function () {
          var that = this;
          this.spire.channel('event_channel', function (err, channel) {
            that.channel = channel;
            finished = true;
          });
        });

        waitsFor(function () {
          return finished;
        }, 'Creating event_channel', 10000);

        var finished2 = false;
        runs(function () {
          var that = this;
          this.spire.subscribe('new_sub', 'event_channel', function (err, sub) {
            that.sub = sub;
            finished2 = true;
          });
        });

        waitsFor(function () {
          return finished2;
        }, 'Creating new_sub on event_channel', 10000);

        runs(function () {
          var that = this;
          this.sub.addListener('message', function (m) {
            that.last_message = m;
          });
          this.sub.startListening({
            timeout: 5
          });
        });
      });

      describe('A listener is called each time a message is received', function () {
        beforeEach(function () {
          var finished = false;
          runs(function () {
            this.channel.publish('Message1', function (err, m) {
              finished = true;
            });
          });

          waitsFor(function () {
            return finished;
          }, 'Publishing "Message1"', 10000);
        });

        it('should have the last message', function () {
          expect(this.last_message.content).toBe('Message1');
          this.sub.stopListening();
        });


      }); // A listener is called each time a message is received

    }); // Event listening on a channel
  }); // Create a channel
}); // Channels


