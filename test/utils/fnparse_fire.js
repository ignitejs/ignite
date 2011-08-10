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

var FnParse = require('../../lib/utils/FnParse'),
    assert = require('assert'),
    util = require('util'),
    should = require('should') ;

var test_FnParse_fire = function (fn, calls)
{
  var fp = new FnParse(fn), fpcalls, i, c, fpc ;
  fpcalls = fp.getCalls() ;
  
  assert.ok(calls.length == fpcalls.length) ;
  
  for (i=0;i<calls.length;i++) {
    c = calls[i] ;
    fpc = fpcalls[i] ;
    
    assert.ok(c.fn === fpc.fn) ;
    assert.ok(c.args.length === fpc.args.length) ;
    for (a=0;a<c.args.length;a++) {
      assert.ok(c.args[a] === fpc.args[a]) ;
    }
  }
} ;

module.exports = {
    'f1': function () {
      var fp = test_FnParse_fire(function (fire, path) {
        fire.fs.readFile(path);
      }, [{fn: "fire.fs.readFile", args: ["path"]}]) ;
    },
    'f2': function () {
      var fp = test_FnParse_fire(function (fire, path) {
        fire.
          fs.
            readFile(path);
      }, [{fn: "fire.fs.readFile", args: ["path"]}]) ;
    },
    'f3': function () {
      var fp = test_FnParse_fire(function (fire, path) {
        fire.
          fs.
            readFile(path);
      }, [{fn: "fire.fs.readFile", args: ["path"]}]) ;
    },
    'f4': function () {
      var fp = test_FnParse_fire(function (fire, path) {
          abc(a0, a1, a2, a3, a4);
      }, [{fn: "abc", args: ["a0", "a1", "a2", "a3", "a4"]}]) ;
    },
    'f5': function () {
      var fp = test_FnParse_fire(function (fire, path) {
          abc.def(a0, a1, a2, a3, a4);
      }, [{fn: "abc.def", args: ["a0", "a1", "a2", "a3", "a4"]}]) ;
    },
    'f6': function () {
      var fp = test_FnParse_fire(function (fire, path) {
          abc.def.ghi(a0, a1, a2, a3, a4);
      }, [{fn: "abc.def.ghi", args: ["a0", "a1", "a2", "a3", "a4"]}]) ;
    },
    'f7': function () {
      var fp = test_FnParse_fire(function (fire, path) {
          (function () {})(a0+a1, a2+a3, a4);
      }, [{fn: "function(){}", args: ["a0+a1", "a2+a3", "a4"]}]) ;
    },
    'f8': function () {
      var fp = test_FnParse_fire(function (fire, path) {
          abc(a0);
          def(a0, a1);
          ghi(a0, a1, a2);
          jkl(a0, a1, a2, a3);
      }, [{fn: "abc", args: ["a0"]},
          {fn: "def", args: ["a0", "a1"]},
          {fn: "ghi", args: ["a0", "a1", "a2"]},
          {fn: "jkl", args: ["a0", "a1", "a2", "a3"]}]) ;
    },
    'f9': function () {
      var fp = test_FnParse_fire(function (fire, path) {
          abc(
              def(
                  ghi(a0, a1, a2), jkl(a0, a1, a2, a3)));
      }, [ { fn: 'abc', args: [ 'def(ghi(a0,a1,a2),jkl(a0,a1,a2,a3))' ] },
           { fn: 'def', args: [ 'ghi(a0,a1,a2)', 'jkl(a0,a1,a2,a3)' ] },
           { fn: 'ghi', args: [ 'a0', 'a1', 'a2' ] },
           { fn: 'jkl', args: [ 'a0', 'a1', 'a2', 'a3' ] } ]
    ) ;
    }
} ;
