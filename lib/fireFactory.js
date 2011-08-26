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

var Proxy = require("node-proxy"),
    _ = require("underscore"), 
    util = require("util") ; 

function curryAsync (name, origObj, fnname, jsm)
{
  var orig = (fnname) ? origObj[fnname] : origObj;
  return function () {
    var retfn, cb ;
    var args = Array.prototype.slice.call(arguments, 0) ;
    cb = function (err) {
      var cbargs = Array.prototype.slice.call(arguments, 0), 
            evtname = name+".done",
            argshift ;

      if (err) {
        evtname = name+".err" ;
      } else {
        argshift = [1] ;
      }
      if (jsm.uniquename) {
        evtname = evtname + ":" + jsm.uniquename ;
      }
      cbargs.push(args) ;
      cbargs.unshift(evtname) ;
      jsm._inject(null, cbargs, argshift) ;
    } ;
    retfn = orig.apply(origObj, args.concat(cb)) || {};
    retfn.done = function (action) {
      util.debug("fire.fn.done() called") ;
      jsm.state.actions[name+".done"] = action ;
    } ;
    retfn.err = function (action) {
      util.debug("fire.fn.err() called") ;
      jsm.state.actions[name+".err"] = action ;
    } ;
    return retfn ;
  } ;
}

function fireFactory (jsmfactory, spmethods)
{
  spmethods = spmethods || {} ;
  
  var FireHandler = function (obj, jsm, prev) {
    var cache = {} ;
    prev = (prev) ? (prev+".") : "";
    this.obj = obj ;
    this.jsm = jsm ;
    
    this.call = function (fnname) {
      var splitname, orig, curried, args = Array.prototype.slice.call(arguments, 1) ;
      splitname = fnname.split('.') ;
      orig = obj ;
      while (orig && splitname.length) {
        orig = orig[splitname.shift()] ;
      }
      if (!orig) {
        throw new Error("Function "+fnname+" not in State Machine library.") ;
      }
      if (!(typeof orig === "function")) {
        throw new Error("Calling fire with "+fnname+" which is not a function.") ;
      }
      curried = curryAsync(fnname, orig, null, jsm) ;
      return curried.apply(jsm, args) ;
    } ;
    this.get = function (receiver, name) {
      var ret;

      if (!((name in obj)||(name in spmethods))) {
        return undefined ;
      }
      if (cache[name]) {
        return cache[name] ;
      }
      if (name in obj) {
        if (typeof obj[name] === "function") {
          ret = curryAsync(prev+name, obj, name, jsm) ;
        } else if (typeof obj[name] === "object") {
          // TODO: Fix arrays - at the moment a method hiding in an
          // array is not curried.
          if (_.isArray(obj[name])) {
            return obj[name] ;
          }
          ret = Proxy.create(new FireHandler(obj[name], jsm, prev+name)) ;
        } else {
          ret = obj[name] ;
        }
        cache[name] = ret ;
        return ret ;
      } else {
        return spmethods[name].bind(jsm);
      }
    } ;
  } ;
  _.extend(FireHandler.prototype, {
      getOwnPropertyDescriptor: function(name) {
        // TODO: Fix value returned in descriptor
        var desc = Object.getOwnPropertyDescriptor(this.obj, name) ;
        return desc;
      },
      getOwnPropertyNames: function() {
        var names = Object.getOwnPropertyNames(this.obj) ;
        return names ;
      },
      defineProperty: function(name, propertyDescriptor) {
        Object.defineProperty(this.obj, name, propertyDescriptor) ;
      },
      "delete": function(name) {
        util.debug("fire delete: "+name) ;
        return delete this.obj.name ;
      },
      fix: function() { 
        if (Object.isFrozen(this.obj)) {
          return Object.getOwnPropertyNames(this.obj).map(function(name) {          

            return Object.getOwnPropertyDescriptor(this.obj, name);
          });
        }
        // As long as this.obj is not frozen, the proxy won't allow itself to be fixed
        return undefined; // will cause a TypeError to be thrown
      },
      set: function(receiver, name, val) {
        this.obj.name = val ;
        return true ;
      }
    }) ;
  FireHandler.prototype.getPropertyNames = FireHandler.prototype.getOwnPropertyNames ;
  FireHandler.prototype.getPropertyDescriptor = FireHandler.prototype.getOwnPropertyDescriptor ;
  
  return function (jsm) {
    var handler = new FireHandler(jsm.library, jsm) ;
    return Proxy.createFunction(handler, handler.call) ;
  } ;
} ;

module.exports = fireFactory ;