option '-p', '--port [PORT]', 'port to run the server on.  defaults to 8080.'
option '-h', '--host [HOST]', 'ip/host to listen on.  set to 0.0.0.0 for all interfaces.  defaults to localhost.'

task 'test:server', 'launch a server for the browser tests', (o)->
  path = require 'path'
  express = require 'express'
  app = express.createServer()
  testDir = path.join __dirname, 'test'
  src = path.join __dirname, 'jquery.spire.js'

  o.port = o.port || 8080
  o.host = o.host || "localhost"

  app.configure ->
    app.use express.logger 'dev'
    app.use express.static testDir

  app.get '/jquery.spire.js', (req, res)->
    res.header 'Content-Type', 'text/javascript'
    res.sendfile src

  app.listen(o.port, o.host)

  process.stdout.write 'Test server running at: http://' + o.host + ':' + o.port
  process.stdout.write '\n'

task 'bundle', 'create the minified version of jquery.spire.js', (o)->
  fs = require 'fs'
  uglify = require 'uglify-js'

  fs.readFile 'jquery.spire.js', 'utf8', (err, data)->
    throw err if err


    out = uglify data

    fs.writeFile 'jquery.spire.min.js', out, (err)->
      throw err if err

task 'docs', 'generate the inline documentation', ->
  fs = require 'fs'
  {spawn, exec} = require 'child_process'
  command = [
    'rm -r docs/*.html'
    'node_modules/docco/bin/docco jquery.spire.js'
  ].join(' && ')
  exec command, (err) ->
    throw err if err
    # move to the index
    fs.rename 'docs/jquery.spire.html', 'docs/index.html', (err)->

# Adapted from http://bit.ly/v02mG8
task 'docs:pages', 'Update gh-pages branch', ->
  path = require 'path'
  cwd = process.cwd()
  {exec} = require 'child_process'
  commitDocs = ->
    process.chdir cwd
    exec 'git rev-parse --short HEAD', (err, stdout, stderr)->
      throw err if err
      revision = stdout
      process.chdir 'docs'
      exec 'git add *.html', (err, stdout, stderr)->
        process.stdout.write stdout
        process.stderr.write stderr
        throw err if err
        commit = "git commit -m 'rebuild pages from " + revision + "'"
        exec commit, (err, stdout, stderr)->
          process.stdout.write stdout
          process.stderr.write stderr
          if !err # its possible to get a benign 'nothing to commit' err
            exec 'git push -q o HEAD:gh-pages', (err, stdout, stderr)->
              process.stdout.write stdout
              process.stderr.write stderr
              throw err if err
              process.chdir cwd
  path.exists 'docs/.git', (exists)->
    if exists
      commitDocs()
    else
      process.chdir 'docs'
      exec 'git init && git remote add o ../.git', (err, stdout, stderr)->
        process.stdout.write stdout
        process.stderr.write stderr
        throw err if err
        command = 'git fetch o && git reset --hard o/gh-pages && touch .'
        exec command, (err, stdout, stderr)->
          process.stderr.write stderr
          throw err if err
          commitDocs()
