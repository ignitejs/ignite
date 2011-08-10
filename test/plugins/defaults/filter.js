var igniteTest = require('../../../index').test.igniteTest,
    fs = require('fs') ;

var t = new igniteTest(module) ;

var filter = [
      {
        filter: t.asyncTest(function (a) { return a > 0 ; }),
        actions: {
          "filter.done": function (vals) {
            var i ;
            if (vals.length === 0) {
              return "@error" ;
            }
            for (i=0;i<vals.length;i++) {
              if (vals[i] <= 0) {
                return "@error" ;
              }
            }
            t.log(vals) ;
            return "@next" ;
          }
        }
      },
      {
        filter: {
          fn: t.asyncTest(function (a) { return a > 1 ; })
        },
        actions: {
          "filter.done": function (vals) {
            var i ;
            if (vals.length === 0) {
              return "@error" ;
            }
            for (i=0;i<vals.length;i++) {
              if (vals[i] <= 1) {
                return "@error" ;
              }
            }
            t.log(vals) ;
            return "@next" ;
          }
        }
      },
      {
        filter: {
          fn: t.asyncTest(function (a) { return a > 3 ; }),
          fnArgs: function (a) { return a+1 ; }
        },
        actions: {
          "filter.done": function (vals) {
            var i ;
            if (vals.length === 0) {
              return "@error" ;
            }
            for (i=0;i<vals.length;i++) {
              if (vals[i] <= 2) {
                return "@error" ;
              }
            }
            t.log(vals) ;
            return "@next" ;
          }
        }
      },
      
      ] ;

t.regSM(filter);

t.expressoAddRun("filter run", [[0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7, 8, -8]]) ;

