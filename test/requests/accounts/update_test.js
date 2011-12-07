//
//       describe('update', function(){
//         it('$.spire.requests.accounts.update should exist', function(){
//           expect($.spire.requests.accounts.update).toBeDefined();
//         });
//
//         it('can get a success', function(){
//           var callback = sinon.spy()
//             , sessionBack = sinon.spy()
//             , stamp = new(Date)().getTime()
//             , account = { email: 'random-' + stamp + '@email.com'
//               , password: 'totallysecure'
//               }
//             , email
//           ;
//
//           // create the account first
//           $.spire.requests.description.get(function(){
//             $.spire.requests.accounts.create(account, function(err, session){
//               var account = session.resources.account
//               ;
//
//               email = 'different-' + stamp + '@test.com';
//
//               account.email = email;
//               account.password = 'notsosecure';
//
//               $.spire.requests.accounts.update(account, callback);
//             });
//           });
//
//           waitsFor(function(){ return callback.called; }, '', 10000);
//
//           runs(function(){
//             expect(callback).toHaveBeenCalled();
//
//             var err = callback.getCall(0).args[0]
//               , account = callback.getCall(0).args[1]
//             ;
//
//             expect(err).toBeFalsy();
//
//             expect(account).toBeAResourceObject();
//             expect(account).toHaveACapability();
//             expect(account.email).toBe(email);
//
//             $.spire.accounts.authenticate({ email: account.email
//             , password: account.password
//             }, sessionBack);
//           });
//
//           waitsFor(function(){ return sessionBack.called; }, '', 10000);
//
//           runs(function(){
//             expect(sessionBack).toHaveBeenCalled();
//
//             var err = callback.getCall(0).args[0]
//               , account = callback.getCall(0).args[1]
//             ;
//
//             expect(err).toBeFalsy();
//
//             console.log('session after password change');
//           });
//         });
//       }); // describe('update', ...
