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

var path = require("path"),
    _ = require("underscore") ;

function run (utils, donecb, jsmfile, jsmopts, jsmargs) {
  var jsmfact, jsm, cb, jsmOptsToMerge ;

  if (!jsmopts.quiet) {
    process.stderr.write("Running "+jsmfile+"\n") ;
  }
  
  jsmfact = utils.createFactory(jsmfile, jsmopts, jsmargs) ;
  
  jsmOptsToMerge = _.clone(jsmfact.desc.runner || {}) ;
  
  if (jsmargs.length) {
    jsmOptsToMerge.args = jsmargs ;
  }
  
  jsm = jsmfact.launch( jsmOptsToMerge ) ;
  jsm.once("exit", function () {
    var args = Array.prototype.slice.call(arguments, 0) ;
    args.unshift(null) ;
    donecb.apply(jsmfact, args) ;
  }) ;
  jsm.once("error", function () {
    var args = Array.prototype.slice.call(arguments, 0) ;
    donecb.apply(jsmfact, args) ;
  }) ;
}

run.opts = {
    "strict": {
      short: "-s",
      long: "--strict",
      desc: "Switch state machine into strict mode"
    },
    "modpath": {
      type: "list",
      short: "-l",
      long: "--modpath",
      desc: ["Append the specified (comma separated) directories to the node",
             "search path."]
    },
    "jsonargs": {
      short: "-j",
      long: "--json",
      desc: ["Parse the first cmd-line argument after the SM name as JSON",
             "and use the resulting array as the arguments to the state machine."]
    },
    "logLevel": {
      type: "int",
      short: "-L",
      long: "--loglevel",
      desc: ["Parse the first cmd-line argument after the SM name as JSON",
             "and use the resulting array as the arguments to the state machine."]
    }
} ;

module.exports = run ;
