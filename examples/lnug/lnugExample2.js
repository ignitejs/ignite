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
// A Twitter reader example used as a more complex example during
// our [LNUG presentation][LNUGPRESENTATION]. For more details see the 
// [presentation slides][LNUGSLIDES].
// 
// Example Output:
// $ ./bin/ignite examples/lnug/lnugExample2.js
// Running examples/lnug/lnugExample2.js
// Welcome. I'm searching for: '%23LNUG'
// Completed in:  0.192
// 0: <span style="color: red;">lancestewart</span> -> <span style="color: blue;">[Everyone]</span> Img len: 900
//    '<span style="color: green;">RT @ikershaw: Looking for Node.js developers to recruit at London node.js 
//     user meetup #lnug @jlsync is here with his award winning charity hack app!</span>'
// 1: <span style="color: red;">chrisspranklen</span> -> <span style="color: blue;">[Everyone]</span> Img len: 935
//   '<span style="color: green;">The #node.js Developer would be working (12 wk contract!) for an app 
//    development company (London). anyone looking - 02032061924? #lnug #node</span>'
// 2: <span style="color: red;">teabass</span> -> <span style="color: blue;">[Everyone]</span> Img len: 3769
//    '<span style="color: green;">I always tell the #lnug google group about tickets before anyone else, 
//     if you want to ensure you get one then join http://t.co/yYMfVszj</span>'
// 3: <span style="color: red;">teabass</span> -> <span style="color: blue;">[Everyone]</span> Img len: 3769
//    '<span style="color: green;">RT @forwardtek: All the slides from #lnug on wednesday have been added 
//     to the @lanyrd page and the videos will be added next week: http://t.co/LVjtN8j2</span>'
// 4: <span style="color: red;">Erica_Bennett</span> -> <span style="color: blue;">[Everyone]</span> Img len: 1431
//    '<span style="color: green;">RT @rtweed: Cash prizes available in #GlobalsDB competition. 1st one 
//     this Saturday: http://t.co/QRdhROcP  http://t.co/UZ7raFlQ #lnug #nodejs</span>'
// 5: <span style="color: red;">rtweed</span> -> <span style="color: blue;">[Everyone]</span> Img len: 6779
//    '<span style="color: green;">Cash prizes available in #GlobalsDB competition. 1st one this 
//     Saturday: http://t.co/QRdhROcP  http://t.co/UZ7raFlQ #lnug #nodejs</span>'
// 6: <span style="color: red;">detillen</span> -> <span style="color: blue;">[Everyone]</span> Img len: 1332
//    '<span style="color: green;">And, to complete the set, here are my slides from #lnug yesterday 
//     http://t.co/06RIz7oZ - remember state machines rock!</span>'
// 7: <span style="color: red;">Cloud9IDE</span> -> <span style="color: blue;">[Everyone]</span> Img len: 3479
//    '<span style="color: green;">RT @mikedeboer: My slides from yesterday's presentation at #lnug: 
//     http://t.co/bTZha4DG Hope you'll find it useful during development!</span>'
// 8: <span style="color: red;">chrissywelsh</span> -> <span style="color: blue;">[Everyone]</span> Img len: 3236
//    '<span style="color: green;">RT @mikedeboer: My slides from yesterday's presentation at #lnug: 
//     http://t.co/bTZha4DG Hope you'll find it useful during development!</span>'
// 9: <span style="color: red;">mikedeboer</span> -> <span style="color: blue;">[Everyone]</span> Img len: 1650
//    '<span style="color: green;">My slides from yesterday's presentation at #lnug: http://t.co/bTZha4DG 
//     Hope you'll find it useful during development!</span>'
// 10: <span style="color: red;">podviaznikov</span> -> <span style="color: blue;">[Everyone]</span> Img len: 823
//    '<span style="color: green;">RT @seddonandrew: Slides from my 'massive-git' #lnug talk are up 
//     at http://t.co/iFlIbE2k</span>'
// 11: <span style="color: red;">mikedeboer</span> -> <span style="color: blue;">[Everyone]</span> Img len: 1650
//    '<span style="color: green;">Back in #AMS from a great #lnug in London. Thanks for having me 
//     guys! Met a lot of talented people. Slides of my talk will be online soon!</span>'
// 12: <span style="color: red;">seddonandrew</span> -> <span style="color: blue;">bjnortier</span> Img len: 4127
//    '<span style="color: green;">@bjnortier haha thanks. I name dropped @shapesmith at #lnug last 
//     night so hopefully you'll get some people checking it out :-)</span>'
// 13: <span style="color: red;">patrickhamann</span> -> <span style="color: blue;">[Everyone]</span> Img len: 4726
//    '<span style="color: green;">RT @seddonandrew: Slides from my 'massive-git' #lnug talk are 
//     up at http://t.co/iFlIbE2k</span>'
// 14: <span style="color: red;">teabass</span> -> <span style="color: blue;">[Everyone]</span> Img len: 3769
//    '<span style="color: green;">RT @seddonandrew: Slides from my 'massive-git' #lnug talk are 
//     up at http://t.co/iFlIbE2k</span>'
// <br> Language counts:
//   en: 15
// run: examples/lnug/lnugExample2.js Exited with no error.
//

var _ = require('underscore') ;
var colors = require('colors') ;

function lnugExample (fire, name) {
  // Closure: local variables are available across states:
  var languages = {} ;
  
  return {
    startState: "Welcome",
    
    states: {
      
      "Welcome": {
        entry: function () {
          console.log("Welcome. I'm searching for: '%s'", name) ;
          return "GetTweets" ;
        }
      },
      
      "GetTweets": {
        entry: function () {
          fire.request("http://search.twitter.com/search.json?"+
                    "q="+name+
                    "&result_type=mixed") ;
        },
        timeout: 2000,
        actions: {
          "request.err": "@error",
          "request.done": "HandleResult",
          "timeout": function () {
            console.log("Sorry, but Twitter are taking a long time to reply.") ;
            return "@exit" ;
          }
        }
      },
      
      "HandleResult": {
        entry: function (response, body) {
          body = JSON.parse(body) ;
          console.log("Completed in: ", body.completed_in) ;
          _.each(body.results, function (result) {
            languages[result.iso_language_code] = 
              (languages[result.iso_language_code] || 0) + 1 ;
          }) ;
          if (body.results.length) {
            return ["GetProfileImages", body.results] ;
          } else {
            return "@exit" ;
          }
        }
      },
      
      "GetProfileImages": {
        map: {
          fn: "request.get",
          fnArgs: function (result) {
            return { url: result.profile_image_url } ;
          },
          iterator: function (response, body) {
            return body.toString() ;
          }
        },
        actions: {
          "map.done": function (images, results, errors) {
            _.each(results, function (result, index) {
              var image = errors[index] ? "" : images[index] ;
              var fromTo = result.from_user.bold.red + " -> " ;
              fromTo += (result.to_user ? result.to_user : 
                "<span style=\"color: blue;\">[Everyone]</span>").blue ;
              console.log("%d: %s Img len: %d\n   '%s'", 
                index, fromTo, image.length, result.text.green) ;
            }) ;
            return "DumpLanguages" ;
          }
        }
      },
      
      "DumpLanguages": {
        entry: function () {
          console.log("\nLanguage counts:") ;
          _.each(languages, function (count, lang) {
            console.log("  %s: %d", lang, count) ;
          }) ;
          return "@exit" ;
        }
      }
    }
  } ;
}

lnugExample.defaults = {
  imports: { 
    request: require('request')
  },
  args: [ '%23LNUG' ]
};

module.exports = lnugExample;
