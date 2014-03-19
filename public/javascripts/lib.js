var chatty = (function() {
  
  // Socket failures - REJECTION!!
  function socketFailures(socket, fn) {
    socket.on('connect_failed', function() {
      fn(new ConnectionError('Connection Cannot be established.'));
    });
    socket.on('error', function() {
      fn(new ConnectionError('Error connecting with server.'));
    });
    socket.on('reconnect_failed', function() {
      fn(new ConnectionError('Connection Dropped and Cannot be restablished.'));
    });
  }
  
  function promiseSocket(socket, expectedReturn) {
    var promise = new Promise(function(resolve, reject) {
      socket.on(expectedReturn, function(data) {
        data = data || {};
        resolve({socket: socket, data: data });
      });
      socketFailures(socket, reject);
    });
    return promise;
  }

  function echoTest(socket, msg) {
    var promise = new Promise(function(resolve, reject) {
      socket.on('echo-test', function(data) {
        return msg === data 
          ? resolve(socket) 
          : reject(new ConnectionError('Echo Test Failed, sent ' + msg + ' recieved ' + data));  
      });
    });
    return promise;
  }
  
  return {
    connect: function() {
      var socket = io.connect.apply(io, arguments);

      socket.connectionTest = function() {
        socket.emit('connection-test');
        return promiseSocket(socket, 'connection-successful');
      };

      socket.echoTest = function(msg) {
        socket.emit('echo-test', msg);
        return echoTest(socket, msg);
      };

      return socket;
    } 
  };

}());

function ConnectionError(msg) {
  Error.call(this);
  this.message = msg;
}

ConnectionError.prototype = Object.create(Error.prototype);
