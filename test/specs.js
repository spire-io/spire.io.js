//     describe('accounts', function(){
//       it('$.spire.requests.accounts should exist', function(){
//         expect($.spire.requests.accounts).toBeDefined();
//       });
//
//       describe('create', function(){
//         it('$.spire.requests.accounts.create should exist', function(){
//           expect($.spire.requests.accounts.create).toBeDefined();
//         });
//
//         it('can get a success', function(){
//           var callback = sinon.spy()
//             , stamp = new(Date)().getTime()
//             , account = { email: 'random-' + stamp + '@email.com'
//               , password: 'totallysecure'
//               }
//           ;
//
//           $.spire.requests.description.get(function(){
//             $.spire.requests.accounts.create(account, callback);
//           });
//
//           waitsFor(function(){ return callback.called; }, '', 10000);
//
//           runs(function(){
//             expect(callback).toHaveBeenCalled();
//
//             var err = callback.getCall(0).args[0]
//               , session = callback.getCall(0).args[1]
//             ;
//
//             expect(err).toBeFalsy();
//
//             expect(session).toBeAResourceObject();
//             expect(session).toHaveACapability();
//
//             expect(session.resources).toBeDefined();
//
//             expect(session.resources.channels).toBeAResourceObject();
//             expect(session.resources.channels).toHaveACapability();
//
//             expect(session.resources.account).toBeAResourceObject();
//             expect(session.resources.account).toHaveACapability();
//
//             expect(session.resources.subscriptions).toBeAResourceObject();
//             expect(session.resources.subscriptions).toHaveACapability();
//           });
//         });
//       }); // describe('create', ...
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
//
//
//       describe('reset', function(){
//         it('$.spire.requests.accounts.reset should exist', function(){
//           expect($.spire.requests.accounts.reset).toBeDefined();
//         });
//
//         it('can get a success', function(){
//           var callback = sinon.spy()
//             , stamp = new(Date)().getTime()
//             , account = { email: 'random-' + stamp + '@email.com'
//               , password: 'totallysecure'
//               }
//             , key
//           ;
//
//           // create the account first
//           $.spire.requests.description.get(function(){
//             $.spire.requests.accounts.create(account, function(err, session){
//               var account = session.resources.account
//               ;
//
//               key = account.key;
//
//               account.email = 'different-' + stamp + '@test.com';
//               account.password = 'notsosecure';
//
//               $.spire.requests.accounts.reset(account, callback);
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
//             expect(account.key).not.toBe(key);
//           });
//         });
//       }); // describe('reset', ...
//
//     }); // describe('accounts', ...
//   });
// });
