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

var _ = require('underscore') ;

var util = require('util') ;

function DeferList (jsm) {
  this.jsm = jsm ;
  this.list = [] ;
  this.pos = 0 ;
  this.running = false ;
}


DeferList.prototype.append = function (source, evtarray, argshift) {
  var event ;
  
//  util.debug("defer append: "+util.inspect(evtarray)+" "+util.inspect(source)) ;
  // Don't defer already deferred events:
  if (source && source.deferred) {
    return false ;
  }
  
  // Remove unique name
  event = evtarray[0] ;
  evtarray[0] = event.split(':')[0] ;
  
  source = {} ;
  source.deferred = true ;
  this.list.push({ source: source, evtarray: evtarray, argshift: argshift }) ;
  return true ;
} ;

DeferList.prototype.run = function (curState) {
  var deferred ;
  // Escape now if we are calling this function if we have called
  // this function iteratively or there is nothing to do.
  if ((!this.list.length) || this.running) {
    return ;
  }
//  util.debug("defer run ("+curState+"): "+util.inspect(this.list)+"@"+this.pos) ;
  if (this.jsm.uniquename !== curState) {
    this.pos = 0 ;
    curState = this.jsm.stateName ;
  }
  this.running = true ;
  while (this.pos < this.list.length) {
    if (this.jsm.uniquename !== curState) {
      this.pos = 0 ;
      curState = this.jsm.stateName ;
    }
    
    deferred = this.list[this.pos] ;

    if (this.jsm._inject(deferred.source, deferred.evtarray, deferred.argshift)) {
      this.list.splice(this.pos, 1) ;
    } else {
      this.pos += 1 ;
    }
  }
  this.running = false ;
} ;

module.exports.DeferList = DeferList ;