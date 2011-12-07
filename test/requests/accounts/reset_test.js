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
