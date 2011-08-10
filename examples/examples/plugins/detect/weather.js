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
