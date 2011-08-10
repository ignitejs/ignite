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


function SpawnPlugin (piApi, name) {
  var Factory = require("../../../Factory") ;

  piApi.registerStatePI(name, {
    initState: function (statename, state) {
      if (typeof state[name] !== "object") {
        state[name] = {
            factory: state[name]
        } ;
      }
      if (state[name].factory === undefined) {
        throw this._error("Spawn states need a factory name.") ;
      }
      if (typeof state[name].factory !== "string") {
        throw this._error("Spawn factory should be a string.") ;
      }
    },
    state: {
      entry: function () {
        var args, piObj = this.state[name], subFactory = this._spawn[piObj.factory];

        if (piObj.smArgs) {
          if (typeof piObj.smArgs === "function") {
            args = piObj.smArgs.apply(this, this.args) ;
          } else {
            args = piObj.smArgs ;
          }
          if (!_.isArray(args)) {
            args = [args] ;
          }
        } else {
          // Use slice to make a clone of the array
          args = this.args.slice(0) ;
        }
        subFactory._spawn(args) ;

        this._futureInject(null, "spawn.done") ;
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
  piApi.registerFireMethod("$spawner", 
      function (name, subFactory, imports, options) {
    if (typeof subFactory === "function") {
      imports = imports || {} ;
      options = options || {} ;
      _.defaults(options, this.jsmFactory.options) ;
      _.defaults(imports, this.jsmFactory.imports) ;

      subFactory = new Factory(subFactory, imports, options) ;
    }

    this._spawn = this._spawn || {} ;
    this._spawn[name] = subFactory ;

    this.fire.$regEmitter(name, subFactory, true) ;
    return subFactory ;
  }) ;
} ;

module.exports = SpawnPlugin ;