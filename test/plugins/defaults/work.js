var igniteTest = require('../../../index').test.igniteTest,
    fs = require('fs') ;

var t = new igniteTest(module) ;

function work0 (fire) {
  this.states = {
      "Work1": {
        "work": function (arg) {
          return "done" ;
        },
        "actions": {
          "work.done": "Work2"
        }
      },
      "Work2": {
        "work": function (arg) {
          return ["done", "abc123"] ;
        },
        "actions": {
          ".done": "Work3"
        }
      },
      "Work3": {
        "work": function (arg) {
          if (arg === "abc123") {
            return "done" ;
          } else {
            return "err" ;
          }
        },
        "actions": {
          "work.done": "@exit"
        }
      }
  } ;
  return "Work1" ;
};

t.regSM(work0, { fs: fs });

t.expressoAddRun("work0 run") ;