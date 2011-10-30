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
// In this example the ignite.js framework is used to build a simple 
// web scraper. The scraper grabs information about the latest top 
// 10 movies from the [IMDb](http://www.imdb.com) website.
//
// The machine starts in the `LoadChart` state. This states makes 
// an initial HTTP request to a IMDb website page containing a chart 
// of top movies. When a response from this request is received the 
// machine moves to the `BoxOfficeSummary` state.
//
// The `BoxOfficeSummary` state uses the 
// [jquery](http://search.npmjs.org/#/jquery) library to parse the HTML 
// page data. Information from the summary table found in the `#boxoffice` 
// div tag is extracted and then stored in the `boxOffice` array. This 
// information includes a URL to a dedicated page for each of the 
// movies in the table.
//
// Finally the machine moves to the `MovieDetails` state. This state 
// uses the [`each`][EACH] plugin to make a HTTP request to each of the 
// dedicated movie pages. Again, `jquery` is used to extract information 
// (the `div.infobar` tag) from each returned page. When all pages have 
// been scraped the machine exits, setting the `boxOffice` array as the 
// final [transition argument][TA], the contents of which are printed by
// the callback function defined in the [`defaults`][FD] object.
//
// Example Output:
// $ ./bin/ignite examples/web_scraper.js
// Running examples/web_scraper.js
// run: examples/web_scraper.js Exited with no error.
// 1  Captain America: The First Avenger: $65.1M $65.1M
//    124 min  -  Action | Adventure | Sci-Fi  -  29 July 2011(UK)
// 2  Harry Potter and the Deathly Hallows: Part 2: $47.4M $274M
//    130 min  -  Adventure | Drama | Fantasy  -  15 July 2011(UK)
// 3  Friends with Benefits: $18.6M $18.6M
//    109 min  -  Comedy | Romance  -  9 September 2011(UK)
// 4  Transformers: Dark of the Moon: $12.1M $326M
//    157 min  -  Action | Adventure | Sci-Fi  -  29 June 2011(UK)
// 5  Horrible Bosses: $11.9M $82.6M
//    98 min  -  Comedy | Crime  -  22 July 2011(UK)
// 6  Zookeeper: $8.7M $59.2M
//    102 min  -  Comedy | Family | Romance  -  29 July 2011(UK)
// 7  Cars 2: $5.66M $176M
//    106 min  -  Animation | Adventure | Comedy  -  22 July 2011(UK)
// 8  Winnie the Pooh: $5.16M $17.6M
//    63 min  -  Animation | Family  -  15 April 2011(UK)
// 9  Bad Teacher: $2.61M $94.4M
//    92 min  -  Comedy  -  17 June 2011(UK)
// 10 Midnight in Paris: $1.8M $44.8M
//    94 min  -  Comedy | Fantasy | Romance  -  10 June 2011(USA)
// $ _
//

var $ = require('jquery'),
    _ = require('underscore.string');

function webScraper (fire, baseUrl) {
  var boxOffice = [];

  this.startState = 'LoadChart';
  this.states = {
    LoadChart: {
      async: {
        fn: 'request',
        fnArgs: [ { uri: baseUrl + '/chart/' } ]
      },
      actions: {
        '.done': 'BoxOfficeSummary'
      }
    },

    BoxOfficeSummary: {
      work: function (response, body) {
        var td, a;
        $($(body).find('#main table')[0])
                 .find('[class^="chart"]').each(function (i, tr) {
          if (i > 0) {
            td = $(tr).find('td');
            a  = $(tr).find('a');
            boxOffice.push({
              title:   a.text().trim(),
              weekend: $(td[3]).text().trim(),
              gross:   $(td[4]).text().trim(),
              href:    a.attr('href')
            });              
          }
        });
        return 'done';
      },
      actions: {
        '.done': 'MovieDetails'
      }
    },

    MovieDetails: {
      each: {
        fn:  'request',
        fnArgs: function (i) {
          return { uri: baseUrl + i.href };
        },        
        iterator: function (i, err, response, body) {
          if (!err) {
            boxOffice[i].infobar = $(body).find('div.infobar').text().trim();
          }
        },
        over: boxOffice,
        par: 8
      },
      actions: {
        '.done': ['@exit', boxOffice]
      }
    }
  };

  this.defaults = {
    actions: {
      '.err':  '@error'
    }
  };
};

webScraper.defaults = {
  imports: { 
    request: require('request') 
  },
  args: [ 'http://www.imdb.com' ],
  callback: function (err, transArgs) {
    var i, movie;
    for (i in transArgs) {
      movie = transArgs[i];
      console.log('%s%s: %s %s\n   %s',
        _.rpad(String(++i), 3, ' '),
        movie.title,
        movie.weekend,
        movie.gross,
        movie.infobar.replace(/\n/g, ''));
    }
  }
};

module.exports = webScraper;
