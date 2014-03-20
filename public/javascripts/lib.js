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

      socket.uploadTest = function(sizeInMb, i) {
        sizeInMb = sizeInMb || 0.5;
        i = i || 1;
        var data = new Uint8Array(sizeInMb * 1024 * 1024);
        for(var j = 0; j < data.length; j++) {
          data[j] = Math.ceil(Math.random() * 255);
        }
        var msg = {
          sizeInMb: sizeInMb,
          data: data,
          iteration: i,
          totalTime: 0
        }
        msg.startTime = Date.now();
        socket.emit('upload-test', msg);
        return promiseSocket(socket, 'upload-test-received');
      };

      socket.downloadTest = function(sizeInMb, i) {
        sizeInMb = sizeInMb || 0.5;
        i = i || 1;
        var msg = {
          sizeInMb: sizeInMb,
          data: [],
          iteration: i,
          startTime: 0,
          totalTime: 0
        }
        socket.emit('download-test', msg);
        return new Promise(function(resolve, reject) {
          socket.on('download-test-sent', function(data) {
            data.totalTime = Date.now() - data.startTime;
            resolve({socket: socket, data: data});
          });
          socketFailures(socket, reject);
        });
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
