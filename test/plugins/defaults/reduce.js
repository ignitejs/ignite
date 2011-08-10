var igniteTest = require('../../../index').test.igniteTest,
    fs = require('fs') ;

var t = new igniteTest(module) ;

function reduce0 (fire, fpath) {
  
  this.states = {
      "ReadDir": {
        "async": fs.readdir,
        "actions": {
          "async.done": "CalcSize",
          "async.error": "@error"
        }
      },
      "CalcSize": {
        reduce: {
          fn: "fs.stat",
          fnArgs: function (val) {
            return [fpath+"/"+val] ;
          },
          iterator: function (memo, stats) {
            return memo + stats.size ;
          }
        },
        actions: {
          "reduce.done": "@exit",
          "reduce.error": "@error"
        }
      }
  } ;
  return "ReadDir" ;
};

t.regSM(reduce0, { fs: fs });

t.expressoAddRun("reduce0 run", ['.']) ;

