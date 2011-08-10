var path = require('path'),
    io = require('socket.io-client');

function client (fire, host, port) {
  var socket, 
      name = undefined;

  this.startState = 'Connect';
  this.states = {
    Connect: {
      entry: function () {
        socket = io.connect(host, { port: port });
        fire.$regEmitter('socket', socket, true, '$emit');
      },
      actions: {
        'socket.connected': function (msg) {
          fire.$regEmitter('stdin', process.stdin, true);
          process.stdin.resume();
          process.stdin.setEncoding('utf8');
          return 'SignIn';
        }
      }
    },

    SignIn: {
      entry: function () {
        console.log('Enter user name:');
      },
      actions: {
        'stdin.data': function (data) {
          socket.emit('signIn', data.trim());
        },
        'socket.badName': function () {
          console.log('badName');
          return '@self';
        },
        'socket.signedIn': function (signInName) {
            name = signInName;
            return 'Chatting';
        }
      }      
    },

    'Chatting': {
      entry: function () {
        console.log('Enter chat message:');
      },
      actions: {
        'stdin.data': function (data) {
          data = data.trim();
          if(data === 'exit') {
            socket.disconnect();
            return '@exit';
          } else {
            socket.emit('chat', data.trim());
          }
        },
        'socket.chat': function (msg) {
          console.log(msg);
        }
      },
      exit: function () {
        console.log('closing socket');
      }
    }

  };
  this.defaults = {
    actions: {
      'socket.disconnect' : function () {
        console.log('socket disconnected');
        return '@exit';
      }
    }
  };
};

client.defaults = {
  args: [ 'localhost', 8088 ]
};

module.exports = client;

