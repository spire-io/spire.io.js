describe('Messages', function(){
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

  describe('A message returned from a publish request', function () {
    beforeEach(function () {
      var finished = false;

      runs(function () {
        var that = this;
        this.spire.publish('a channel for messages', 'my message', function (err, message) {
          that.message = message;
          finished = true;
        });
      });

      waitsFor(function () {
        return finished;
      }, 10000, 'publish');
    });

    it('should have capabilities for get, update, and delete', function () {
      expect(this.message.capabilities().get).toBeTruthy();
      expect(this.message.capabilities().update).toBeTruthy();
      expect(this.message.capabilities()['delete']).toBeTruthy();
    });

    describe('getting the message', function () {
      beforeEach(function () {
        var finished = false;

        runs(function () {
          var that = this;
          this.message.get(function (err, newMessage) {
            that.newMessage = newMessage;
            finished = true;
          });
        });

        waitsFor(function () {
          return finished;
        }, 10000, 'get messages');
      });

      it('should have the same url', function () {
        expect(this.newMessage.url()).toBe(this.message.url());
      });

      it('should have the same content', function () {
        expect(this.newMessage.content).toBe('my message');
      });
    });

    describe('updating the message', function () {
      beforeEach(function () {
        var finished = false;

        runs(function () {
          var that = this;
          this.message.update({content: 'a new message'}, function (err) {
            finished = true;
          });
        });

        waitsFor(function () {
          return finished;
        }, 10000, 'get messages');
      });

      it('should have the new content', function () {
        expect(this.message.content).toBe('a new message');
      });
    });

    describe('deleting the message', function () {
      beforeEach(function () {
        var finished = false;

        runs(function () {
          var that = this;
          this.message['delete'](function (err) {
            that.err = err;
            finished = true;
          });
        });

        waitsFor(function () {
          return finished;
        }, 10000, 'get messages');
      });

      it('should not error', function () {
        expect(this.err).toBeFalsy();
      });
    });
  });

  describe('A message returned from a subscription', function () {
    beforeEach(function () {
      var finished = false;

      runs(function () {
        var that = this;
        this.spire.publish('a channel for more messages', 'my message', function (err, message) {
          that.spire.session.createSubscription({
            name: 'sub ' + Date.now(),
            channelNames: ['a channel for more messages']
          }, function (err, sub) {
            sub.retrieveEvents(function (err, events) {
              that.message = events.messages[0];
              finished = true;
            });
          });
        });
      });

      waitsFor(function () {
        return finished;
      }, 10000, 'get subscription');
    });

    it('should have capabilities for get, update, and delete', function () {
      expect(this.message.capabilities().get).toBeTruthy();
      expect(this.message.capabilities().update).toBeTruthy();
      expect(this.message.capabilities()['delete']).toBeTruthy();
    });

    describe('getting the message', function () {
      beforeEach(function () {
        var finished = false;

        runs(function () {
          var that = this;
          this.message.get(function (err, newMessage) {
            that.newMessage = newMessage;
            finished = true;
          });
        });

        waitsFor(function () {
          return finished;
        }, 10000, 'get messages');
      });

      it('should have the same url', function () {
        expect(this.newMessage.url()).toBe(this.message.url());
      });

      it('should have the same content', function () {
        expect(this.newMessage.content).toBe('my message');
      });
    });
//
//    describe('updating the message', function () {
//      beforeEach(function () {
//        var finished = false;
//
//        runs(function () {
//          var that = this;
//          this.message.update({content: 'a new message'}, function (err, newMessage) {
//            that.updatedMessage = newMessage;
//            finished = true;
//          });
//        });
//
//        waitsFor(function () {
//          return finished;
//        }, 10000, 'update message');
//      });
//
//      it('should have the new content', function () {
//        expect(this.updatedMessage.content).toBe('a new message');
//      });
//    });
//
    describe('deleting the message', function () {
      beforeEach(function () {
        var finished = false;

        runs(function () {
          var that = this;
          this.message['delete'](function (err) {
            that.err = err;
            finished = true;
          });
        });

        waitsFor(function () {
          return finished;
        }, 10000, 'get messages');
      });

      it('should not error', function () {
        expect(this.err).toBeFalsy();
      });
    });
  });
});

