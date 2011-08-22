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
    path = require('path'),
    xml2js = require('xml2js'),
    _ = require('underscore');

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
              xml: body
            });
          }
        },
        over: catalog,
        par: 5
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
  var parser;
  var catalog;
  var dataSource;
  var queue = [];

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
            lastUpdate: new Date()
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
          return ['ParseXml', queue.shift()];
        }
      },
      actions: {
        'dataSource.data': function (data) {
          queue.push(data);
          return ['ParseXml', queue.shift()];
        }
      }
    },

    ParseXml: function () {
      var index;
      return {
        entry: function (data) {
          index = data.index;
          try {
            parser.parseString(data.xml);
          } catch (err) {
            return 'ManageQueue';
          }
        },
        actions: {
          '.end': function (xmlObj) {
            return ['Broadcast', index, xmlObj];
          },
          '.error': function (err) {
            'ManageQueue'
          }
        }
      };
    },

    Broadcast: {
      work: function (index, xmlObj) {
        var catalogItem = catalog[index];
        try {
          var update = new Date(xmlObj.channel.lastBuildDate);

          if (update > catalogItem.lastUpdate) {
            var newFeeds = _.select(xmlObj.channel.item, function (item) {
              return (new Date(item.pubDate)) > catalogItem.lastUpdate;
            });
            catalogItem.lastUpdate = update;

            if (!_.isEmpty(newFeeds)) {
              fire.$event('rssFeed', newFeeds);
            }
          }
        } catch (err) {
          console.error(err);
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
        console.log('%s %s', feed.pubDate, feed.title);
      });
    }
  }
};

module.exports = rssCatalog;
