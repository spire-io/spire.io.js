option '-p', '--port [PORT]', 'port to run the server on'
task 'test:server', 'launch a server for the browser tests', (o)->
  path = require 'path'
  express = require 'express'
  app = express.createServer()
  testDir = path.join __dirname, 'test'
  src = path.join __dirname, 'jquery.spire.js'

  o.port = o.port || 8080

  app.configure ->
    app.use express.logger 'dev'
    app.use express.static testDir

  app.get '/jquery.spire.js', (req, res)->
    res.header 'Content-Type', 'text/javascript'
    res.sendfile src

  app.listen o.port

  process.stdout.write 'Test server running at: http://localhost:' + o.port
  process.stdout.write '\n'

task 'bundle', 'create the minified version of jquery.spire.js', (o)->
  fs = require 'fs'
  uglify = require 'uglify-js'

  fs.readFile 'jquery.spire.js', 'utf8', (err, data)->
    throw err if err


    out = uglify data

    fs.writeFile 'jquery.spire.min.js', out, (err)->
      throw err if err
