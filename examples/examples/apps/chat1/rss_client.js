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
          console.log(fire.$lastEvtName(), msg);
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

