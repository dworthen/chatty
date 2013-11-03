var page = require('page')
  , qs = require('querystring')
  , _ = require('lodash');

module.exports = function() {
  
    var config = {
        openSocket: function(config) {
            var SIGNALING_SERVER = 'https://localhost:3000/',
                defaultChannel = location.hash.substr(1) || 'default';

            var channel = config.channel || defaultChannel;
            var sender = Math.round(Math.random() * 999999999) + 999999999;

            io.connect(SIGNALING_SERVER).emit('new-channel', {
                channel: channel,
                sender: sender
            });

            var socket = io.connect(SIGNALING_SERVER + channel);
            socket.channel = channel;
            socket.on('connect', function() {
                if (config.callback) config.callback(socket);
            });

            socket.send = function(message) {
                socket.emit('message', {
                    sender: sender,
                    data: message
                });
            };

            socket.on('message', config.onmessage);
        },
        onRemoteStream: function(htmlElement) {
            htmlElement.setAttribute('controls', true);
            videosContainer.insertBefore(htmlElement, videosContainer.firstChild);
            htmlElement.play();
        },
        //onRoomFound: function(room, cb) {
        //},
        onNewParticipant: function(numberOfViewers) {
          document.title = 'Viewers: ' + numberOfViewers;
        }
    };

    function clientOnRoom(room, cb) {
      console.log('Found new Room');
      if(room.roomName == id + '-return') {
        cb();

        broadcastUI.joinRoom({
          roomToken: room.broadcaster,
          joinUser: room.broadcaster,
          roomName: id + '-accept',
          isAudio: false
        });
      }
    }

    function proctorOnRoom(room, cb) {
      console.log('Found new Room');
      //var alreadyExist = document.querySelector('button[data-broadcaster="' + room.broadcaster + '"]');
      //if (alreadyExist) return;

      var tr = document.createElement('tr');
      tr.innerHTML = '<td><strong>' + room.roomName + '</strong> is broadcasting his media!</td>' +
          '<td><button class="join">Join</button></td>';
      roomsList.insertBefore(tr, roomsList.firstChild);

      var joinRoomButton = tr.querySelector('.join');
      joinRoomButton.setAttribute('data-broadcaster', room.broadcaster);
      joinRoomButton.setAttribute('data-roomToken', room.broadcaster);
      joinRoomButton.onclick = function() {
          this.disabled = true;
          cb();

          var broadcaster = this.getAttribute('data-broadcaster');
          var roomToken = this.getAttribute('data-roomToken');
          broadcastUI.joinRoom({
              roomToken: roomToken,
              joinUser: broadcaster,
              isAudio: false
          });
      };
    }

    var broadcastUI
      , id;

    page('/client/:proctor/:id', function(ctx) {
      id = ctx.params.id;
      config.onRoomFound = clientOnRoom;
      broadcastUI = broadcast(config);
      startSession(id, 'video');
      startSession(id + '-screen', 'screen');
    });

    $('#startSession').click(function() {
      this.disabled = true;
      page(window.location.pathname + window.location.search);
    });

    $('#listen').click(function() {
      this.disabled = true;
      config.onRoomFound = proctorOnRoom;
      broadcastUI = broadcast(config);
    });

    //page('/proctor/:proctor/:id', function(ctx) {
    //  broadcastUI = broadcast(config);
    //  
    //});

    function startSession(roomName, broadcastOption) {
      this.disabled = true;
      captureUserMedia(broadcastOption, function() {
          broadcastUI.createRoom({
              roomName: roomName,
              isAudio: false
          });
      });
    }

    var videosContainer = document.getElementById('videos-container') || document.body;
    var setupNewBroadcast = document.getElementById('setup-new-broadcast');
    var roomsList = document.getElementById('rooms-list');
    var broadcastingOption = document.getElementById('broadcasting-option');

    function captureUserMedia(broadcastOption, callback) {
        var constraints = {
          audio: true,
          video: true
        },
        errorMsg = 'Unable to access Webcam';
        switch(broadcastOption) {
          case 'audio':
            constraints.video = false;
            errorMsg = "Unable to access Mic!";
          break; 
          case 'screen':
            constraints = {
              audio: false,
              video: {
                mandatory: {
                    chromeMediaSource: 'screen'
                },
                optional: []
              }
            };
            errorMsg = location.protocol == 'http:' 
              ? 'Need to use https' 
              : 'enable screensharing in getUserMedia flag';
          break;
        }

        var htmlElement = document.createElement('video');
        htmlElement.setAttribute('autoplay', true);
        htmlElement.setAttribute('controls', true);
        htmlElement.setAttribute('width', 320);
        videosContainer.insertBefore(htmlElement, videosContainer.firstChild);

        var mediaConfig = {
            video: htmlElement,
            onsuccess: function(stream) {
                config.attachStream = stream;
                htmlElement.setAttribute('muted', true);
                callback();
            },
            onerror: function() {
              alert(errorMsg);
            }
        };
        if (constraints) mediaConfig.constraints = constraints;
        getUserMedia(mediaConfig);
    }

  //page(window.location.pathname + window.location.search);
};


//document.getElementById('broadcasting-option').onclick = function() {
//    this.disabled = true;
//
//    captureUserMedia(function() {
//        var shared = 'video';
//        if (window.option == 'Only Audio') shared = 'audio';
//        if (window.option == 'Screen') shared = 'screen';
//        broadcastUI.createRoom({
//            roomName: 'Anonymous',
//            isAudio: false
//        });
//    });
//};
      //console.log('Found new Room');
      //var alreadyExist = document.querySelector('button[data-broadcaster="' + room.broadcaster + '"]');
      //if (alreadyExist) return;

      //var tr = document.createElement('tr');
      //tr.innerHTML = '<td><strong>' + room.roomName + '</strong> is broadcasting his media!</td>' +
      //    '<td><button class="join">Join</button></td>';
      //roomsList.insertBefore(tr, roomsList.firstChild);

      //var joinRoomButton = tr.querySelector('.join');
      //joinRoomButton.setAttribute('data-broadcaster', room.broadcaster);
      //joinRoomButton.setAttribute('data-roomToken', room.broadcaster);
      //joinRoomButton.onclick = function() {
      //    this.disabled = true;
      //    cb();

      //    var broadcaster = this.getAttribute('data-broadcaster');
      //    var roomToken = this.getAttribute('data-roomToken');
      //    broadcastUI.joinRoom({
      //        roomToken: roomToken,
      //        joinUser: broadcaster,
      //        isAudio: false
      //    });
      //};
