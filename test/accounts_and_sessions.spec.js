var noop = function () {};

describe('Accounts and Session', function () {
  describe('Registration and Authentication', function () {
    describe('With no authentication', function () {
      beforeEach(function () {
        this.spire = new Spire();
      });

      describe('Calling session-dependant sync functions', function () {
        it('should throw NoSessionErrors', function () {
          expect(function () {
            return this.spire.key();
          }).toThrow();

          expect(function () {
            return this.spire.subscribe('chan');
          }).toThrow();
        });
      });

      describe('Calling session-dependant async functions', function () {
        it('should pass NoSessionErrors to callbacks', function () {
          this.spire.channel('blah', function (err) {
            expect(err).toBeTruthy;
          });

          this.spire.channels$(function (err) {
            expect(err).toBeTruthy;
          });

          this.spire.subscribe('chan', {}, function () {}, function (err) {
            expect(err).toBeTruthy;
          });

          this.spire.subscriptions$(function (err) {
            expect(err).toBeTruthy;
          });
        });
      });
    });

    describe('With key passed to Spire constructor', function () {
      beforeEach(function () {
        var that = this;
        var finished = false;
        runs(function () {
          helpers.getApiKey(function (err, key) {
            if (err) throw err;
            that.spire = new Spire({ key: key });
            finished = true;
          });
        });

        waitsFor(function () {
          return finished;
        }, 'Registration', 10000);
      });

      describe('Subscribing', function () {
        it('should not throw error', function () {
          //this.spire.subscribe('chan');
        });
      });

      describe('Getting channels', function () {
        beforeEach(function () {
          var finished = false;
          var that = this;
          runs(function () {
            this.spire.channels(function(err, channels) {
              that.err = err
              that.channels = channels;
              finished = true;
            });
          });

          waitsFor(function () {
            return finished;
          }, 'Getting channels', 10000);
        });

        it('Should not err', function () {
          expect(this.err).toBeFalsy();
        });

        it('Should return channels', function () {
          expect(this.channels).toBeDefined()
        });
      });
    });

    describe('Registration with a valid email and password', function () {
      beforeEach(function () {
        this.email = helpers.randomEmail();
        this.spire = createSpire();
        this.key = null;
        var finished = false;
        runs(function () {
          this.spire.register({
            email: this.email,
            password: 'foobarbaz'
          }, function (err) {
            finished = true;
          });
        });

        waitsFor(function () {
          return finished;
        }, 'spire.register', 10000);

        // Save the key for later
        runs(function () {
          this.key = this.spire.key();
        });
      });

      it('should have a session', function () {
        expect(this.spire.session).toBeTruthy();
        expect(this.spire.session).toBeAResourceObject();
      });

      it('should have a session with account resource', function () {
        expect(this.spire.session.resources.account).toBeTruthy();
        expect(this.spire.session.resources.account).toBeAResourceObject();
      });

      describe('Registration with the same email', function () {
        it('should throw an error', function () {
          var finished = false;
          var err = null;
          runs(function () {
            this.spire.register({
              email: this.email,
              password: 'bazbarfoo'
            }, function (e) {
              finished = true;
              err = e;
            });
          });

          waitsFor(function () {
            return finished;
          }, 'spire.register', 10000);

          runs(function () {
            expect(err).toBeTruthy();
          });
        });
      }); // Registration with the same email

      describe('Log in with the given email and password', function () {
        beforeEach(function () {
          this.spire = createSpire();

          var finished = false;
          runs(function () {
            this.spire.login(this.email, 'foobarbaz', function (err) {
              finished = true;
            });
          });

          waitsFor(function () {
            return finished;
          }, 'spire.register', 10000);
        });

        it('should have a session', function () {
          expect(this.spire.session).toBeTruthy();
          expect(this.spire.session).toBeAResourceObject();
        });

        it('should have a session with account resource', function () {
          expect(this.spire.session.resources.account).toBeTruthy();
          expect(this.spire.session.resources.account).toBeAResourceObject();
        });

        describe('Change your password', function () {
          var err;
          beforeEach(function () {
            var finished = false;
            runs(function () {
              this.spire.update({
                email: this.email,
                password: 'a new password'
              }, function (e) {
                err = e;
                finished = true;
              });
            });

            waitsFor(function () {
              return finished;
            }, 'spire.register', 10000);
          });

          it('should not throw an error', function () {
            expect(err).toBeFalsy();
          });

          describe('Log in with the new password', function () {
            beforeEach(function () {
              this.spire = createSpire();

              var finished = false;
              runs(function () {
                this.spire.login(this.email, 'a new password', function (err) {
                  finished = true;
                });
              });

              waitsFor(function () {
                return finished;
              }, 'spire.register', 10000);
            });

            it('should have a session', function () {
              expect(this.spire.session).toBeTruthy();
              expect(this.spire.session).toBeAResourceObject();
            });

            it('should have a session with account resource', function () {
              expect(this.spire.session.resources.account).toBeTruthy();
              expect(this.spire.session.resources.account).toBeAResourceObject();
            });

          }); // Log in with the new password
        }); // Change your password
      }); // Log in the with given email and password

      describe('Log in using the account key', function () {
        beforeEach(function () {
          var key = this.key;
          this.spire = createSpire();
          finished = false;

          runs(function () {
            this.spire.start(key, function (e) {
              finished = true;
            });
          });

          waitsFor(function () {
            return finished;
          }, 'log in using account key', 10000);
        });

        it('should have a session', function () {
          expect(this.spire.session).toBeTruthy();
          expect(this.spire.session).toBeAResourceObject();
        });

        it('should have a session without an account resource', function () {
          expect(this.spire.session.resources.account).toBeFalsy();
        });
      }); // Log in using the account key

      describe('Reset your account key', function () {
        it('should invalidate existing sessions', noop);
        it('should invalidate the original account key', noop);
        it('should allow you to log in with the new account key', noop);
      }); // Reset your account key

      describe('Close a session', function () {
        it('should invalidate the session tht was closed', noop);
      }); // Close a session

      describe('Delete your account', function () {
        it('should invalidate existing sessions', noop);
        it('should invalidate the original account key', noop);
        it('should invalidate email and password', noop);
      }); // Delete your account
    }); // Registration with valid email and password
  }); // Registration and authentication

  describe('Account GET then PUT Capability test', function () {
    beforeEach(function () {
      this.email1 = helpers.randomEmail();
      this.email2 = helpers.randomEmail();
      this.spire = createSpire();
      this.key = null;
      var finished = false;

      var that = this;

      var register = function (cb) {
        that.spire.register({
          email: that.email1,
          password: 'foobarbaz'
        }, cb);
      };

      runs(function () {
        register(function (err) {
          that.spire.session.account(function (err, account) {
            account.get(function (err, account) {
              account.update({
                email: that.email2
              }, function (err, account) {
                that.account = account;
                finished = true
              });
            });
          });
        });
      });

      waitsFor(function () {
        return finished;
      }, 'get and put to account', 10000);
    });

    it('should be an account', function () {
      expect(this.account.data.email).toBe(this.email2);
    });
  }); // Account GET then PUT capability test
}); // Accounts and sessions
