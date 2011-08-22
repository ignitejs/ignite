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

/*jslint nodejs: true */
var EventEmitter = require('events').EventEmitter,
    util = require('util');

function jsmExtReg (jsm, emitter, source) {
  // Additional handling for EachEmitters
  emitter.on("_fire", function (pos, args) {
    jsm.emit("ext", jsm, source, "fire: "+pos+":"+JSON.stringify(args)) ;
  }) ;
  emitter.on("_done", function (pos) {
    jsm.emit("ext", jsm, source, "done:"+pos) ;
  }) ;
  emitter.on("_alldone", function () {
    jsm.emit("ext", jsm, source, "alldone") ;
  }) ;
}

function EachEmitter(array, fn, options) {
  var that = this, outpos = 0, inpos = 0, length, err;
  options = options || {};

  // Store this, so we don't have big problems
  // if it is changed under us
  length = array.length ;
  this.length = length ;
  
  // added to allow the user to ask the each emitter to stop
  this.stop = function() { 
    length = outpos; 
  };

  this.par = options.par || 4 ;
  
  this._meta = {
      type: "EachEmitter",
      name: options.fnname,
      module: options.fnmodule,
      par: this.par,
      dynamic: {},
      quiet: true,
//      jsmext: {
//        "reg": jsmExtReg
//      }
  } ;
  this._dynamic = this._meta.dynamic ;
  
  this.alldone = function () {
    that.emit('_alldone', length, array) ;
    that.removeAllListeners() ;
  } ;
  
  this.fire = function (slot) {
    var cb, arglist ;
    if (options.fnArgs) {
      arglist = options.fnArgs(array[outpos], outpos);
      // check the user has returned an array of arguments, if
      // not make one.
      if (!(arglist instanceof Array)) {
        arglist = [ arglist ];
      }
    } else {
      arglist = [ array[outpos] ];
    }
    
    cb = (function (pos) {
      return function () {
        var args = Array.prototype.slice.call(arguments, 0) ; 
        inpos += 1 ;
        that._dynamic.inpos = pos ;
        that._dynamic.slot = slot ;
        args = ['_done', pos, arglist].concat(args) ;
        that.emit.apply(that, args) ;

        if (inpos === length) {
          that.alldone();
        }
        if (outpos < length) {
          that.fire(slot) ;
        }
      };
    }(outpos));
    outpos += 1;

    that._dynamic.outpos = outpos ;
    that._dynamic.slot = slot ;
    this.emit('_fire', outpos, arglist) ;
    try {
      fn.apply(this, arglist.concat(cb)) ;
    } catch (err) {
      process.nextTick(function () {
        cb(err);
      }) ;
    }
  };
}

util.inherits(EachEmitter, EventEmitter);

EachEmitter.prototype.start = function(par) {
  var i;

  if (this.length === 0) {
    this.alldone();
    return ;
  }

  par = par || this.par;
  par = (par > this.length) ? this.length : par;

  for (i = 0; i < par; i++) {
    this.fire(i);
  }
};

EachEmitter.prototype.launch = function() {
  var that = this;
  process.nextTick(function() {
    that.start();
  });
};

EachEmitter.color = "aquamarine4" ;
EachEmitter.graph = function (statev, state, sname, piname) {
  var attr = statev.attributes ;
  attr.stereotypes.push(piname) ;
  statev.hints.fillcolor = EachEmitter.color ;
  attr.entry.hidden = true ;
} ;
EachEmitter.stdFnList = ["fn", "fnArgs", "iterator"] ;

module.exports = EachEmitter;