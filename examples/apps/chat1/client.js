//[
// Copyright (c) 2011, Richard Miller-Smith & David Hammond.
// All rights reserved. Redistribution and use in source and binary forms, 
// with or without modification, are permitted provided that the following 
// conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials provided
//       with the distribution.
//     * Neither the name of the ignite.js project, nor the names of its
//       contributors may be used to endorse or promote products derived
//       from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//]

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

