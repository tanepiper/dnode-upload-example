#!/usr/bin/env node

require.paths.unshift(__dirname);

var fs = require('fs');
var Seq = require('seq');
var DNode = require('dnode');
var connect = require('connect');
var formidable = require('formidable');
var sys = require('sys');

var sub = undefined;

function publish (event, error, response) {
  sub.call(sub, event, error, response);
}

var server = connect.createServer();
server.use(connect.staticProvider('public'));
server.use('/upload', function(req, res, next) {
  
  var incomingForm = formidable.IncomingForm();
  
  
  incomingForm.on('fileBegin', function(field, file) {
    
    var tracker = {file: file, progress: [], ended: false};
    var push = setInterval(function(){
      publish('data', null, tracker);
    }, 2000)
    
    

    publish('data', null, tracker);

    file.on('progress', function(recieved) {
      tracker.progress.push(recieved);
    })
    .on('end', function() {
      tracker.ended = true;
      publish('data', null, tracker);
      clearInterval(push);
    })
  })
  
  incomingForm.parse(req, function(err, fields, files) {
    res.writeHead(200, {'content-type': 'text/plain'});
    res.write('received upload:\n\n');
    res.end(sys.inspect({fields: fields, files: files}));
  });
})

DNode(function (client, conn) {
  this.subscribe = function (emit) {
    //console.log(conn.id);
    sub = emit;
  };
}).listen(5050).listen(server);

server.listen(8080);