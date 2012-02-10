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
        console.log(this.channel);
        console.log(this.channel2);
        expect(this.channel2.key).toEqual(this.channel.key);
      });
    }); // Creating a channel with the same name
  }); // Create a channel

}); // Channels
