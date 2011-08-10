var igniteTest = require('../../../index').test.igniteTest,
    fs = require('fs') ;

var t = new igniteTest(module) ;

var testvals = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7, 8, -8] ;

var detect = [
      {
        detect: t.asyncTest(function (a) { return a > 0 ; }),
        actions: {
          "detect.done": function (val) {
            t.log(this.stateName+" result: ", val) ;
            if (val === undefined || val <= 0) {
              return "@error" ;
            }
            return ["@next", testvals] ;
          }
        }
      },
      {
        detect: {
          fn: t.asyncTest(function (a) { return a > 0 ; })
        },
        actions: {
          "detect.done": function (val) {
            t.log(this.stateName+" result: ", val) ;
            if (val === undefined || val <= 0) {
              return "@error" ;
            }
            return ["@next", testvals] ;
          }
        }
      },
      {
        detect: {
          fn: t.asyncTest(function (a) { return a > 0 ; }),
          par: 17
        },
        actions: {
          "detect.done": function (val) {
            t.log(this.stateName+" result: ", val) ;
            if (val === undefined || val <= 0) {
              return "@error" ;
            }
            return "@next" ;
          }
        }
      },
      {
        detect: {
          fn: t.asyncTest(function (a) { return a > 0 ; }),
          over: testvals, 
          par: 17
        },
        actions: {
          "detect.done": function (val) {
            t.log(this.stateName+" result: ", val) ;
            if (val === undefined || val <= 0) {
              return "@error" ;
            }
            return "@next" ;
          }
        }
      },
      
      ] ;

t.regSM(detect);

var i ;
for (i=0;i<10;i++) {
  t.expressoAddRun("detect run"+i, [testvals]) ;
}

setTimeout(function () {}, 2000) ;
