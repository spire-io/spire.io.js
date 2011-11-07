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

task 'docs', 'generate the inline documentation', ->
  fs = require 'fs'
  {spawn, exec} = require 'child_process'

  command = [
    'rm -r docs'
    'node_modules/docco/bin/docco jquery.spire.js'
  ].join(' && ')

  exec command, (err) ->
    throw err if err

    # move to the index
    fs.rename 'docs/jquery.spire.html', 'docs/index.html', (err)->

# Adapted from http://bit.ly/v02mG8
task 'docs:publish', 'publish whats inside the ./docs dir to guthub pages', ->
  {spawn, exec} = require 'child_process'

  #  =
  # get the revision
  exec 'git rev-parse --short HEAD', (err, stdout, stderr)->
    throw err if err

    revision = stdout

    process.chdir 'docs'

    exec 'git add *.html', (err, stdout, stderr)->
      throw err if err

      process.stdout.write stdout
      process.stderr.write stdout

      commit = "git commit -m 'rebuild pages from " + revision + "'"

      exec commit , (err, stdout, stderr)->
        throw err if err

        process.stdout.write stdout
        # process.stderr.write stdout
  # git add
  # git commit
  # git push

  # process.chdir 'docs'

task 'docs:init', 'git init the ./docs dir', ->
  fs = require 'fs'
  path = require 'path'
  {spawn, exec} = require 'child_process'

  # init a git repo if it hasn't already happened
  path.exists 'docs/.git', (exists)->
    return if exists

    process.chdir 'docs'

    exec 'git init && git remote add o ../.git', (err, stdout, stderr)->
      throw err if err

      process.stdout.write stdout

  # exec 'git fetch o && git reset --hard o/gh-pages && touch .', (err, stdout, stderr)->
  #
  #   console.log stdout


    #
    #
    # init = spawn 'git', ['init']
    #
    # init.stdout.on 'data', (data)->
    #   process.stdout.write data
    #
    # init.stderr.on 'data', (data)->
    #   process.stdout.stderr data
    #
    # init.on 'exit', (code)->
    #   remote = spawn 'git', [
    #     'remote'
    #     'add'
    #     'o'
    #     '../.git'
    #     ]
    #
    #   remote.stdout.on 'data', (data)->
    #     process.stdout.write data
    #
    #   remote.stderr.on 'data', (data)->
    #     process.stdout.stderr data











