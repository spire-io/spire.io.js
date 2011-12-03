//   describe('messages', function(){
//     it('should exist', function(){
//       expect($.spire.messages).toBeDefined();
//     });
//
//     describe('subscribe', function(){
//       it('should exist', function(){
//         expect($.spire.messages.subscribe).toBeDefined();
//       });
//
//       it('should hook the callback to fire on new message events', function(){
//         var channel = 'cowboys and indians ' + (new Date().getTime())
//           , callback = sinon.spy()
//         ;
//
//         $.spire.messages.subscribe(channel, callback);
//
//         $.each(['tonto', 'injun joe', 'hiawatha'], function(i, indian){
//           $.spire.messages.publish({ channel: channel
//           , content: indian + ' says how'
//           });
//         });
//
//         waitsFor(function(){ return callback.called; }, '', 10000);
//
//         runs(function(){
//           expect(callback).toHaveBeenCalled();
//
//           var err = callback.getCall(0).args[0]
//             , messages = callback.getCall(0).args[1]
//           ;
//
//           expect(err).toBeFalsy();
//
//           expect(messages).toBeDefined();
//           expect(messages.length).toBeDefined();
//
//           $.each(messages, function(i, message){
//             expect(message.content).toBeDefined();
//             expect(message.content.match('says how')).toBeTruthy();
//             expect(message.key).toBeDefined();
//           });
//         });
//       });
//
//       it('should handle long-polling', function(){
//         var channel = 'cyborgs ' + (new Date().getTime())
//           , callback = sinon.spy()
//         ;
//
//         $.spire.messages.publish({ channel: channel
//         , content: 'robocop says "My name is Murphy."'
//         }, function(err, msg){
//           if (err) throw err;
//
//           $.spire.messages.subscribe(channel, callback);
//         });
//
//         waitsFor(function(){ return callback.called; }
//         , 'The first subscription GET request to come back'
//         , 10000);
//
//         runs(function(){
//           $.spire.messages.publish({ channel: channel
//           , content: 'darthvader says "I am your father"'
//           });
//         });
//
//         waitsFor(function(){ return callback.callCount >= 2; }
//         ,'long-polling to come back with the last message'
//         , 10000);
//
//         runs(function(){
//           expect(callback).toHaveBeenCalled();
//
//           var err = callback.getCall(1).args[0]
//             , messages = callback.getCall(1).args[1]
//             , message = messages[0]
//           ;
//
//           expect(err).toBeFalsy();
//
//           expect(messages).toBeDefined();
//           expect(messages.length).toBe(1);
//           expect(message.content).toBe('darthvader says "I am your father"');
//           expect(message.key).toBeDefined();
//           expect(message.timestamp).toBeDefined();
//         });
//       });
//     }); // describe('subscribe', ...
