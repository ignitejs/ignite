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

var filter = [
      {
        filter: t.asyncTest(function (a) { return a > 0 ; }),
        actions: {
          "filter.done": function (vals) {
            var i ;
            if (vals.length === 0) {
              return "@error" ;
            }
            for (i=0;i<vals.length;i++) {
              if (vals[i] <= 0) {
                return "@error" ;
              }
            }
            t.log(vals) ;
            return "@next" ;
          }
        }
      },
      {
        filter: {
          fn: t.asyncTest(function (a) { return a > 1 ; })
        },
        actions: {
          "filter.done": function (vals) {
            var i ;
            if (vals.length === 0) {
              return "@error" ;
            }
            for (i=0;i<vals.length;i++) {
              if (vals[i] <= 1) {
                return "@error" ;
              }
            }
            t.log(vals) ;
            return "@next" ;
          }
        }
      },
      {
        filter: {
          fn: t.asyncTest(function (a) { return a > 3 ; }),
          fnArgs: function (a) { return a+1 ; }
        },
        actions: {
          "filter.done": function (vals) {
            var i ;
            if (vals.length === 0) {
              return "@error" ;
            }
            for (i=0;i<vals.length;i++) {
              if (vals[i] <= 2) {
                return "@error" ;
              }
            }
            t.log(vals) ;
            return "@next" ;
          }
        }
      },
      
      ] ;

t.regSM(filter);

t.expressoAddRun("filter run", [[0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7, 8, -8]]) ;

