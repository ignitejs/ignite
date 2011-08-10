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

/* ignite.js Plug-in 'each'
 * 
 * This Plug-in is used to apply an asynchronous function to each element in
 * a specified array. The array can either directly hold the arguments used to
 * call the asynchronous function or become the arguments for a function
 * used to generate them (see argfn). The number of array elements used at any 
 * one time can be controlled (see par) so that anything from purely sequential
 * processing (par = 1) to parallel processing (par = size of the array) can be
 * supported. 
 * 
 * Parameters:
 *
 *   each {String|Function} Asynchronous function or, if a string, the name
 *                          of the asynchronous function (which can be
 *                          found in the JSFactory imports). Using a string
 *                          helps create better diagrams for very little
 *                          overhead.
 *
 *   over {Array|Function}  Allows the array which should be iterated over
 *                          to be set.
 *                            The parameter is Optional and if missing the 
 *                          first argument from the Transition Data Object 
 *                          is used.
 *
 *   argfn {Function}       A function, called for each element of the array,
 *                          which should return a single argument or an array 
 *                          of arguments to pass to the asynchronous function. 
 *                          This function is passed the current item from the 
 *                          array and its position.                          
 *                            The parameter is Optional and if missing the 
 *                          asynchronous function is called with a single 
 *                          argument which is the current object from the array.
 *
 *   iterator {Function}    A function, called each time the asynchronous functions
 *                          callback is called (indicating its completion). The 
 *                          first argument is a counter (based on start order), 
 *                          followed by the same arguments as those in the callback 
 *                          for the asynchronous function.
 *                            The parameter is Optional 
 *
 *   par {Number}           Set the maximum number of parallel asynchronous
 *                          calls.
 *                            The parameter is Optional and if missing a default
 *                          value of 4 is used.
 *
 * Events:
 *
 *   done  This event is raised when all asynchronous functions have
 *         completed.
 */

var pluginUtils = require('../../../utils/pluginUtils');
var util = require('util') ;
function EachPlugin (piApi, name) {
  piApi.registerStatePI(name, {
    initState : function(statename, state) {
      if (typeof state[name] !== "object") {
        pluginUtils.convertToObj(this, statename, state, name) ;
      }
      
      pluginUtils.strtofn(this, statename, state, name);
      
//      pluginUtils.checkReq(this, state, name, {"iterator":"function"}) ;
    },
  
    state : {
      entry : function() {
        var state = this.state, _priv;
  
        _priv = pluginUtils.arrayEachEmitter.call(this, name, arguments[0]);
        state[name][this.privName] = _priv;
        _priv.ee.launch();
      },
  
      exit : function() {
        delete this.state[name][this.privName];
      },
  
      actions : {
        "_each.newListener": "@ignore",
        "_each._fire": "@ignore",
        '_each._done' : function(pos, fn_args, err) {
          var args = Array.prototype.slice.call(arguments, 1);
  
          args[0] = pos;
          args[args.length] = fn_args ;
          this.state[name].iterator.apply(this, args);
        },
  
        '_each._alldone' : function(length) {
          this._inject(null, [name+'.done']);
        }
      }
    },
    graph: pluginUtils.EachEmitter.graph,
    graphfns: pluginUtils.EachEmitter.stdFnList
  }) ;
};

module.exports = EachPlugin;
