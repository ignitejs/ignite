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

function spawnedSM (fire, fpath) {
  var count = 0 ;
  this.states = {
      "Stat": {
        "entry": function () {
          fire.fs.stat(fpath) ;
        },
        "actions": {
          ".done": function (stat) {
            if (stat.isFile()) {
              return "Count" ;
            } else {
              return "@exit" ;
            }
          },
          ".err": "@error"
        }
      },
      
      "Load": {
        "entry": function () {
          fire.fs.readFile(fpath) ;
        },
        "actions": {
          ".done": "Count",
          ".err": "@error"
        }
      },
      
      "Count": {
        "work": function (raw) {
          count = String(raw).split('\n').length ;
          return ["done", count] ;
        },
        "actions": {
          "work.done": "@exit"
        }
      }
  } ;
  return "Stat" ;
}

function spawn0 (fire, dir) {
  var files ;
  this.states = {
      "Init": {
        "entry": function () {
          fire.$spawner("count", spawnedSM) ;
          return "ReadDir" ;
        }
      },
      "ReadDir": {
        "entry": function () {
          fire.fs.readdir(dir) ;
        },
        "actions": {
          ".done": function (f) {
            files = f ;
            return "Spawn" ;
          },
          ".err": "@error"
        }
      },
      "Spawn": {
        "guard": function () {
          if (files.length === 0)
            return "Wait" ;
        },
        "spawn": {
          factory: "count",
          smArgs: function () {
            return [files.shift()] ;
          }
        },
        "actions": {
          ".done": "@self"
        }
      },
      
      "Wait": {
        "actions": {
          "count.quiet": "@exit"
        }
      }
          
  } ;
  
  this.defaults = {
      ignore: ["count.entry", "count.done"]
  } ;
  return "Init" ;
};

t.regSM(spawn0, { fs: fs });

t.expressoAddRun("spawn0 run", ['.']) ;

