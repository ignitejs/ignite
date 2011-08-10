var igniteTest = require('../../../index').test.igniteTest;

var t = new igniteTest(module) ;

function timeout0 (fire, testTime) {
  this.states = {
      "0": function () {
        var timerId ;
        return {
          "timeout": 100,
          "entry": function () {
            timerId = setInterval(fire.$cb("bad"), testTime) ;
          },
          "exit": function () {
            clearInterval(timerId) ;
          },
          "actions": {
            "timeout": "@exit",
            "bad": "@error"
          }
        } ;
      }
  } ;
  return "0" ;
};

t.regSM(timeout0);

t.expressoAddRun("timeout0 run", [200]) ;
t.expressoAddRun("timeout0 run error", [50], 'error') ;
