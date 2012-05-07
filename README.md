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
    }, function (err) {
      if (!err) {
        // Your account has been registered, and you now have a spire session at `spire.session`.  Start creating channels and subscripions.
      }
    });

Or start spire with an account secret:

    spire.start(your_account_secret, function (err, session) {
      if (!err) {
        // You now have a Spire session at `spire.session`
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

By default, the `spire.subscribe` method will return all channel events starting with the very first event.
If you only want to listen for events from this point forward, pass `last: 'now'` as an option:


Subscribe to a channel, and only listen for new events:

    spire.subcribe('channel name', { last: 'now' }, function (messages) {
      for (var i = 0; i < messages.length; i++) {
        console.log("Received message: " + messages[i].content);
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

## Identity API

You can use the spire.io Identity API for secure serverless apps.

The Identity API lets you create applications:

    // Create a new application.
    var applicationName = "my-application";
    spire.session.createApplication(applicationName, function (err, application) {
      if (!err) {
        // `application` is your new application
      }
    });


Once you have created an application, clients can create new members, or authenticate existing members with needing a session or any priveledged information.

Start by getting the application:

    // Get an application from the application key.
    var myApplicationKey = "application-key";
    spire.getApplication(myApplicationKey, function (err, application) {
      if (!err) {
        // `application` is an application object
      }
    });

Create a new member:

    // Create a new member for myApplication.
    // `myApplication` is an application object.
    var login = "foo";
    var password = "bar";
    myApplication.createMember(login, password, function (err, member) {
      if (!err) {
        // `member` is a member object
      }
    });


Authenticate an existing member:

    // Authenticate a member for myApplication
    // `myApplication` is an application object.
    var login = "foo";
    var password = "bar";
    myApplication.authenticateMember(login, password, function (err, member) {
      if (!err) {
        // `member` is a member object
      }
    });


For more on applications and the Identity API, see the [identity topic guide](http://www.spire.io/docs/topic-guides/identity.html) or the [tuturial for a secure serverless app](http://www.spire.io/docs/tutorials/simple-chat.html).

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

Subscriptions have three basic kinds of events:

    * `message` events are messages that were published to the channel,
    * `join` events are created when a new subscription is added to the channel, and
    * `part` events are created when a subscription is deleted or expires.

Here are examples of all three kinds of event listeners:

    mySubscription.addListener('message', function (message) {
      console.log('Message received: ' + message.content);
    });

    mySubscription.addListener('join', function (join) {
      console.log('Subscription joined: ' + join.subscription_name);
    });

    mySubscription.addListener('part', function (part) {
      console.log('Subscription parted: ' + part.subscription_name);
    });

To start listening on a subscription, call:

    mySubscription.startListening();

You can pass options to `startListening`.
For example, if you only want to listen for new messages (and ignore all messages that have already been sent), pass in `last: 'now'`:

    mySubscription.startListening({ last: 'now' });

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
