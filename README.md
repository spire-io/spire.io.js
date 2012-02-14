# Synopsis

`spire.io.js` is a javascript library for the [spire.io API](http://www.spire.io/).

For more docs, see our [inline documentation](http://spire-io.github.com/spire.io.js).

## Usage

This library can be used inside the browser, or as a NodeJS module.

### Browser usage:
Add `spire.io.bundle.js` or `spire.io.bundle.min.js` to your script tags, and then

    var Spire = require('./spire.io.js');

### NodeJS usage:

    npm install spire.io.js
    var Spire = require('spire.io.js');


## Starting the Spire client

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

Or start spire with an account key:

    spire.start(your_account, function (err, session) {
      spire.channel('foo', function (err, channel) {
        if (!err) {
          // `channel` is the channel named "foo".
        }
      });
    });

## Creating a channel

To create a channel:

    spire.channel('foo', function (err, channel) {
      if (!err) {
        // `channel` is the channel named "foo".
        var fooChannel = channel;
      }
    });

## Publish to a channel

Then publish to the channel with:

    fooChannel.publish('Hello World!', function (err, message) {
      if (!err) {
        // Message was successfully published.
      }
    });

## Listen to a channel

To listen to a channel, first create a subscription:

    fooChannel.subscribe('mySubscription', function (err, subscription) {
      if (!err) {
        // `subscription` is the new subscription resource
        var mySubscription = subscription;
      }
    });

or equivalently:

    spire.subscribe('mySubscripiton', 'foo', function (err, subscription) {
      if (!err) {
        // `subscription` is the new subscription resource
        var mySubscription = subscription;
      }
    });

Then add listeners to the subscription and start listening!

    mySubscription.addListener('message', function (message) {
      console.log('Message received: ' + message.content);
    });

Call `mySubscription.stopListening()` when you want to stop listening.

## More Info

For more docs, see our [inline documentation](http://spire-io.github.com/spire.io.js).

## Working with this library

* [source code](https://github.com/spire-io/spire.io.js)
* [inline documentation](http://spire-io.github.com/spire.io.js/)
* [issues](https://github.com/spire-io/spire.io.js/issues)
* [contact spire.io](http://spire.io/contact.html)

# Development

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

Fork and send pull requests via github, also any [issues](https://github.com/spire-io/jquery.spire.js/issues) are always welcome

# License

Open Source Initiative OSI - The MIT License (MIT):Licensing

The MIT License (MIT)spec
Copyright (c) 2011, 2012 Border Stylo

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
