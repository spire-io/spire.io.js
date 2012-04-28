# Synopsis

`spire.io.js` is a javascript library for the [spire.io API](http://www.spire.io/).
It can run inside the browser, or as NodeJS module.

## Usage
### Browser usage:
Add `spire.io.bundle.js` or `spire.io.bundle.min.js` to your script tags, and then

    var Spire = require('./spire.io.js');

### NodeJS usage:

    npm install spire.io.js
    var Spire = require('spire.io.js');

### Starting the Spire client

Create a new Spire instance:

    var spire = new Spire();

Register a new spire account:

    spire.register({
      email: 'you@email.com',
      password: your_password,
      password_confirmation: your_password_confirmation
    }, function (err, session) {
      if (!err) {
        // Your account has been registered, and you now have a spire session.  Start creating channels and subscripions.
      }
    });

Or start spire with an account secret:

    spire.start(your_account_secret, function (err, session) {
      if (!err) {
        // You now have a Spire session
      }
    });

Once Spire is started, you can start subscribing and publishing to channels.

### Subscribe to a Channel

Subscribe to a channel:

    spire.subcribe('channel name', function (messages) {
      for (var i = 0; i < messages.length; i++) {
        console.log("Received message: " + messages[i].content);
      }
    });

Subscribe to multiple channels:

    spire.subcribe(['channel one', 'channel two'], function (messages) {
      for (var i = 0; i < messages.length; i++) {
        console.log("Received message from channel " +
          messages[i].channel + ": " + messages[i].content);
      }
    });


### Publish to a Channel

Publish to a channel:

    // 'message' can be a string or any JSON-serilazable object.
    spire.publish('channel name', message, function (err) {
      if (!err) {
        console.log('Message sent!');
      }
    });

## Advanced Usage

The `subscribe` and `publish` methods wrap a lot of low-level functionality.
The Spire library provides access to many low-level methods to make more advanced applications possible.

Also be sure to checkout the [reference documentation](http://spire-io.github.com/spire.io.js).

### Channels

Create a channel:

    spire.channel('foo', function (err, channel) {
      if (!err) {
        // `channel` is the channel named "foo".
        var fooChannel = channel;
      }
    });


Publish to a channel:

    fooChannel.publish('Hello World!', function (err, message) {
      if (!err) {
        // Message was successfully published.
      }
    });

### Subscriptions

Create a subscription to a channel:

    fooChannel.subscription('mySubscription', function (err, subscription) {
      if (!err) {
        // `subscription` is the new subscription resource
        var mySubscription = subscription;
      }
    });

or equivalently:

    spire.subscription('mySubscripiton', 'foo', function (err, subscription) {
      if (!err) {
        // `subscription` is the new subscription resource
        var mySubscription = subscription;
      }
    });

### Listening on a subscription

Subscriptions have two events:
    * the `messages` event will fire with every batch of messages received, and
    * the `message` event will fire with every message individually.

Here are examples of both kinds of event listeners:

    mySubscription.addListener('message', function (message) {
      console.log('Message received: ' + message.content);
    });

    mySubscription.addListener('messages', function (messages) {
      console.log('Received ' + messages.length' + ' messages.');
    });

To start listening on a subscription, call:

    mySubscription.startListening();

To stop listening on a subscription, call:

    mySubscription.stopListening();



## Reference Documentation

For more docs, see our [reference documentation](http://spire-io.github.com/spire.io.js).

## Tests

The test suite can be run in NodeJS via:

    cake test:node

To run the test suite in the browser, you first need to start the test server with:

    cake test:server

then connect to the server's homepage.

If you don't know about cake and Cakefiles head on over to the CoffeeScript site (Don't worry this plugin isn't written in CoffeScript nor do you need it for anything other than running the development tasks)

## Bundle

So you made some changes and want to make a new browser bundle?

    cake bundle

Want to bundle *and* minify?

    cake bundle:min

# Contributing

Fork and send pull requests via github, also any [issues](https://github.com/spire-io/spire.io.js/issues) are always welcome

# License

Open Source Initiative OSI - The MIT License (MIT):Licensing

The MIT License (MIT)spec
Copyright (c) 2011, 2012 Border Stylo

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
