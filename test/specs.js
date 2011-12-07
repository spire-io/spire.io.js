//     describe('channels', function(){
//       it('$.spire.requests.channels should exist', function(){
//         expect($.spire.requests.channels).toBeDefined();
//       });
//
//       describe('create', function(){
//         it('$.spire.requests.channels should exist', function(){
//           expect($.spire.requests.channels.create).toBeDefined();
//         });
//
//         describe('without a session', function(){
//           it('can get a success ', function(){
//             var callback = sinon.spy()
//               , sessionOptions = { key: $.spire.options.key }
//               , channelOptions
//             ;
//
//             // needs a session first, using the cached one via $.spire.connect
//             $.spire.connect(function(session){
//               channelOptions = { session: session
//               , name: 'jquery.spire.js specs channel'
//               };
//
//               $.spire.requests.channels.create(channelOptions, callback);
//             });
//
//             waitsFor(function(){ return callback.called; }, '', 10000);
//
//             runs(function(){
//               expect(callback).toHaveBeenCalled();
//
//               var err = callback.getCall(0).args[0]
//                 , channel = callback.getCall(0).args[1]
//               ;
//
//               expect(err).toBeFalsy();
//
//               expect(channel).toBeAResourceObject();
//               expect(channel).toHaveACapability();
//               expect(channel.name).toBeDefined();
//             });
//           });
//         }); // describe('without a session', ...
//       }); // describe('create', ...
//     }); // describe('channels', ...
//
//     describe('subscriptions', function(){
//       it('$.spire.requests.subscriptions should exist', function(){
//         expect($.spire.requests.subscriptions).toBeDefined();
//       });
//
//       describe('create', function(){
//         it('$.spire.requests.subscriptions.create should exist', function(){
//           expect($.spire.requests.subscriptions.create).toBeDefined();
//         });
//
//         it('can get a success', function(){
//           var callback = sinon.spy();
//
//
//           $.spire.connect(function(session){
//             var options = { session: session
//             , name: 'jquery.spire.js specs channel'
//             };
//
//             $.spire.requests.channels.create(options, function(e, channel){
//               var options = { channels: [ channel ]
//                   , events: [ 'messages' ]
//                   , session: session
//                   }
//               ;
//
//              $.spire.requests.subscriptions.create(options, callback);
//             });
//           });
//
//           waitsFor(function(){ return callback.called; }, '', 10000);
//
//           runs(function(){
//             expect(callback).toHaveBeenCalled();
//
//             var err = callback.getCall(0).args[0]
//               , subscription = callback.getCall(0).args[1]
//             ;
//
//             expect(err).toBeFalsy();
//
//             expect(subscription).toBeAResourceObject();
//             expect(subscription).toHaveACapability();
//           });
//         });
//       }); // describe('create', ...
//
//       describe('get', function(){
//         it('spire.requests.subscriptions.get should exist', function(){
//           expect($.spire.requests.subscriptions.get).toBeDefined();
//         });
//
//         it('can get a success', function(){
//             callback = sinon.spy();
//
//             $.spire.connect(function(session){
//               var options = { session: session
//               , name: 'jquery.spire.js specs channel'
//               };
//
//               $.spire.requests.channels.create(options, function(e, channel){
//                 var options = { channels: [ channel ]
//                     , events: [ 'messages' ]
//                     , session: session
//                     }
//                 ;
//
//                $.spire.requests
//                 .subscriptions.create(options, function(err, subscription){
//                   var options = { subscription: subscription
//                       , timeout: 1 // I don't want to wait
//                       }
//                   ;
//
//                   $.spire.requests.subscriptions.get(options, callback);
//                });
//               });
//             });
//
//             waitsFor(function(){ return callback.called; }, '', 10000);
//
//             runs(function(){
//               expect(callback).toHaveBeenCalled();
//
//               var err = callback.getCall(0).args[0]
//                 , events = callback.getCall(0).args[1]
//               ;
//
//               expect(err).toBeFalsy();
//
//               expect(events).toBeDefined();
//               expect(events.messages).toBeDefined();
//               expect(events.messages instanceof Array).toBe(true);
//             });
//         });
//       }); // describe('get', ...
//     }); // describe('subscriptions', ...
//
//     describe('messages', function(){
//       it('spire.requests.messages should exist', function(){
//         expect($.spire.requests.messages).toBeDefined();
//       });
//
//       describe('create', function(){
//         it('spire.requests.messages.create should exist', function(){
//           expect($.spire.requests.messages.create).toBeDefined();
//         });
//
//         it('can get a success', function(){
//           var callback = sinon.spy()
//           ;
//
//           $.spire.connect(function(session){
//             var options = { session: session
//             , name: 'jquery.spire.js specs channel'
//             };
//
//             $.spire.requests.channels.create(options, function(err, channel){
//               var options = { channel: channel
//                   , content: { author: 'rowboat cop'
//                     , body: 'Call Me Murphy, I mean Abed.'
//                     }
//                   }
//               ;
//
//               $.spire.requests.messages.create(options, callback);
//             });
//           });
//
//           waitsFor(function(){ return callback.called; }, '', 10000);
//
//           runs(function(){
//             expect(callback).toHaveBeenCalled();
//
//             var err = callback.getCall(0).args[0]
//               , message = callback.getCall(0).args[1]
//             ;
//
//             expect(err).toBeFalsy();
//
//             expect(message).toBeDefined();
//             expect(message.content).toBeDefined();
//             expect(message.content.author).toBe('rowboat cop');
//             expect(message.content.body).toBe('Call Me Murphy, I mean Abed.');
//           });
//         });
//       }); // describe('create', ...
//     }); // describe('messages', ...
//
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
