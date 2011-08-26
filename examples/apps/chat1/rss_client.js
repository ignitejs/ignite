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

var ignite = require('ignite'),
    rssCatalog = require('../reader/rss_catalog'),
    io = require('socket.io-client');

var rssFactory = new ignite.Factory(rssCatalog);

function rssClient (fire, host, port) {
  var socket;

  this.startState = 'Connect';
  this.states = {
    Connect: {
      entry: function () {
        socket = io.connect(host, { port: port });
        fire.$regEmitter('socket', socket, true, '$emit');
      },
      actions: {
        'socket.connected': function () {
          socket.emit('signIn', 'rss');
        },
        'socket.signedIn': 'StartFeed',
        'socket': function (msg) {
//          console.log("Unhandled socket event:", fire.$lastEvtName(), msg);
        }
      }
    },

    StartFeed: function () {
      var source;
      return {
        entry: function () {
          source = rssFactory.launch();
          fire.$regEmitter('rssCatalog', source);
        },
        actions: {
          'rssCatalog.rssFeed': function (feeds) {
            var i, item;
            for (i in feeds) {
              item = feeds[i];
              try {
                socket.emit('chat', formatFeed(item));
              } catch (err) {
                return "@exit" ;
              }
            }
          },
          'api.stop': '@exit',
          'socket.disconnect': '@exit'
        },
        exit: function () {
          source.stop();
          try {
            socket.disconnect();
          } catch (err) {
            // ignore
          }
        }
      };
    }

  };
};

rssClient.api = ['stop'];
rssClient.defaults = {
  imports: {},
  options: {},
  args: [ 
    'localhost', 8088 
  ]
};


function formatFeed (item) {  
  var i, ntext = "",
      text = (item.title + ': ' + item.description);

  for (i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) > 127) {
      ntext += ' ';
    } else {
      ntext += text[i];
    }
  }

  return ntext;
};

module.exports = rssClient;

