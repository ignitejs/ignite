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

var _ = require("underscore"),
    util = require("util") ;

function SubPlugin (piApi, name) {
  var Factory = require("../../../Factory") ;
  
  piApi.registerStatePI(name, {
   "initState": function (statename, state) {
     var piObj = state[name] ;
     var options, imports ;     
     if (typeof piObj !== "object") {
       piObj = state[name] = {
           factory: state[name]
       } ;
     }

     options = piObj.options || {} ;
     imports = piObj.imports || {} ;

     if (typeof piObj.factory === "function") {
       _.defaults(options, this.jsmFactory.options) ;
       _.defaults(imports, this.jsmFactory.imports) ;
       
       if (!options.name) {
         options.name = this.jsmFactory.name + ":" + statename ;
       }
       piObj.factory = new Factory(piObj.factory, 
             imports,
             options) ;
     } else if (piObj.factory instanceof Factory) {
       ;
     } else {
       state.entry = function () {
         throw this._error("Sub states need a factory.") ;
       } ;
     }
   },
   "state": {
     "entry": function () {
       var jsm, args = this.args, state = this.state, piObj = state[name] ;
       
       if (piObj.smArgs) {
         if (typeof piObj.smArgs === "function") {
           args = piObj.smArgs.apply(this, this.args) ;
         } else {
           args = piObj.smArgs.args ;
         }
       }
       
       jsm = piObj.factory._spawn(args, this) ;
       
       this.fire.$regEmitter("sub", jsm) ;
//       jsm.on("exit", this.fire.$cb("sub.exit")) ;
       
       // Make sure error event is ignored (and doesn't cause node to exit)
       jsm.on("error", function (){}) ;
     },
     "actions": {
       "sub.call": "@ignore",
       "sub.eemit": "@ignore",
       "sub.event": "@ignore",
       "sub.change": "@ignore",
       "sub.enter": "@ignore",
       "sub.done": "@ignore",
       "sub.ctor": "@ignore"
     }
   },
   graph: function (statev, state, sname, piname) {
     var attr = statev.attributes ;
     attr.stereotypes.push(name) ;
     statev.hints.fillcolor = "firebrick3" ;
     attr.entry.hidden = true ;
   },
   graphfns: ["factory", "smArgs"]
  }) ;
} ;

module.exports = SubPlugin ;