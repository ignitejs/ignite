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

function TickerPlugin (piApi, name) {
  piApi.registerStatePI(name, {
   state: {
     entry: function () {
       var state = this.state ;
       var ms = this.state.ticker ;
       var tickcount = 0 ;
       var source = {
           type: "ticker",
           id: this._generateId(),
           meta: {
             ms: ms
           }
       } ;
       
       this.state._ticker = setInterval(function (jsm) {
         var evtname = "tick" ;
         if (jsm.uniquename) {
           evtname += ":" + jsm.uniquename ;
         }
         jsm._inject(source, [evtname, tickcount]) ;
         tickcount += 1 ;
       }, ms, this) ;
     },
     exit: function () {
       if (this.state._ticker) {
         clearInterval(this.state._ticker) ;
         delete this.state._ticker ;
       }
     }
   },
   graph: function (statev, state, sname, piname) {
     var attr = statev.attributes ;
     attr.stereotypes.push(name) ;
     attr.entry.hidden = true ;
   }
  }) ;
} ;

module.exports = TickerPlugin ;