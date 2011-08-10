var igniteTest = require('../../index').test.igniteTest,
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
t.expressoAddRun("sm1 run", ["index.js"]) ;
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
t.expressoAddRun("sm2 run", ["index.js"]) ;
t.expressoAddRun("sm2 run err", ["doesnotexist"], 'error') ;

var readCount = 0, writeCount = 0 ;
function sm3 (fire, fpath) {
  var cooked ;
  this.states = {
      "Exists": {
        "entry": function () {
          fire.path.exists(fpath) ;
        },
        "actions": {
          "path.exists": function (exists) {
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
t.expressoAddRun("sm3 run", ["index.js"]) ;
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
t.expressoAddRun("sm4 run", [111, "index.js"]) ;
t.expressoAddRun("sm4 run err", [222, "doesnotexist"], 'error') ;
