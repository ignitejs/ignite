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

var util = require('util'),
    igniteUtils = require('./igniteUtils'),
    _ = require('underscore'),
    EachEmitter = require('./EachEmitter') ;

module.exports.EachEmitter = EachEmitter ;

function arrayEachEmitter (name, defarray) {
  var piObj = this.state[name], array, ee ;
  
  if (piObj.over) {
    if (typeof piObj.over === "function") {
      array = piObj.over.apply(this, this.args) ;
    } else {
      array = piObj.over ;
    }
  } else {
    array = defarray ;
  }
          
  ee = new EachEmitter(array, piObj.fn, piObj) ;
  
  this.fire.$regEmitter("_each", ee) ;
 
  return { ee: ee, array: array, src: { type: "plugin", name: name, meta: {}} } ;
}

module.exports.arrayEachEmitter = arrayEachEmitter ;

function convertToObj (sm, statename, state, piName, defaults) {
  defaults = defaults || {} ;
//  console.log(piName, ":", typeof state[piName]) ;
  if (typeof state[piName] === "function" || 
      typeof state[piName] === "string") {
    // Assume that this should be set as 'fn' within the object
    var obj = _.clone(defaults) ;
    
    obj.fn = state[piName] ;
    state[piName] = obj ;
  } else {
    throw sm._error("Bad property for plugin '"+piName+"'.", statename) ;
  }
}

module.exports.convertToObj = convertToObj ;


function strtofn (sm, statename, state, piName) {
  var piObj = state[piName], splitname ;
  if (typeof piObj.fn === "string") {
    piObj._fn = piObj.fn ;
    splitname = piObj.fn.split('.') ;
    piObj._fnname = splitname.pop() ;
    piObj._fnmodule = splitname.join('.') ;
    piObj.fn = igniteUtils.findFn(sm.jsmFactory.imports, piObj._fn) ;
  }
  
  if (typeof piObj.fn !== "function") {
    throw sm._error("Bad asynchronous function for '"+piName+"' plugin.", statename) ;
  }
}

module.exports.strtofn = strtofn ;