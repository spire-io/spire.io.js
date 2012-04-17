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
        this.spire.publish('a channel', 'my message', function (err, message) {
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
  });

  describe('A message returned from a subscription', function () {
    beforeEach(function () {
      var finished = false;

      runs(function () {
        var that = this;
        this.spire.publish('message channel', 'my message', function (err, message) {
          that.spire.subscribe('message channel', function (messages) {
            that.message = messages[0];
            finished = true;
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
  });
});

