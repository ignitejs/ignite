var igniteTest = require('../../../index').test.igniteTest,
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

