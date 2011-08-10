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

var igniteTest = require('../../../ignite').test.igniteTest,
    fs = require('fs') ;

var t = new igniteTest(module) ;

function async0 (fire, fpath) {
  this.states = {
      // Check simple usage
      // Args fall-through
      "Async1": {
        "async": fs.readFile,
        "actions": {
          "async.done": function (data, args) {
            if (args[0] !== fpath) {
              return "@error" ;
            }
            return "Async2" ;
          },
          "async.err": "@error"
        }
      },
      // Check string definition
      // Args function
      // Catch of 'async' event
      "Async2": {
        "async": {
          fn: "fs.readFile",
          fnArgs: function () {
            return ["lib/StateMachine.js"] ;
          }
        },
        "actions": {
          "async": function (err, data) {
            if (err) {
              return ["@error"] ;
            } else {
              return ["Async3", data] ;
            }
          }
        }
      },
      // Check that synchronous callbacks are deferred correctly
      // Args array
      // Right-matching events
      "Async3": {
        "async": {
          fn: "sync",
          fnArgs: [null]
        },
        "actions": {
          ".done": "@exit",
          ".err": "@error"
        }
      }
    } ;
  return "Async1" ;
};

t.regSM(async0, { fs: fs, sync: function (err, cb) { cb(err) ; } });

t.expressoAddRun("async0 run", ['ignite.js']) ;
t.expressoAddRun("async0 run err", ['doesnotexist'], 'error') ;

