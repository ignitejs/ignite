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

var igniteTest = require('../../ignite').test.igniteTest,
    _ = require('underscore') ;

var t = new igniteTest(module) ;

function defaults0 (fire) {
  this.states = {
      "0": {
        "entry": function () {
          return "1" ;
        },

        "error": ["error.1", "error.2"],
        "defer": ["defer.1", "defer.2", "defer.3"],
        "ignore": ["ignore.1", "ignore.2", "ignore.3", "ignore.4"]
      },
      "1": {
        "entry": function () {
          return "@exit" ;
        }
      }
  } ;
  
  this.defaults = {
      "actions": {
      },
      "error": ["deferror.1"],
      "ignore": ["defignore.1", "defignore.2", "defignore.3"],
      "defer": ["defdefer.1", "defdefer.2"]
  } ;
  
  return "0" ;
}
t.regSM(defaults0);

t.expressoAdd("defaults0 expansion", function (beforeExit, factory) {
  var skeleton = factory.createSkeleton(), 
        defaults = skeleton.defaults,
        state0 = skeleton.states["0"],
        state1 = skeleton.states["1"],
        as = state0.actions ;
  
  _.each(state0.error, function (evt) {
    assert.eql(as[evt], "@error") ;
  }) ;
  _.each(state0.defer, function (evt) {
    assert.eql(as[evt], "@defer") ;
  }) ;
  _.each(state0.ignore, function (evt) {
    assert.eql(as[evt], "@ignore") ;
  }) ;
  _.each(defaults.error, function (evt) {
    assert.eql(as[evt], "@error") ;
  }) ;
  _.each(defaults.defer, function (evt) {
    assert.eql(as[evt], "@defer") ;
  }) ;
  _.each(defaults.ignore, function (evt) {
    assert.eql(as[evt], "@ignore") ;
  }) ;
  
  as = state1.actions ;
  _.each(state0.error, function (evt) {
    assert.isUndefined(as[evt]) ;
  }) ;
  _.each(state0.defer, function (evt) {
    assert.isUndefined(as[evt]) ;
  }) ;
  _.each(state0.ignore, function (evt) {
    assert.isUndefined(as[evt]) ;
  }) ;
  _.each(defaults.error, function (evt) {
    assert.eql(as[evt], "@error") ;
  }) ;
  _.each(defaults.defer, function (evt) {
    assert.eql(as[evt], "@defer") ;
  }) ;
  _.each(defaults.ignore, function (evt) {
    assert.eql(as[evt], "@ignore") ;
  }) ;
}) ;

t.expressoAddRun("defaults0 run") ;



