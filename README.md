
# Synopsis

`$.spire` is a [jQuery](http://jquery.com/) plugin and wrapper library for the [spire.io API](http://www.spire.io/).

    $.spire.options.key = '<your account key>';

    $.spire.messages.subscribe('chat example', function(err, messages){
      $.each(messages, function(i, message){
        var p = $('<p>').text(message.content);

        $('body').append(p);
      });
    });

Construct a message to send, `message.content` can be a string or json object.

    var message = { channel: 'chat example'
        , content: 'herow'
        }
    ;

    $.spire.messages.publish(message, function(err, message){
      if (err) throw err; // you could do better ;)

      alert('message sent!');
    });

Or if you don't care that the message was sent

    $.spire.messages.publish(message);


## What is spire.io?

## Working with this library

* [source code](https://github.com/spire-io/jquery.spire.js)
* [inline documentation](http://spire-io.github.com/jquery.spire.js/) (via [docco](http://jashkenas.github.com/docco/))
* [issues](https://github.com/spire-io/jquery.spire.js/issues)
* contact spire.io
* #spire

# Development

## Tests

CORs needs the html to on a server, to run the tests you need to run the test server and visit it's homepage. There is a helper in the Cakefile for this, run the test server via:

    cake test:server

If you don't know about cake and Cakefiles head on over to the CoffeeScript site (Don't worry this plugin isn't written in CoffeScript nor do you need it for anything other than running the development tasks)

## Bundle

So you made some changes and want to minify?

    cake bundle

# Contributing

# License

Open Source Initiative OSI - The MIT License (MIT):Licensing

The MIT License (MIT)spec
Copyright (c) 2001 Border Stylo

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.