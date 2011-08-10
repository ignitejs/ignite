var igniteTest = require('../../../index').test.igniteTest,
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

t.expressoAddRun("async0 run", ['index.js']) ;
t.expressoAddRun("async0 run err", ['doesnotexist'], 'error') ;

