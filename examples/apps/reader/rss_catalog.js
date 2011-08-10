var ignite = require('ignite'),
    path = require('path'),
    _ = require('underscore'),
    xml2js = require('xml2js');

function rssRequest (fire, catalog, refresh) {
  this.startState = 'Request';
  this.states = {
    Regulate: {
      timeout: refresh,
      actions: {
        'timeout': 'Request'
      }
    },

    Request: {
      each: {
        fn: 'request',
        fnArgs: function (feed) {
          return feed.url;
        },
        iterator: function (i, err, response, body) {
          if (!err) {
            fire.$machineEvent('data', {
              index: i,
              data: body
            });
          }
        },
        over: catalog,
        par: 20
      },
      actions: {
        '.done': 'Regulate'
      }
    }
  };

  this.defaults = {
    actions: {
      'api.stop': '@exit'
    }
  };
};
rssRequest.api = [ 'stop' ];
rssRequest.defaults = {
  imports: { request: require('request') },
  options: { logLevel: 0 }
};
var rssRequestFactory = new ignite.Factory(rssRequest);


function rssCatalog (fire, catalogPath, refresh) {
  var catalog, parser,
      queue = [], feed,
      dataSource;

  this.startState = 'LoadCatalog';
  this.states = {
    LoadCatalog: {
      entry: function (catalogPath) {
        parser = new xml2js.Parser();
        fire.$regEmitter('parser', parser, true);
        fire.fs.readFile(catalogPath);
      },
      actions: {
        '.done': 'StartSource',
        '.err': '@error'
      }
    },
    
    StartSource: {
      entry: function (urlList) {
        urlList = JSON.parse(urlList);
        catalog = _.map(urlList, function(url) {
          return {
            url: [ { uri: url } ],
            lastUpdate: new Date(0,0,0)
          };
        });

        dataSource = rssRequestFactory.spawn(catalog, refresh);
        fire.$regEmitter('dataSource', dataSource, true);

        return 'ManageQueue';
      }
    },

    ManageQueue: {
      entry: function () {
        if (queue.length !== 0) {
          return 'ParseXml';
        }
      },
      actions: {
        'dataSource.data': function (data) {
          queue.push(data);
          return 'ParseXml';
        },
        'api.stop': '@defer'
      },
      exit: function() {
        var data = queue.shift();
        feed = catalog[data.index];
        feed.data = data.data;
      }
    },

    ParseXml: {
      entry: function () {
        parser.parseString(feed.data);
      },
      actions: {
        '.end': function (xml) {
          feed.channel = xml.channel;
          feed.update = new Date(xml.channel.lastBuildDate);
          return 'Broadcast';
        },
        '.err': 'ManageQueue'
      }
    },

    Broadcast: {
      guard: function () {
        if (feed.update <= feed.lastUpdate) {
          return 'ManageQueue';
        }
      },
      work: function () {
        var newFeeds = _.select(feed.channel.item, function (item) {
          item.pubDate = new Date(item.pubDate);
          return item.pubDate > feed.lastUpdate;
        });
        feed.lastUpdate = feed.update;

        if (!_.isEmpty(newFeeds)) {
          fire.$event('rssFeed', newFeeds);
        }
        return 'done';
      },
      actions: {
        '.done': 'ManageQueue'
      }
    }
  };

  this.defaults = {
    actions: {
      'api.stop': function () {
        dataSource.stop();
        return '@exit';
      },
      'dataSource.data': function (data) {
        queue.push(data);
      }
    }
  };
};

rssCatalog.api = [ 'stop' ];
rssCatalog.defaults = {
  options: { logLevel: 0 },
  imports: { fs: require('fs') },
  args: [ 
    path.join(path.dirname(module.filename), 'rss_catalog.json'),
    5000
  ]
};
rssCatalog.runner = {
  on: {
    'rssFeed': function (newFeeds) {
      _.each(newFeeds, function (feed) {
        console.log('%s %s', feed.pubDate.toLocaleTimeString(), feed.title);
      });
    }
  }
};

module.exports = rssCatalog;
