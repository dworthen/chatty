var socket = chatty.connect('/', {
  'reconnection limit': 10000,
  'max reconnection attempts': 5,
  'sync disconnect on unload': true
});


socket.on('reconnect', function() {
  console.log('Reconnected successfully');
});
socket.on('reconnecting', function() {
  console.log('Attempting to Reconnect');
});
socket.on('connecting', function() {
  console.log('Connecting');
});
socket.on('connect', function() {
  console.log('Connected');
});
socket.on('disconnect', function() {
  console.log('Disconnected');
});
socket.on('connect_failed', function() {
  console.log('Could Not Connect!');
});
socket.on('error', function() {
  console.log('ERROR');
});
socket.on('reconnect_failed', function() {
  console.log('Reconnect Failed');
});

// Models
var User = can.Model.extend({
  findAll: socket.getUsers,
  findOne: socket.getUser,
  create: 'POST /user',
  update: 'PUT /user/{id}',
  destroy: 'DELETE /user/{id}'
}, {});

var Room = can.Model.extend({
  findAll: socket.getRooms,
  findOne: socket.getRoom,
  create: 'POST /room',
  update: 'PUT /room/{id}',
  destroy: 'DELETE /room/{id}'
}, {});
