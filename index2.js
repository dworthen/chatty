var page = require('page')
  , qs = require('querystring');

module.exports = function() {
  sessions = {};
  
  function openSignalingChannel(config) {
    SIGNALING_SERVER = 'https://localhost:3000/';
    var channel = config.channel || this.channel || 'default';
    var sender = Math.round(Math.random() * 60535) + 5000;

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
  }

  function onNewSession(session) {
    alert('new Session');
    console.log(session.sessionid);
    if(sessions[session.sessionid]) return;
    sessions[session.sessionid] = session;
  }

  function noop() {}

  page('/client', function(ctx) {
    var query = qs.parse(ctx.querystring);
    var connection = new RTCMultiConnection();

    connection.enableSessionReinitiation = false;
    connection.openSignalingChannel = openSignalingChannel;
    //connection.onNewSession = onNewSession;

    connection.session = {
      audio: true,
      video: true,
      screen: true
    };
    connection.session.oneway = true;

    //connection.bandwidth = {
    //  audio: 25,
    //  video: 150,
    //  data: 1638400
    //};

    connection.mediaConstraints.mandatory = {
      minWidth: 320,
      maxWidth: 320,
      minHeight: 180,
      maxHeight: 180,
      minFrameRate: 10
    }

    connection.media.minAspectRatio = 1.77;

    connection.onstream = function(e) {
      document.body.appendChild(e.mediaElement);
    }

    connection.onstreamended = function(e) {
      if(e.mediaElement.parentNode) e.mediaElement.parentNode.removeChild(e.mediaElement);
    }

    //connection.onRequest = function(userid) {
    //  console.log(userid);
    //  connection.accept(userid);
    //}

    //connection.connect(query.id);
    //connection.maxParticipantsAllowed = 1;
    connection.connect(query.id);
    connection.open(query.id);

  });
  
  page('/proctor', function(ctx) {
    var query = qs.parse(ctx.querystring);
    var connection = new RTCMultiConnection();

    console.log(query);

    connection.enableSessionReinitiation = false;
    connection.openSignalingChannel = openSignalingChannel;
    //connection.onNewSession = onNewSession;

    connection.session = {
      audio: true
    };

    //connection.bandwidth = {
    //  audio: 25,
    //  video: 150,
    //  data: 1638400
    //};

    //connection.mediaConstraints.mandatory = {
    //  minWidth: 320,
    //  maxWidth: 320,
    //  minHeight: 180,
    //  maxHeight: 180,
    //  minFrameRate: 10
    //}

    connection.onstream = function(e) {
      document.body.appendChild(e.mediaElement);
    }

    connection.onstreamended = function(e) {
      if(e.mediaElement.parentNode) e.mediaElement.parentNode.removeChild(e.mediaElement);
    }

    //connection.maxParticipantsAllowed = 1;
    connection.connect(query.id);

  });

  page(window.location.pathname + window.location.search);
};
