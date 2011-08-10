var igniteTest = require('../../../index').test.igniteTest;

var t = new igniteTest(module) ;

function tick0 (fire) {
  this.states = {
      Count: function () {
        var counter ;
        return {
          "ticker": 50,
          "entry": function () { counter = 0; },
          "actions": {
            "tick": function () {
              counter += 1 ;
              if (counter >= 5) {
                return "@exit" ;
              }
            }
          }
        } ;
      },
      // Wait to make sure ticker is cleared
      Wait: {
        timeout: 200,
        actions: {
          "timeout": "@exit"
        }
      }
  } ;
  return "Count" ;
};

t.regSM(tick0);

t.expressoAddRun("tick0 run") ;
