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

var Factory = require('../Factory'),
    path = require('path'), 
    util = require('util'),
    assert = require('assert'),
    _ = require('underscore') ;

process.setMaxListeners(100) ;

function _consecutiveStates(stateList) {
  var states = {}, state, count = 0 ;
  for (count=0; count<stateList.length; count+=1) {
    state = stateList[count] ;
    states[count.toString()] = state ;
    state.nextState = (count+1).toString() ;
  }
  states[count.toString()] = {
      entry: function () {
        return "@exit" ;
      }
  } ;
  
  return states ;
}

function igniteTest (testModule) {
  this.name = path.basename(testModule.id, '.js') ;
  this.exports = testModule.exports ;
  this.jsmFactories = {} ;
  this.counts = {} ;
}

igniteTest.prototype.regSM = function (origDesc, imports, options, smName) {
  var smDesc = origDesc, factory ;
  imports = imports || {} ;
  options = options || {} ;
  
  if (!('strict' in options)) {
    options.strict = true ;
  }

  if (!('logLevel' in options)) {
    if ('IGNITE_TEST_LOGLEVEL' in process.env) {
      options.logLevel = parseInt(process.env.IGNITE_TEST_LOGLEVEL, 10) ;
    } else {
      options.logLevel = 0 ;
    }
  }
  
  if (_.isArray(smDesc)) {
    smDesc = function (fire) {
      this.states = _consecutiveStates(origDesc) ;
      return "0" ;
    } ;
    smDesc.smName = this.name ;
    smName = this.name ;
    smDesc.defaults = { imports: imports, options: options } ;
  }
  
  factory = new Factory(smDesc, imports, options) ;
  
  if (!smName) {
    smName = factory.name ;
  }
  this.options = options ;
  this.jsmFactories[smName] = factory ;
} ;

igniteTest.prototype.expressoAdd = function (testName, test) {
  var that = this, smName;

  smName = (testName.split(' '))[0] ;

  assert.isUndefined(this.exports[testName], "Test '"+testName+"' already exists.") ;
  this.exports[testName] = function (beforeExit) {
    var factory = that.jsmFactories[smName] ;
    
    test(beforeExit, factory) ;
  } ;
} ;

igniteTest.prototype.expressoAddRun = function (testName, inArgs, expectedDoneType, expectedResults) {
  var that = this, smName ;
  
  smName = (testName.split(' '))[0] ;
  inArgs = inArgs || [] ;
  expectedDoneType = expectedDoneType || "exit" ;
  
  this.expressoAdd(testName, function (beforeExit) {
    var factory = that.jsmFactories[smName], jsm, doneType=null, results ;
    
    assert.isDefined(factory, "Factory "+smName+" is not defined.") ;
    
    jsm = factory.spawn.apply(factory, inArgs) ;
    
    jsm.once('exit', function () {
      doneType = 'exit' ;
      results = Array.prototype.slice.call(arguments, 0) ;
    }) ;
    jsm.once('error', function () {
      doneType = 'error' ;
      results = Array.prototype.slice.call(arguments, 0) ;
    }) ;
    
    beforeExit(function () {
      assert.isNotNull(doneType, "State Machine has not exited.") ;
      assert.ok(doneType === expectedDoneType, "Incorrect exit state. Expected: "+expectedDoneType+", got: "+doneType) ;
    }) ;
    return jsm ;
  }) ;
} ;

igniteTest.prototype.inject = function (name) {
  if (typeof name === "string") {
    name = [name] ;
  }
  return function () {
    this._futureInject(null, name) ;
  } ;
} ;

igniteTest.prototype.asyncTest = function (testFn, maxTimeout)
{
  if (typeof maxTimeout !== "number") {
    maxTimeout = 1000 ;
  }
  return function () {
    var to = Math.round((Math.random() * maxTimeout)) ;
    var args = Array.prototype.slice.call(arguments, 0) ;
    var cb = args.pop() ;
    setTimeout(function () {
      cb(testFn.apply(null, args)) ;
    }, to) ;
  } ;
} ;

igniteTest.prototype.log = function ()
{
  if (this.options.logLevel) {
    console.log.apply(null, arguments) ;
  }
} ;

module.exports.igniteTest = igniteTest ;