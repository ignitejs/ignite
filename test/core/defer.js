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

var igniteTest = require('../../ignite').test.igniteTest;

var t = new igniteTest(module) ;

function deferCritical (fire, result) {
  return {
    startState: "0",
    states: {
      "0": {
        "entry": function () {
          fire.sync(result) ;
        },
        "actions": {
          "sync.done": "@exit",
          "sync.err": "@error"
        }
      }
    }
  } ;
}

t.regSM(deferCritical, { sync: function (err, cb) { cb(err) ; } });

t.expressoAddRun("deferCritical run") ;
t.expressoAddRun("deferCritical run error", ["error"], 'error') ;

function deferSimple (fire) {
  return {
    startState: "0",
    states: {
      "0": function () {
        var timeoutId ;
        return {
          entry: function () {
            timeoutId = setTimeout(fire.$cb("toDefer"), 10) ;
          },
          timeout: 50,
          actions: {
            "toDefer": "@defer",
            "timeout": "1"
          }
        } ;
      },
      "1": {
        timeout: 10,
        actions: {
          "toDefer": "@exit",
          "timeout": "@error"
        }
      }
    }
  } ;
}

t.regSM(deferSimple);

t.expressoAddRun("deferSimple run") ;

function deferCount (fire) {
  var count = 0 ;
  return {
    startState: "0",
    states: {
      "0": {
          ticker: 50,
          actions: {
            "tick": function () {
              if (count < 10) {
                count += 1 ;
                return "@defer" ;
              }
              return "1" ;
            }
          }
      },
      "1": {
        timeout: 100,
        actions: {
          "tick": function () {
            if (count > 0) {
              count -= 1 ;
              return ;
            }
            if (count < 0) {
              return "@error" ;
            }
          },
          "timeout": function () {
            if (count === 0) {
              return "@exit" ;
            }
            return "@error" ;
          }
        }
      }
    }
  } ;
}

t.regSM(deferCount);

t.expressoAddRun("deferCount run") ;


