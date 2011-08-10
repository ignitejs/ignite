var igniteTest = require('../../index').test.igniteTest ;

var t = new igniteTest(module) ;

function apiTest (fire) {
  return {
    startState: "0",
    states: {
      "0": {
        entry: function () {
          this.next() ;
        },
        actions: {
          "api.exit": "@error",
          "api.next": "1",
          "api.nop": "@error"
        }
      },
      "1": function () {
        var nopCalled ;
        return {
          entry: function () {
            nopCalled = false ;
            this.nop() ;
          },
          actions: {
            "api.exit": "@error",
            "api.next": function () {
              if (nopCalled)
                return "2" ;
              
              return "@error" ;
            },
            "api.nop": function () {
              nopCalled = true ;
              this.next();
            }
          }
        } ;
      },
      "2": {
        entry: function () {
          this.next(0, 1, 2, 3, 4) ;
        },
        actions: {
          "api.exit": "@error",
          "api.next": function () {
            var i;
            if (arguments.length !== 5)
              return "@error" ;
            for(i=0;i<arguments.length;i++)
              if (arguments[i] !== i)
                return "@error" ;
            return "3" ;
          },
          "api.nop": "@error"
        }
      },
      "3": {
        entry: function () {
          this.exit() ;
        },
        actions: {
          "api.exit": "@exit",
          "api.next": "@error",
          "api.nop": "@error"
        }
      }
    }
  } ;
} ;

apiTest.prototype.exit = function () {
  this._inject(null, "api.exit") ;
} ;

apiTest.api = ["next", "nop"] ;

t.regSM(apiTest) ;

t.expressoAddRun("apiTest run", [], 'exit') ;
