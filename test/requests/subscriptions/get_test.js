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
