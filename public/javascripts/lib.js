var chatty = (function() {
  var maxDataSizeInMb = 1 * 1024 * 1024; //0.5 MB by default
  var data4UploadTest = new Uint8Array(maxDataSizeInMb);
  for(var j = 0; j < data4UploadTest.length; j++) {
    data4UploadTest[j] = Math.floor(Math.random() * 255);
  }
  
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
    setTimeout(function() {
      fn(new timeoutError('Timeout Error: Server took longer than 20 seconds to respond.'));
    }, 20000);
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

      socket.uploadTest = function(sizeInMb) {
        sizeInMb = sizeInMb || 0.5;
        var offsetSize = maxDataSizeInMb - Math.floor(sizeInMb * 1024 * 1024);
        var data = data4UploadTest.subarray(offsetSize);
        //console.log(data);
        var msg = {
          sizeInMb: sizeInMb,
          totalTime: 0
        }
        var startTime = Date.now();
        socket.emit('upload-test', data);
        return new Promise(function(resolve, reject) {
          socket.on('upload-test-received', function(data) {
            msg.totalTime = Date.now() - startTime;
            resolve({socket: socket, data: msg});
          });
          socketFailures(socket, reject);
        });
        //return data;
      };

      socket.downloadTest = function(sizeInMb) {
        sizeInMb = sizeInMb || 0.5;
        var msg = {
          sizeInMb: sizeInMb,
          totalTime: 0
        }
        var startTime = Date.now();
        socket.emit('download-test', sizeInMb);
        return new Promise(function(resolve, reject) {
          socket.on('download-test-sent', function(data) {
            msg.totalTime = Date.now() - startTime;
            resolve({socket: socket, data: msg});
          });
          socketFailures(socket, reject);
        });
      };

      return socket;
    },
    getUuid: function() {
      var random = new Alea();
      localStorage.uuid = localStorage.uuid || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        localStorage.seed = random.args[0];
        var r = random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
      });
      return localStorage.uuid;
    } 
  };

}());

function ConnectionError(msg) {
  Error.call(this);
  this.message = msg;
}

function timeoutError(msg) {
  Error.call(this);
  this.message = msg;
}

ConnectionError.prototype = Object.create(Error.prototype);
timeoutError.prototype = Object.create(Error.prototype);
