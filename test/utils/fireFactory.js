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

var fireFactory = require('../../lib/fireFactory'),
    assert = require('assert'),
    util = require('util'),
    should = require('should') ;

var Proxy = require('node-proxy') ;

var fakeSM = function (name, expected)
{
  this.name = name ;
  this._inject = function (source, evt) {
//    util.debug(name+" Received: "+evt[0]+":"+expected) ;
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
      fire.readFile('ignite.js') ;
    },
    'f2': function () {
      var jsm = new fakeSM('f2', 'fs.readFile.done') ;
      var fireFact = fireFactory({}, fireImports2) ;
      var fire = fireFact(jsm) ;
      fire.fs.readFile('ignite.js') ;
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
      fire("readFile", 'ignite.js') ;
    },
    'fn2': function () {
      var jsm = new fakeSM('fn2', 'fs.readFile.done') ;
      var fireFact = fireFactory({}, fireImports2) ;
      var fire = fireFact(jsm) ;
      fire("fs.readFile", 'ignite.js') ;
    },
    'fn3': function () {
      var jsm = new fakeSM('fn3', 'fs.readFile.err') ;
      var fireFact = fireFactory({}, fireImports2) ;
      var fire = fireFact(jsm) ;
      fire("fs.readFile", 'doesnotexist') ;
    },

} ;
