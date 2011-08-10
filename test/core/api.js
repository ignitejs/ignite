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

var igniteTest = require('../../ignite').test.igniteTest ;

var t = new igniteTest(module) ;

function apiTest (fire) {
  return {
    startState: "0",
    states: {
      "0": {
        entry: function () {
          this.next() ;
        },
        actions: {
          "api.exit": "@error",
          "api.next": "1",
          "api.nop": "@error"
        }
      },
      "1": function () {
        var nopCalled ;
        return {
          entry: function () {
            nopCalled = false ;
            this.nop() ;
          },
          actions: {
            "api.exit": "@error",
            "api.next": function () {
              if (nopCalled)
                return "2" ;
              
              return "@error" ;
            },
            "api.nop": function () {
              nopCalled = true ;
              this.next();
            }
          }
        } ;
      },
      "2": {
        entry: function () {
          this.next(0, 1, 2, 3, 4) ;
        },
        actions: {
          "api.exit": "@error",
          "api.next": function () {
            var i;
            if (arguments.length !== 5)
              return "@error" ;
            for(i=0;i<arguments.length;i++)
              if (arguments[i] !== i)
                return "@error" ;
            return "3" ;
          },
          "api.nop": "@error"
        }
      },
      "3": {
        entry: function () {
          this.exit() ;
        },
        actions: {
          "api.exit": "@exit",
          "api.next": "@error",
          "api.nop": "@error"
        }
      }
    }
  } ;
} ;

apiTest.prototype.exit = function () {
  this._inject(null, "api.exit") ;
} ;

apiTest.api = ["next", "nop"] ;

t.regSM(apiTest) ;

t.expressoAddRun("apiTest run", [], 'exit') ;
