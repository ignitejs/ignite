var igniteTest = require('../../index').test.igniteTest,
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
