describe('Accounts and Session', function () {
  describe('Registration and Authentication', function () {
    describe('Registration with a valid email and password', function () {
      beforeEach(function () {
        this.spire = createSpire();
        var email = helpers.randomEmail();

        var finished = false;
        runs(function () {
          this.spire.register({
            email: email,
            password: 'foobarbaz'
          }, function (err) {
            finished = true;
          });
        });

        waitsFor(function () {
          return finished;
        }, 'spire.register', 5000);
      });

      it('should have a session', function () {
        expect(this.spire.session).toBeTruthy();
        expect(this.spire.session).toBeAResourceObject();
      });

    }); // Registration with valid email and password
  }); // Registration and authentication
}); // Accounts and sessions
