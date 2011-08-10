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

var _ = require("underscore") ;

function AsyncGuardPlugin (piApi, name) {
  piApi.registerStatePI(name, {
    match: function (piobj, piname, state) {
      return (state._asyncGuard) || (state.guard && (typeof state.guard === "object")) ;
    },
    initState: function (stateName, origState) {
      var states = this.states, guardState, coreState, coreStateName ;
      
      coreStateName = "_"+stateName ;
      states[coreStateName] = origState ;
      
      guardState = origState.guard ;
      guardState._plugins = origState._plugins ;
      delete origState.guard ;
      origState._guard = guardState ;
      
      _.clone(guardState._actions, guardState.actions) ;
      
      _.each(guardState.actions, function (val, key) {
        if (val == null) {
          guardState.actions[key] = coreStateName ;
        } else if (typeof val === "function") {
          guardState.actions[key] = function () {
            var ret = val.apply(this, arguments) ;
            if (ret == null) {
              this.state[this.privName].unshift(coreStateName) ;
              return this.state[this.privName] ;
            } else {
              return ret ;
            }
          } ;
        }
      }) ;
      
      states[stateName] = guardState ;
      guardState._asyncGuard = true ;
      
      return [coreStateName] ;
    },
    state: {
      entry: function () {
        this.state[this.privName] = Array.prototype.slice.call(arguments, 0) ;
      },
      exit: function () {
        delete this.state[this.privName] ;
      }
    }
  }) ;
} ;

module.exports = AsyncGuardPlugin ;
