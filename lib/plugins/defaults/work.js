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

var pluginUtils = require('../../utils/pluginUtils'),
    _ = require("underscore") ;

function WorkPlugin (piApi, name) {
  piApi.registerStatePI(name, {
    initState: function (statename, state) {
      if (typeof state[name] !== "object") {
        pluginUtils.convertToObj(this, statename, state, name) ;
      }
      
      pluginUtils.strtofn(this, statename, state, name);
    },
   state: {
     entry: function () {
       var ctx = this, state = this.state, piObj = state[name], args = this.args, evt ;
       if (piObj.ctx) {
         if (typeof piObj.ctx === "function") {
           ctx = piObj.ctx() ;
         } else {
           ctx = piObj.ctx ;
         }
       }
       if (piObj.fnArgs) {
         if (typeof piObj.fnArgs === "function") {
           args = piObj.fnArgs.apply(this, this.args) ;
         } else {
           args = piObj.fnArgs ;
         }
       }

       evt = piObj.fn.apply(ctx, args) ;
       if (typeof evt === "string") {
         evt = name + "." + evt ;
       } else if (_.isArray(evt)) {
         evt[0] = name + "." + evt[0] ;
       }
       this._futureInject(null, evt) ;
     }
   },
   graph: function (statev, state, sname, piname) {
     var attr = statev.attributes ;
     attr.stereotypes.push(name) ;
     statev.hints.fillcolor = "red" ;
     attr.entry.hidden = true ;
   },
   graphfns: ["work"]
  }) ;
} ;

module.exports = WorkPlugin ;