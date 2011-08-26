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
/* Plugin 'async'
 * 
 * Kick off an asynchronous function and wait for the reply.
 * 
 * Parameters:
 * 
 *    async {String|Function} Async function or, if a string, the name
 *                            of the asynchronous function (which can be
 *                            found in the JSFactory imports). Using a string
 *                            helps create better diagrams for very little
 *                            overhead.
 *    args  {Array|Function}  Arguments to pass to function. Either a static
 *                            array, or a function returning an array. If not
 *                            set, the current state machine arguments will be
 *                            used.
 * 
 * Events:
 * 
 *    "done" (-err) [args...] Asynchronous function completed with no error.
 *                            Arguments are as returned by the function but
 *                            with the first (error) argument removed.
 *    "err" [err, args...]    Asynchronous function had an error. Arguments
 *                            are as returned by the async function
 */
var pluginUtils = require('../../utils/pluginUtils') ;
var igniteUtils = require('../../utils/igniteUtils') ;

function AsyncPlugin (piApi, name) {
  piApi.registerStatePI(name, {
    initState: function (statename, state) {
      if (typeof state[name] !== "object") {
        pluginUtils.convertToObj(this, statename, state, name) ;
      }

      pluginUtils.strtofn(this, statename, state, name) ;
    },
    state: {
      entry: function () {
        var state = this.state, piObj = state[name], cb, args, fnObj ;

        if (piObj.fnArgs) {
          if (typeof piObj.fnArgs === "function") {
            args = piObj.fnArgs.apply(this, arguments) ;
          } else {
            args = piObj.fnArgs ;
          }
        } else {
          args = this.args ;
        }

        cb = function (err) {
          var cbargs = Array.prototype.slice.call(arguments, 0),
          evt, argshift;
          if (err) {
            evt = name+".err" ;
          } else {
            evt = name+".done" ;
            argshift = [1] ;
          }
          evt = this._makeUniqueToState(evt) ;
          cbargs.unshift(evt) ;
          cbargs.push(args) ;
          this._inject(null, cbargs, argshift) ;
          args = null ; state = null ; cb = null ;
        } ;
        cb = cb.bind(this) ;

        args.push(cb) ;
        
        if (piObj._fnObj) {
          // Pre-calculated function and context
          fnObj = piObj._fnObj ;
        } else {
          if (typeof piObj.fn === "string") {
            fnObj = igniteUtils.findFn(this.library, piObj.fn) ;
          } else {
            fnObj = { fn: piObj.fn, ctx: null } ;
          }
        }
        
        try {
          fnObj.fn.apply(fnObj.ctx, args) ;
        } catch (err) {
          cb(err) ;
        }
      }
    },
    graph: function (statev, state, sname, piname) {
      var attr = statev.attributes ;
      attr.stereotypes.push(name) ;
      statev.hints.fillcolor = "aquamarine3" ;
      attr.entry.hidden = true ;
    },
    graphfns: ["fn", "fnArgs"]
  }) ;
}

module.exports = AsyncPlugin ;