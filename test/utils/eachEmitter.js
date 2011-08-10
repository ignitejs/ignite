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

var EachEmitter = require('../../lib/utils/EachEmitter'),
    path = require('path'),
    util = require('util'),
    fs = require('fs') ;

module.exports = {
    'ee1': function () {
      var dirlist = fs.readdirSync('.') ;
      
      var ee = new EachEmitter(dirlist, fs.stat) ;
      ee.on('done', function (pos, arg, err, stat) {
        util.debug('done: '+pos) ; //+' '+util.inspect(stat)) ;
      }) ;
      ee.on('alldone', function (length) {
        util.debug('alldone: '+length) ;
      });
      ee.launch() ;
    },
    'ee2': function () {
      var dir = 'lib' ;
      var dirlist = fs.readdirSync(dir) ;
      
      var ee = new EachEmitter(dirlist, fs.stat, {
        argfn: function (p) {
          return [path.join(dir, p)] ;
        }
      }) ;
      ee.on('done', function (pos, arg, err, stat) {
        util.debug('done: '+pos+' '+arg[0]) ; //+' '+util.inspect(stat)) ;
      }) ;
      ee.on('alldone', function (length) {
        util.debug('alldone: '+length) ;
      });
      ee.launch() ;
    }
} ;