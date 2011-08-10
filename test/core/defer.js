var igniteTest = require('../../index').test.igniteTest;

var t = new igniteTest(module) ;

function deferCritical (fire, result) {
  return {
    startState: "0",
    states: {
      "0": {
        "entry": function () {
          fire.sync(result) ;
        },
        "actions": {
          "sync.done": "@exit",
          "sync.err": "@error"
        }
      }
    }
  } ;
}

t.regSM(deferCritical, { sync: function (err, cb) { cb(err) ; } });

t.expressoAddRun("deferCritical run") ;
t.expressoAddRun("deferCritical run error", ["error"], 'error') ;

function deferSimple (fire) {
  return {
    startState: "0",
    states: {
      "0": function () {
        var timeoutId ;
        return {
          entry: function () {
            timeoutId = setTimeout(fire.$cb("toDefer"), 10) ;
          },
          timeout: 50,
          actions: {
            "toDefer": "@defer",
            "timeout": "1"
          }
        } ;
      },
      "1": {
        timeout: 10,
        actions: {
          "toDefer": "@exit",
          "timeout": "@error"
        }
      }
    }
  } ;
}

t.regSM(deferSimple);

t.expressoAddRun("deferSimple run") ;

function deferCount (fire) {
  var count = 0 ;
  return {
    startState: "0",
    states: {
      "0": {
          ticker: 50,
          actions: {
            "tick": function () {
              if (count < 10) {
                count += 1 ;
                return "@defer" ;
              }
              return "1" ;
            }
          }
      },
      "1": {
        timeout: 100,
        actions: {
          "tick": function () {
            if (count > 0) {
              count -= 1 ;
              return ;
            }
            if (count < 0) {
              return "@error" ;
            }
          },
          "timeout": function () {
            if (count === 0) {
              return "@exit" ;
            }
            return "@error" ;
          }
        }
      }
    }
  } ;
}

t.regSM(deferCount);

t.expressoAddRun("deferCount run") ;


