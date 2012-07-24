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

var igniteTest = require('../../ignite').test.igniteTest,
    path = require('path') ;

var t = new igniteTest(module) ;
var imports = { fs: require('fs') } ;

function sm1 (fire, fpath) {
  this.states = {
      "Load": {
        "entry": function () {
          fire.fs.readFile(fpath) ;
        },
        "actions": {
          "fs.readFile.done": "@exit",
          "fs.readFile.err": "@error"
        }
      }
  } ;
  return "Load" ;
};

t.regSM(sm1, imports);
t.expressoAddRun("sm1 run", ["ignite.js"]) ;
t.expressoAddRun("sm1 run err", ["doesnotexist"], 'error') ;

function sm2 (fire, fpath) {
  return {
    startState: "Load",
    states: {
      "Load": {
        "entry": function () {
          fire.fs.readFile(fpath) ;
        },
        "actions": {
          "fs.readFile.done": function (data, args) {
            if (args[0] !== fpath) {
              return "@error";
            }
            return "@exit" ;
          },
          "fs.readFile.err": "@error"
        }
      }
    }
  } ;
};

t.regSM(sm2, imports);
t.expressoAddRun("sm2 run", ["ignite.js"]) ;
t.expressoAddRun("sm2 run err", ["doesnotexist"], 'error') ;

var readCount = 0, writeCount = 0 ;
function sm3 (fire, fpath) {
  var cooked ;
  this.states = {
      "Exists": {
        "entry": function () {
          fire.fs.exists(fpath) ;
        },
        "actions": {
          "fs.exists": function (exists) {
            if (!exists) {
              return "@error" ;
            } else {
              return "Read" ;
            }
          }
        }
      },
      
      "Read": {
        "entry": function () {
          fire.fs.readFile(fpath) ;
        },
        "exit": function () {
          readCount += 1 ;
        },
        "actions": {
          "fs.readFile.done": "Process",
          "fs.readFile.err": "@error"
        }
      },
      "Process": {
        "entry": function (raw) {
          cooked = String(raw).replace(/var(?=\s)/g, 'bar') ;
          return "Write" ;
        }
      },
      "Write": {
        "entry": function () {
          fire.fs.writeFile(path.join("tmp", fpath.replace(/\.js$/, ".bar")), cooked) ;
        },
        "exit": function () {
          writeCount += 1 ;
        },
        "actions": {
          "fs.writeFile.done": "@exit",
          "fs.writeFile.err": "@error"
        }
      }
  } ;
  return "Exists" ;
};

t.regSM(sm3, { fs: require('fs'), path: path });
t.expressoAddRun("sm3 run", ["ignite.js"]) ;
t.expressoAddRun("sm3 run err", ["doesnotexist"], 'error') ;

function sm4 (fire, fpath) {
  this.states = {
      "Load": {
        "setTA": function (a, b) {
          return [b] ;
        },
        "entry": function (f) {
          fire.fs.readFile(f) ;
        },
        "actions": {
          "fs.readFile.done": "@exit",
          "fs.readFile.err": "@error"
        }
      }
  } ;
  return "Load" ;
};

t.regSM(sm4, imports);
t.expressoAddRun("sm4 run", [111, "ignite.js"]) ;
t.expressoAddRun("sm4 run err", [222, "doesnotexist"], 'error') ;
