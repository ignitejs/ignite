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

var request = require('request'),
    xml2js = require('xml2js');

var base_url = 'http://weather.yahooapis.com/forecastrss',
    x2js = new xml2js.Parser(), api = {};

/**
 * @see http://developer.yahoo.com/weather/
 * 
 * @param {{w: number, u=: 'f'|'c'}} options 
 *   w: WOEID,
 *   u: Units for temperature (case sensitive)
 *     f: Fahrenheit
 *     c: Celsius
 * @param {Function(err: Object, data: YahooWeather)} callback
 */
api.request = function(options, callback) {
  var url = base_url + '?w=' + options.w;
  if('u' in options) {
    url += '&u=' + options.u;
  }

  request({ uri: url }, function(err, response, body) {
    if (err) {
      callback(err);
    } else {
      x2js.once('end', function(xml) {
        callback(null, new YahooWeather(xml));
      });
      x2js.parseString(body);
    }
  });
};

api.majorCities = [
 44418, 615702, 55884293, 2151330, 
 1118370, 2295411, 772866, 2459115, 
 753692, 2505016, 1132599, 455827, 
 1047378, 2211096, 2344116, 55887336, 
 2151849, 1225448, 2295019, 2165352
];

/**
 * @constructor
 * 
 * @param xml
 * @returns {YahooWeather} 
 */
var YahooWeather = function(xml) {
  this.xml = xml;
  this.channel = xml.channel;
};
YahooWeather.prototype.__defineGetter__('description', function() { 
  return this.channel.description; });
YahooWeather.prototype.__defineGetter__('location', function() { 
  return this.channel['yweather:location']['@']; });
YahooWeather.prototype.__defineGetter__('units', function() { 
  return this.channel['yweather:units']['@']; });
YahooWeather.prototype.__defineGetter__('wind', function() { 
  return this.channel['yweather:wind']['@']; });
YahooWeather.prototype.__defineGetter__('atmosphere', function() { 
  return this.channel['yweather:atmosphere']['@']; });
YahooWeather.prototype.__defineGetter__('astronomy', function() { 
  return this.channel['yweather:astronomy']['@']; });
YahooWeather.prototype.__defineGetter__('condition', function() { 
  return this.channel.item['yweather:condition']['@']; });

YahooWeather.prototype.toString = function() {
  return this.location.city + ', ' 
       + this.location.country + ': '
       + this.condition.temp 
       + this.units.temperature + ' ' 
       + this.condition.text;
};

module.exports = api;
