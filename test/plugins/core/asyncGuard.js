var igniteTest = require('../../../index').test.igniteTest;

var t = new igniteTest(module) ;

function asyncGuard0 (fire, fpath) {
  this.states = {
      "0": {
        guard: {
          entry: function () {
            fire.fs.stat(fpath) ;
          },
          actions: {
            "fs.stat": function (err, stat) {
              if (err) {
                return "@error" ;
              }
            }
          }
        },
        entry: function () {
          return ["1", fpath] ;
        }
      },
      "1": {
        guard: {
          async: "fs.stat",
          actions: {
            "async": function (err, stat) {
              if (err) {
                return "@error" ;
              }
            }
          }
        },
        entry: function () {
          return "@exit" ;
        }
      }
  } ;
  return "0" ;
};

t.regSM(asyncGuard0, {fs: require('fs')});

t.expressoAddRun("asyncGuard0 run", ["index.js"]) ;
