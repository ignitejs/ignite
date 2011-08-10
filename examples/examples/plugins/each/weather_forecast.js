//
// This example queries the [Yahoo! Weather RSS feed](http://developer.yahoo.com/weather/) 
// for each location in a list of major cities, displaying 
// the returned weather conditions. The `each` Plug-In is used to 
// perform the RSS request for each city in the list.
//
// The state machine has a single state, `MajorCityWeather`. This 
// state uses the [each][EACH] Plug-In to iterate over a list of WOEID 
// ([Where On Earth ID](http://developer.yahoo.com/geo/geoplanet/guide/concepts.html)) 
// codes representing the city locations. At each iteration the `request` 
// function from the `weather_yahooapis` module is called. This 
// function expects an object containing `w` and `c` parameters 
// as its argument. This object is created at each iteration by 
// the [`fnArgs`][EACH_FNARGS] function.
//
// When a response from any of the RSS requests is received the 
// [`iterator`][EACH_ITR] function is called with the returned 
// data. This data is simply dumped to the console. The 
// [`par`][EACH_PAR] parameter is used to set the maximum number 
// of requests made in parallel, in this case 6.
//
// Example Output:
// $ ignite examples/plugins/each/weather_yahooapis.js
// Running examples/plugins/each/weather_forecast.js
// London, United Kingdom: 18C Partly Cloudy
// Paris, France: 20C Mostly Cloudy
// Mosco, Mexico: 16C Mostly Cloudy
// Beijing, China: 26C Fair
// Tokyo, Japan: 29C Mostly Cloudy
// Mumbai, India: 31C Haze
// San Fransisco, Spain: 27C Partly Cloudy
// New York, United States: 23C Partly Cloudy
// Barcelona, Spain: 27C Partly Cloudy
// Texas, United States: 21C Fair
// Seoul, South Korea: 27C Cloudy
// Sao Paulo, Brazil: 11C Fair
// Jakarta, Indonesia: 29C Partly Cloudy
// Karachi, Pakistan: 33C Mostly Cloudy
// Istanbul, Turkey: 28C Partly Cloudy
// Mexico, Mexico: 16C Mostly Cloudy
// Shanghai, China: 30C Mostly Cloudy
// Bangkok, Thailand: 31C Light Rain
// New Delhi, India: 31C Fog
// Hong Kong, Hong Kong: 33C Partly Cloudy
// run: examples/plugins/each/weather_forecast.js Exited with no error.
// $ _
//

var yahooapis = require('../../weather_yahooapis');

function weatherForecast (fire, woeidArray) {
  this.startState = 'MajorCityWeather';
  this.states = {
    MajorCityWeather: {
      each: {
        fn: 'request',
        fnArgs: function (woied) {
          return { 'w': woied, 'u': 'c' };
        },        
        iterator: function (itr, err, data) {
          if (err) {
            console.error(err);
          } else {
            console.log('%s', data);
          }
        },
        par: 6
      },
      actions: {
        '.done': '@exit'
      }
    }
  };
};

weatherForecast.defaults = {
  imports: { request: yahooapis.request },
  args: [ yahooapis.majorCities ]
};

module.exports = weatherForecast;
