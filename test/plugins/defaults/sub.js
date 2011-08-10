var igniteTest = require('../../../index').test.igniteTest,
    fs = require('fs') ;

var t = new igniteTest(module) ;

function sub0 (fire, fpath) {
  this.states = {
      "Sub1": {
        "sub": function (arg) {
          this.states = {
              "sub1a": {
                "entry": function () {
                  return "@exit" ;
                }
              }
          } ;
          return "sub1a" ;
        },
        "actions": {
          "sub.exit": "Sub2",
          "sub.error": "@error"
        }
      },
      
      "Sub2": {
        "sub": function (arg) {
          this.states = {
              "sub2a": {
                "entry": function () {
                  return "@error" ;
                }
              }
          } ;
          return "sub2a" ;
        },
        "actions": {
          ".error": "@exit",
          ".exit": "@error"
        }
      }
      
  } ;
  return "Sub1" ;
};

t.regSM(sub0);

t.expressoAddRun("sub0 run") ;

