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
    Diagram = require('../../ignite').Diagram ;

var t = new igniteTest(module) ;

var readCount = 0, writeCount = 0 ;

function toDraw (fire, fpath) {
  var cooked ;
  
  this.states = {
      "Exists": {
        "entry": function () {
          fire.path.exists(fpath) ;
        },
        "actions": {
          "exists": function (exists) {
            if (!exists) {
              return "@error" ;
            } else {
              return "Read" ;
            }
          },
          
          "self": "@self"
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
          "readFile.done": "Process",
          "readFile.err": "@error",
          "inttest": function () {
            return null ;
          }
        }
      },
      "Process": {
        "guard": function (raw) {
          if (raw.length === 0) {
            return "@exit" ;
          }
        },
        "work": function (raw) {
          cooked = String(raw).replace(/var(?=\s)/g, 'bar') ;
          return ["done", cooked] ;
        },
        "actions": {
          "done": "Transient",
          "err": function (err) {
            if (err) {
              return "@error" ;
            }
            return "Write" ;
          },
          "other": function (abc) {
            if (abc) {
              return "Write" ;
            }
          }
        }
      },
      "Transient": {
        "entry": function () {
          return "Mapper" ;
        }
      },
      "Mapper": {
        map: "fs.readFile",
        actions: {
          "map.done": "Write",
          "map.err": "@error"
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
          "writeFile.done": "@exit",
          "writeFile.err": "@error"
        }
      }
  } ;
  return "Exists" ;
};

t.regSM(toDraw, { fs: require('fs') }) ;

t.expressoAdd("toDraw draw json", function (beforeExit, jsmFactory) {
  var graph = new Diagram(jsmFactory), text ;
  text = graph.processAndWrite("tmp/sm1.json", {processor: "json"}) ;
//      util.debug(text) ;
  }) ;

t.expressoAdd("toDraw draw dot", function (beforeExit, jsmFactory) {
  var graph = new Diagram(jsmFactory), text ;
  text = graph.processAndWrite("tmp/sm1.dot") ;
//      util.debug(text) ;
  }) ;
