var igniteTest = require('../../../index').test.igniteTest,
    fs = require('fs') ;

var t = new igniteTest(module) ;

function map0 (fire, fpath) {
  var dirList ;
  this.states = {
    "ReadDir" : {
      "async" : fs.readdir,
      "actions" : {
        "async.done" : "Stats",
        "async.err" : "@error"
      },
      exit: function (list) {
        dirList = list ;
      }
    },
    "Stats" : {
      "map" : "fs.stat",
      "argfn" : function(val) {
        return fpath + "/" + val;
      },
      "actions" : {
        "map.done" : "Stats2",
        "map.err" : "@error"
      }
    },
    "Stats2" : {
      "map" : fs.stat,
      "over" : dirList,
      "argfn" : function(val) {
        return fpath + "/" + val;
      },
      "actions" : {
        ".done" : "@exit",
        ".err" : "@error"
      }
    }
  };
  return "ReadDir";
};

t.regSM(map0, { fs: fs });

t.expressoAddRun("map0 run", ['.']) ;
t.expressoAddRun("map0 run err", ['doesnotexist'], 'error') ;
