var socket = chatty.connect('/');

// Models
var User = can.Model.extend({
  findAll: 'GET /user',
  findOne: 'GET /user/{id}',
  create: 'POST /user',
  update: 'PUT /user/{id}',
  destroy: 'DELETE /user/{id}'
}, {});

var Room = can.Model.extend({
  findAll: 'GET /room',
  findOne: 'GET /room/{id}',
  create: 'POST /room',
  update: 'PUT /room/{id}',
  destroy: 'DELETE /room/{id}'
}, {});
