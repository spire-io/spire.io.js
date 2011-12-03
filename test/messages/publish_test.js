//     describe('publish', function(){
//       it('should exist', function(){
//         expect($.spire.messages.publish).toBeDefined();
//       });
//
//       it('should handle a callback', function(){
//         var channel = 'rowboat cop ' + (new Date().getTime())
//           , callback = sinon.spy()
//           , OGmessage = { channel: channel
//             , content: 'Abed was the meanest mean girl'
//             }
//         ;
//
//         $.spire.messages.publish(OGmessage, callback);
//
//         waitsFor(function(){ return callback.called; }, '', 10000);
//
//         runs(function(){
//           expect(callback).toHaveBeenCalled();
//
//           var err = callback.getCall(0).args[0]
//             , message = callback.getCall(0).args[1]
//           ;
//
//           expect(err).toBeFalsy();
//
//           expect(message).toBeDefined();
//           expect(message.content).toBe(OGmessage.content);
//         });
//       });
//
//       it('should not require a callback', function(){
//         var channel = 'rowboat cop ' + (new Date().getTime())
//           , message = { channel: channel
//             , content: 'Abed was the meanest mean girl'
//             }
//         ;
//
//         expect(function(){
//           $.spire.messages.publish(message);
//         }).not.toThrow();
//       });
//     }); // describe('subscribe', ...
//   }); // describe('messages', ...
