var fireFactory = require('../../lib/fireFactory'),
    assert = require('assert'),
    util = require('util'),
    should = require('should') ;

    console.log(fireFactory) ;
var Proxy = require('node-proxy') ;

var fakeSM = function (name, expected)
{
  this.name = name ;
  this._inject = function (source, evt) {
//    util.debug(name+" Received: "+evt[0]) ;
    assert.ok(evt[0] === expected) ;
  } ;
} ;

var i ;
var fireImports1 = { readFile: require('fs').readFile } ;
var fireImports2 = { fs: require('fs'), process: process } ;

module.exports = {
    'f1': function () {
      var jsm = new fakeSM('f1', 'readFile.done') ;
      var fireFact = fireFactory({}, fireImports1) ;

      var fire = fireFact(jsm) ;
      fire.readFile('index.js') ;
    },
    'f2': function () {
      var jsm = new fakeSM('f2', 'fs.readFile.done') ;
      var fireFact = fireFactory({}, fireImports2) ;
      var fire = fireFact(jsm) ;
      fire.fs.readFile('index.js') ;
    },
    'f3': function () {
      var jsm = new fakeSM('f3', 'fs.readFile.err') ;
      var fireFact = fireFactory({}, fireImports2) ;
      var fire = fireFact(jsm) ;
      fire.fs.readFile('doesnotexist') ;
    },
    'fn1': function () {
      var jsm = new fakeSM('fn1', 'readFile.done') ;
      var fireFact = fireFactory({}, fireImports1) ;

      var fire = fireFact(jsm) ;
      fire("readFile", 'index.js') ;
    },
    'fn2': function () {
      var jsm = new fakeSM('fn2', 'fs.readFile.done') ;
      var fireFact = fireFactory({}, fireImports2) ;
      var fire = fireFact(jsm) ;
      fire("fs.readFile", 'index.js') ;
    },
    'fn3': function () {
      var jsm = new fakeSM('fn3', 'fs.readFile.err') ;
      var fireFact = fireFactory({}, fireImports2) ;
      var fire = fireFact(jsm) ;
      fire("fs.readFile", 'doesnotexist') ;
    },

} ;