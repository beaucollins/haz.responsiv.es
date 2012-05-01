express = require 'express'
consolidate = require 'consolidate'
http = require 'http'
https = require 'https'
url = require 'url'

app = express()

app.configure ()->
  # Server Headers
  app.use (req, res, next)->
    res.setHeader 'X-Powered-By', 'Awesomesauce'
    res.setHeader 'Server', 'Collins'
    next()
  
  # Serve static files from public
  app.use express.static('public')  
  
  app.engine 'jade', consolidate.jade
  app.set 'view engine', 'jade'
  app.set 'views', 'views'


app.get '/supported', (req, res, next)->
  find req.param('url'), req.headers['user-agent'], (e, http_response)->
    if e
      res.send(500, e.message)
    else
      res.send(200, {"x-frame-options":(http_response.headers['x-frame-options'] || false)})
      
app.get '/opensearch', (req, res, next)->
  res.setHeader 'content-type', 'application/opensearchdescription+xml'
  res.render 'opensearch'
    

find = (u, ua, cb, hops = 5)=>
  if hops == 0
    cb(new Error("Too man redirects"))
    return
  u = url.parse(u)
  u.headers = {
    'user-agent': ua
  }
  client = if u.protocol == 'http:' then http else https
  client
    .get( u, (get)->
      if get.statusCode >= 300 && get.statusCode < 400
        find get.headers['location'], ua, (e, get)->
          cb(e, get)
        , hops-1
      else
        cb(null, get)
    )
    .on( 'error', (e)->
      cb(e, null)
    )
  
  
  
app.listen process.env.PORT || 4000
  