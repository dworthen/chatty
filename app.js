
/**
 * Module dependencies.
 */

var express = require('express');
var _ = require('lodash');
var http = require('http');
var path = require('path');
var cons = require('consolidate');
var fs = require('fs');
var handlebars = require('handlebars');
var port = process.env.PORT || 3000;
var app = express();
//var server = http.createServer({pfx: fs.readFileSync(__dirname + '/keys/gcps.com.pfx')},
//    app);
var server = http.createServer(app);
var io = require('socket.io').listen(server, {
  transports: ['websocket', 'xhr-polling'],
  'heartbeat timeout': 120,
  'heartbeat interval': 60,
  'polling duration': 120
});


var rooms = [
  {room: 'awesome', users: [{id: 1, name: 'Derek', rooms: ['awesome']}, {id:2, name: 'Kris', rooms: ['awesome']}]},
  {room: 'cool', users: [{id: 3, name: 'Shalee', rooms: ['cool']}, {id:4, name: 'Shayna', rooms: ['cool']}]}
];

var maxDataSizeInMb = 1 * 1024 * 1024; //0.5 MB by default
//var arrBuf = new ArrayBuffer(maxDataSizeInMb);
//var data4DownloadTest = new Uint8Array(arrBuf);
//for(var j = 0; j < data4DownloadTest.length; j++) {
//  data4DownloadTest[j] = Math.floor(Math.random() * 255);
//}

var data4DownloadTest = new Buffer(maxDataSizeInMb);
for(var i = 0; i < data4DownloadTest.length; i++) {
  data4DownloadTest[i] = (Math.random() * 255)|0;
}

server.listen(port);
console.log(port);

io.sockets.on('connection', function (socket){

  // convenience function to log server messages on the client
  function log(){
    var array = [">>> Message from server:"];
    for (var i = 0; i < arguments.length; i++) {
      array.push(arguments[i]);
    }
    socket.emit('log', array.join(' '));
  }

  socket.on('join session', function(room) {
    if(!room) {
      log('Error, no room provided to enter on join session');
      return;
    }
    var numClients = io.sockets.clients(room).length;

    if(numClients < 2) {
      log('1) Successfully joined ' + room);
      if(numClients !== 0) {
        log('2) You are not alone, requesting stream info from', room);
        socket.broadcast.to(room).emit('need stream information');
      }
      socket.join(room);
    }
    
    socket.on('stream info', function(constraints) {
      socket.broadcast.to(room).emit('create offer', constraints);
    });

    socket.on('offer', function(offer) {
      log('3) Recieved offer, sending to', room);
      socket.broadcast.to(room).emit('answer', offer);
    });

    socket.on('send answer', function(offer) {
      log('2) Recieved answer, sending to', room);
      socket.broadcast.to(room).emit('response', offer);
    });

    socket.on('ice candidate', function(candidate) {
      //log('Recieved ice candidate, passing to', room);
      socket.broadcast.to(room).emit('candidate', candidate);
    });

    socket.on('bye', function() {
      socket.broadcast.to(room).emit('bye');
    });


    //socket.on('send capture', function(url) {
    //  socket.broadcast.to(room).emit('capture', url);
    //});
  }); 

  // VERSION 2.0 
  socket.on('connection-test', function() {
    socket.emit('connection-successful', "Connection Test successful");
  });

  socket.on('echo-test', function(data) {
    socket.emit('echo-test', data);
  });

  socket.on('upload-test', function(data) {
    //delete data.data;
    socket.emit('upload-test-received'); 
  });

  socket.on('download-test', function(sizeInMb) {
    var offsetSize = maxDataSizeInMb - Math.floor(sizeInMb * 1024 * 1024);
    var data = data4DownloadTest.slice(offsetSize);
    socket.emit('download-test-sent', data);
  });

  socket.on('disconnect', function() {
    console.log('A Client Disconnected');
  });

});



// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.engine('.html', cons.handlebars);
app.set('view engine', 'html');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(__dirname + '/public'));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

handlebars.registerHelper("include", function(file) {
  return fs.readFileSync(path.join(app.get('views'), file + '.html')); 
});

app.get('/client/:room?', function(req, res) {
  res.render('screen');
});

app.get('/proctor/:room?', function(req, res) {
  res.render('screen');
});

app.get('/', function(req, res) {
  res.redirect('/chatty');
});

app.get('/chatty/:room?', function(req, res) {
  res.render('screen');
});

app.get('/test', function(req, res) {
  res.render('test');
});

app.get('/new', function(req, res) {
  res.render('new/index');
});

app.get('/room/:id?', function(req, res) {
  if(req.params.id) return res.send(getRoom(req.params.id));
  return res.send(getRooms());
});

app.get('/user/:userid?', function(req, res) {
  if (req.params.userid) return res.send(getUser(_.parseInt(req.params.userid)));
  return res.send(getUsers());
});

function getUsers() {
  return { data: _.flatten(_.pluck(rooms, 'users'))};
}

function getUser(user) {
  var result;
  _.forEach(rooms, function(room) {
    result = _.find(room.users, {'id': user}) || result;
  });
  return result;
}

function getRooms(room) {
  return {data: _.cloneDeep(rooms)};
};

function getRoom(room) {
  var result = {};
  var findIndex = _.findIndex(rooms, {'room': room});
  if(findIndex > -1) {
    result = _.cloneDeep(rooms[findIndex]);
  } else {
    result.room = room;
    result.users = [];
  }
  return result;
}

//io.sockets.on('connection', function (socket) {
//  var initiatorChannel = '';
//  if (!io.isConnected)
//    io.isConnected = true;
//
//  socket.on('new-channel', function (data) {
//    channels[data.channel] = data.channel;
//    onNewNamespace(data.channel, data.sender);
//  });
//
//  socket.on('presence', function (channel) {
//    var isChannelPresent = !! channels[channel];
//    socket.emit('presence', isChannelPresent);
//    if (!isChannelPresent)
//      initiatorChannel = channel;
//  });
//
//  socket.on('disconnect', function (channel) {
//    if (initiatorChannel)
//      channels[initiatorChannel] = null;
//  });
//});
//
//function onNewNamespace(channel, sender) {
//  io.of('/' + channel).on('connection', function (socket) {
//    if (io.isConnected) {
//      io.isConnected = false;
//      socket.emit('connect', true);
//    }
//
//    socket.on('message', function (data) {
//      if (data.sender == sender)
//        socket.broadcast.emit('message', data.data);
//    });
//  });
//}
//
//
//
//
//
        //socket.on('message', function (message) {
        //
        //        log('Got message:', message);
        // for a real app, would be room only (not broadcast)
        //        socket.broadcast.emit('message', message);
        //});


        //socket.on('create or join', function (room) {
        //        var numClients = io.sockets.clients(room).length;

        //        log('Room ' + room + ' has ' + numClients + ' client(s)');
        //        log('Request to create or join room ' + room);

        //        if (numClients === 0){
        //                socket.join(room);
        //                socket.emit('created', room);
        //        } else if (numClients === 1) {
        //                io.sockets.in(room).emit('join', room);
        //                socket.join(room);
        //                socket.emit('joined', room);
        //        } else { // max two clients
        //                socket.emit('full', room);
        //        }
        //        socket.emit('emit(): client ' + socket.id + ' joined room ' + room);
        //        socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + room);

        //        socket.on('disconnect', function() {
        //          console.log('DISCONNECTED');
        //          //numClients--;
        //          console.log(numClients);
        //        });

        //});
