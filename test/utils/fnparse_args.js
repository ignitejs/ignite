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

var test_FnParse_args = function (fn, args)
{
  var fp = new FnParse(fn), fpargs, i, c, fpc ;
  fpargs = fp.getArgs() ;
  
  assert.ok(args.length == fpargs.length) ;
  
  for (i in args) {
    assert.ok(fpargs.indexOf(args[i])>=0) ;
  }
  for (i in fpargs) {
    assert.ok(args.indexOf(fpargs[i])>=0) ;
  }   
} ;

module.exports = {
    'f1': function () {
      var fp = test_FnParse_args(function () {
      }, []) ;
    },
    'f2': function () {
      var fp = test_FnParse_args(function (a) {
      }, ["a"]) ;
    },
    'f3': function () {
      var fp = test_FnParse_args(function (a, b) {
      }, ["a", "b"]) ;
    },
    'f4': function () {
      var fp = test_FnParse_args(function (a, b, c) {
      }, ["a", "b", "c"]) ;
    },
    'f5': function () {
      var fp = test_FnParse_args(function (a, b, c, d) {
      }, ["a", "b", "c", "d"]) ;
    },
    'f6': function () {
      var fp = test_FnParse_args(function (arg0, arg1) {
      }, ["arg0", "arg1"]) ;
    },
} ;
