window.Genie = {};
Genie.Settings = {"webchannels_autosubscribe":true,"server_host":"http://c347613aed19.ngrok.io","webchannels_subscribe_channel":"subscribe","server_port":8000,"webchannels_default_route":"__","webchannels_unsubscribe_channel":"unsubscribe","websockets_port":8001}
Genie.WebChannels = {};
Genie.WebChannels.load_channels = function() {
  var socket = new WebSocket("wss://c347613aed19.ngrok.io/");
  var channels = Genie.WebChannels;

  channels.channel = socket;
  channels.sendMessageTo = sendMessageTo;

  channels.messageHandlers = [];
  channels.errorHandlers = [];
  channels.openHandlers = [];
  channels.closeHandlers = [];

  socket.addEventListener('open', function(event) {
    for (var i = 0; i < channels.openHandlers.length; i++) {
      var f = channels.openHandlers[i];
      if (typeof f === 'function') {
        f(event);
      }
    }
  });

  socket.addEventListener('message', function(event) {
    for (var i = 0; i < channels.messageHandlers.length; i++) {
      var f = channels.messageHandlers[i];
      if (typeof f === 'function') {
        f(event);
      }
    }
  });

  socket.addEventListener('error', function(event) {
    for (var i = 0; i < channels.errorHandlers.length; i++) {
      var f = channels.errorHandlers[i];
      if (typeof f === 'function') {
        f(event);
      }
    }
  });

  socket.addEventListener('close', function(event) {
    for (var i = 0; i < channels.closeHandlers.length; i++) {
      var f = channels.closeHandlers[i];
      if (typeof f === 'function') {
        f(event);
      }
    }
  });

  // A message maps to a channel route so that channel + message = /action/controller
  // The payload is the data made exposed in the Channel Controller
  function sendMessageTo(channel, message, payload = {}) {
    if (socket.readyState === 1) {
      socket.send(JSON.stringify({
        'channel': channel,
        'message': message,
        'payload': payload
      }));
    }
  }
};

window.addEventListener('beforeunload', function (event) {
  if (Genie.WebChannels.channel.readyState === 1) {
    Genie.WebChannels.channel.close();
  }
});

Genie.WebChannels.load_channels();

Genie.WebChannels.messageHandlers.push(function(event){
  try {
    if (event.data.startsWith('{') && event.data.endsWith('}')) {
      window.parse_payload(JSON.parse(event.data));
    } else {
      window.parse_payload(event.data);
    }
  } catch (ex) {
    console.log(ex);
  }
});

Genie.WebChannels.errorHandlers.push(function(event) {
  console.log(event.data);
});

Genie.WebChannels.closeHandlers.push(function(event) {
  console.log("Server closed WebSocket connection");
});



function subscribe() {
  if (document.readyState === "complete" || document.readyState === "interactive") {
    Genie.WebChannels.sendMessageTo(window.Genie.Settings.webchannels_default_route, window.Genie.Settings.webchannels_subscribe_channel);
    console.log("Subscription ready");
  } else {
    console.log("Queuing subscription");
    setTimeout(subscribe, 1000);
  }
};

function unsubscribe() {
  Genie.WebChannels.sendMessageTo(window.Genie.Settings.webchannels_default_route, window.Genie.Settings.webchannels_unsubscribe_channel);
  console.log("Unsubscription completed");
};

Genie.WebChannels.openHandlers.push(function(event) {
  if ( Genie.Settings.webchannels_autosubscribe ) {
    subscribe();
  }
});

window.onbeforeunload = function() {
  if ( Genie.Settings.webchannels_autosubscribe ) {
    unsubscribe();
  }
};
