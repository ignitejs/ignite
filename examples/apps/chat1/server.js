var http = require('http'),
    io = require('socket.io'),
    path = require('path');

function user (fire, socket, nameList) {
  var name;

  this.startState = 'SignIn';
  this.states = {
    SignIn: {
      entry: function () {
        fire.$regEmitter('socket', socket, true, '$emit');
        socket.emit('connected');
      },
      actions: {
        'socket.signIn': function (signInName) {
          if (nameList.indexOf(signInName) < 0) {
            nameList.push(signInName);
            name = signInName;
            socket.emit('signedIn');
            return 'Chatting';
          } else {
            socket.emit('badName');
          }
        },
        'socket.disconnect': '@exit'
      }
    },

    Chatting: {
      actions: {
        'socket.chat': function (msg) {
          fire.$factoryEvent('broadcastChat', name, msg);
        },
        'socket.disconnect': function () {
          return [ '@exit', name ];
        }
      }
    }

  };
};


function chatRoom (fire, port, pagePath) {
  var httpServer, ioManager, 
      SpawnUser, pageHtml, 
      nameList = [];

  this.startState = 'Init';
  this.states = {
    Init: {
      entry: function (port) {
        httpServer = http.createServer();        
        httpServer.listen(port);
        ioManager = io.listen(httpServer);
        
        ioManager.set('log level', 1) ;
        
        fire.$regEmitter('httpServer', httpServer, true);
        fire.$regEmitter('ioListener', ioManager.sockets, true, '$emit');

        SpawnUser = fire.$spawner('SpawnUser', user);

        fire.fs.readFile(pagePath);
      },
      actions: {
        '.done': function (data) {
          pageHtml = data;
          return 'Listening';
        },
        '.err': '@error'
      }
    },

    Listening: {
      actions: {
        'httpServer.request': 'HttpReply',
        'ioListener.connection': 'IoConnect',
        'SpawnUser.broadcastChat': function (name, text) {
          return [ 'BroadcastMessage', 'chat', { name: name, text: text } ];  
        },
        'SpawnUser.done': function (id, type, name) {
          var pos = nameList.indexOf(name);
          if (pos >= 0) {
            nameList.splice(pos, 1);
          }
          return 'StatusUpdate';
        }
      }
    },

    HttpReply: {
      entry: function (request, response) {
        if (!ioManager.checkRequest(request)) {
          if (request.url === '/') {
            response.writeHead(200, {
              'Content-Type': 'text/html'
            });
            response.write(pageHtml);
            response.end();
          } else {
            response.writeHead(404);
            response.end();
          }
        }
        return 'Listening';
      }
    },

    IoConnect: {
      spawn: {
        factory: 'SpawnUser',
        smArgs: function (socket) {
          return [ socket, nameList ];
        }
      },
      actions: {
        '.done': 'StatusUpdate'
      }
    },

    StatusUpdate: {
      entry: function () {
        return [ 'BroadcastMessage', 'statusUpdate', SpawnUser.count() ];
      }
    },

    BroadcastMessage: {
      entry: function (eventName, msg) {
        ioManager.sockets.json.emit(eventName, msg);
        return 'Listening';
      }
    }
  };

  this.defaults = {
    defer: [ 'httpServer.request', 
             'ioListener.connection',
             'SpawnUser.broadcastChat',
             'SpawnUser.done' ]
  };
};

chatRoom.defaults = {
    imports: { fs: require('fs') },
    options: {},
    args: [ 8088,
            path.join(path.dirname(module.filename), 'client.html') ]
};

module.exports = chatRoom;
