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
// This example contains a state machine called `weather` that demonstrates 
// how to use the [detect][DETECT] Plug-In. The state machine queries the 
// [Yahoo! Weather RSS feed](http://developer.yahoo.com/weather/) for the 
// locations in a list of major cities and finds the first location with 
// weather conditions satisfying a simple temperature test criteria.
//
// The state machine has a single state, `DetectTemperature`. This state 
// uses the [detect][DETECT] Plug-In to iterate over a list of WOEID 
// ([Where On Earth ID](http://developer.yahoo.com/geo/geoplanet/guide/concepts.html)) 
// codes representing the city locations. At each iteration the 
// binary asynchronous function `aboveTemperature` is called. The 
// first city location found that is associated with a return value 
// of `true` from this function (i.e. with a temperature greater than 25C) 
// is returned.
//
// The `aboveTemperature` function is defined directly in the 
// [`imports`][IMPORTS] object (Line 29). It wraps the `yahooapis.request` 
// asynchronous function, providing it with a callback function 
// to call its own callback with `true` or `false` depending on 
// the result of the temperature test.
//
// Example Output:
// $ ignite examples/plugins/detect/weather.js
// Running examples/plugins/detect/weather.js
// woied:2151330 has temperature > 25
// run: examples/plugins/detect/weather.js Exited with no error.
// $ _
//

var yahooapis = require('../../weather_yahooapis');

function weather (fire, woeidArray, temperature) {
  this.startState = 'DetectTemperature';
  this.states = {
    DetectTemperature: {
      detect: {
        fn: 'aboveTemperature',
        fnArgs: function (woied) {
          return [temperature, { 'w': woied, 'u': 'c' }];
        },
        par: 5
      },
      actions: {
        'detect.done': function (result) {
          if (result) {
            console.log('woied:%s has temperature > %s', 
                result, temperature);
          } else {
            console.log('no woied found.');
          }
          return '@exit';
        }
      }
    }
  };
};

weather.defaults = {
  imports: {
    aboveTemperature: function (temperature, options, cb) {
      yahooapis.request(options, function (err, weather) {
        if (err) {
          cb(false);
        } else {
          cb(weather.condition.temp > temperature);
        }
      });
    }
  },
  args: [ yahooapis.majorCities, 25 ]
};

module.exports = weather;
