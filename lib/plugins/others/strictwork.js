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
    vm = require("vm"),
    util = require("util");

function WorkPlugin (piApi, name) {
  piApi.registerStatePI(name, {
    initState : function(statename, state) {
      var script, sandbox = state.sandbox || {} ;
      if (state.require) {
        _.each(state.require, function (modname) {
          sandbox[modname] = require(modname) ;
        });
      }
      sandbox.jsm_worker = {} ;
      script = "jsm_worker.fn = "+state[name].toString() + ";\n" ;
      vm.runInNewContext(script, sandbox, statename+".state") ;
      
      state._fn = sandbox.jsm_worker.fn ;
    },
    state: {
      entry: function () {
        var ctx = null, state = this.state, args = this.args, evt ;
        if (state.ctx) {
          if (typeof state.ctx === "function") {
            ctx = state.ctx() ;
          } else {
            ctx = state.ctx ;
          }
        }
        if (state.args) {
          if (typeof state.args === "function") {
            args = state.args.apply(this, this.args) ;
          } else {
            args = state.args ;
          }
        }

        evt = state._fn.apply(ctx, args) ;
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
    graphfns: [name]
  }) ;
}

module.exports = WorkPlugin ;