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

//
// In this example ignite.js is used to build a RSS feed reader. 
// The state machine periodically requests the RSS feed xml, parses 
// it and emits events containing any new items found in the feed 
// data.
//
// The four states in the machine, `Regulate`, `Request`, `ParseXml` and 
// `Broadcast` form a loop. The `Request` state requests the xml, and on 
// response, passes the data to the `ParseXml` state, where it is parsed. 
//
// From here the machine transitions to the `Broadcast` state. This 
// state has its own closure where it maintains a record of the 
// build date from the last feed passed to it (`lastBuildDate`). The 
// state can then tell if it has already been presented with any 
// given feed it receives. If a feed is new, its items are inspected 
// and any new items accumulated in an array (`newFeeds`). The 
// machine then emits an event called `'rssFeed'` containing the array.
//
// The last step in the loop is the `Regulate` state. This state is used 
// to regulate the frequency of the loop. The [`timeout`][TIMEOUT] plug-in 
// is used to produce an event called `'timeout'` after a specified number 
// of milliseconds (`refresh`). On receipt of the event, the machine 
// transitions to `Read` for another loop. Note, the regulation produced 
// by the `Regulate` state is crude and only guarantees that the time taken 
// for each loop is greater than the time spent waiting.
//
// Example Output:
// $ ./bin/ignite examples/rss_feed.js
// Running examples/rss_feed.js
// 12:10:06: Second NATO helicopter crashes; Afghans protest over killings
// 12:06:58: Washington convinces Saleh not to return to Yemen: report
// 12:00:44: Stocks hit by U.S. unease as ECB supports Italy, Spain
// 11:46:49: Syrian tanks pound city, Saudi king condemns violence
// 10:55:44: Britain, other eurozone countries face ratings cut - Jim Rogers
// 10:54:15: Wall Street braces for impact from U.S. downgrade
// 09:14:03: ECB backs Italy, Spain as policymakers pledge action
// 08:34:04: Police arrest 100 after riots in London
// 08:31:49: Euro zone must ensure financial stability - Osborne
// _
//

var _ = require('underscore'),
    xml2js = require('xml2js');

function rssFeed (fire, url, refresh) {
  var parser;

  this.startState = 'Init';
  this.states = {
    Init: {
      entry: function () {
        parser = new xml2js.Parser();
        fire.$regEmitter('parser', parser, true);
        return 'Request';
      }
    },

    Regulate: {
      timeout: refresh,
      actions: {
        'timeout': 'Request'
      }
    },

    Request: {
      async: {
        fn: 'request',
        fnArgs: [ { uri: url } ]
      },
      actions: {
        '.done': 'ParseXml'
      }
    },

    ParseXml: function () {
      var sax;
      return {
        entry: function (response, body) {
          sax = parser.parseString(body);
        },
        actions: {
          '.end': function (xml) {
            sax.close();
            // Do some XML structure checking
            if ('rss' in xml)
              xml = xml.rss;
            return [ 'Broadcast', _.isArray(xml.channel) ? 
                      xml.channel[0] : xml.channel ];
          }
        }
      };
    },

    Broadcast: function () {
      var lastBuildDate = new Date(0, 0, 0);
      return {
        guard: function (channel) {          
          channel.lastBuildDate = new Date(channel.lastBuildDate);
          if (channel.lastBuildDate <= lastBuildDate) {
            return 'Regulate';
          }
        },
        work: function (channel) {
          var newFeeds = _.select(channel.item, function (item) {            
            item.pubDate = new Date(item.pubDate);
            return item.pubDate > lastBuildDate;
          });
          lastBuildDate = channel.lastBuildDate;

          if (!_.isEmpty(newFeeds)) {
            fire.$event('rssFeed', newFeeds);
          }
          return 'done';
        },
        actions: {
          '.done': 'Regulate'
        }
      };
    }

  };

  this.defaults = {
    actions: {
      '.err': '@error',
      'api.stop': '@exit'
    }
  };
};

rssFeed.api = [ 'stop' ];
rssFeed.defaults = {
  imports: { 
    request: require('request')
  },
  args: [ 'http://mf.feeds.reuters.com/reuters/UKTopNews', 5000 ]
};
rssFeed.runner = {
  on: {
    'rssFeed': function (newFeeds) {
      _.each(newFeeds, function (feed) {
        console.log('%s %s', feed.pubDate.toLocaleTimeString(), feed.title);
      });
    }
  }
};

module.exports = rssFeed;
