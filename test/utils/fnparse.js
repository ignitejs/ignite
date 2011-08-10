var FnParse = require('../../lib/utils/FnParse'),
    assert = require('assert'),
    util = require('util'),
    should = require('should') ;

var test_FnParse = function (fn, rets)
{
  var fp = new FnParse(fn) ;
  var fpr = fp.getReturns() ;
  
//  util.debug("Expected: "+util.inspect(rets)) ;
//  util.debug("Returned: "+util.inspect(fpr)) ;
  assert.ok(fpr.length === rets.length) ;
  
  for (i in rets) {
    assert.ok(fpr.indexOf(rets[i])>=0) ;
  }
  for (i in fpr) {
    assert.ok(rets.indexOf(fpr[i])>=0) ;
  }   
} ;

module.exports = {
    'name1': function () {
      var fp = new FnParse(function name1 () {}) ;
      fp.getFnName().should.equal('name1') ;
    },
    'name2': function () {
      var fp = new FnParse(function name2 () {}) ;
      fp.getFnName().should.equal('name2') ;
    },
    'noname': function () {
      var fp = new FnParse(function () {}) ;
      assert.ok(!(fp.getFnName())) ;
    },
    
    'f1': function () {
      var fp = test_FnParse(function () {
        return "123";
      }, ["123"]) ;
    },
    'f2': function () {
      var fp = test_FnParse(function (a) {
        return a ? "123" : "456";
      }, ["123", "456"]) ;
    },
    'f3': function () {
      var fp = test_FnParse(function (a) {
        if (a) {
          return "123" ;
        }
        return "456";
      }, ["123", "456"]) ;
    },
    'f3a': function () {
      var fp = test_FnParse(function (a) {
        if (a) {
          return ;
        }
        return "456";
      }, [undefined, "456"]) ;
    },
    'f3b': function () {
      var fp = test_FnParse(function (a) {
        if (a) {
          return null;
        }
        return "456";
      }, [null, "456"]) ;
    },
    'f4': function () {
      var fp = test_FnParse(function (a) {
        if (a) {
          return "123" ;
        } else {
          return "456";
        }
      }, ["123", "456"]) ;
    },
    'f5': function () {
      var fp = test_FnParse(function (a, b) {
        if (a) {
          return "123" ;
        } else {
          if (b) {
            return "456";
          } else {
            return "789" ;
          }
        }
      }, ["123", "456", "789"]) ;
    },
    'f6': function () {
      var fp = test_FnParse(function (a, b) {
        if (a) {
          return "123" ;
        } else {
          if (b) {
            return "456";
          }
        }
        return "789" ;
      }, ["123", "456", "789"]) ;
    },
    'f7': function () {
      var fp = test_FnParse(function (a, b) {
        return "123" ;
        return "123" ;
      }, ["123"]) ;
    },
    'f8': function () {
      var fp = test_FnParse(function (a) {
        if (a) {
          return ;
        }
      }, [undefined]) ;
    },
    'f8a': function () {
      var fp = test_FnParse(function (a) {
        if (a) {
          return null ;
        }
      }, [null, undefined]) ;
    },
    
//    'v1': function () {
//      var fp = test_FnParse(function () {
//        var v = "123" ;
//        return v ;
//      }, ["123"]) ;
//    },
//    'v2': function () {
//      var fp = test_FnParse(function () {
//        var v ;
//        v = "123" ;
//        return v ;
//      }, ["123"]) ;
//    },
    'n1': function () {
      var fp = test_FnParse(function () {
      }, [undefined]) ;
    },
    'n2': function () {
      var fp = test_FnParse(function (a) {
        if (a) {
          return "123" ;
        }
      }, [undefined, "123"]) ;
    },
    'sw1': function () {
      var fp = test_FnParse(function (a) {
        switch (a) {
        default:
          return "123" ;
        }
      }, ["123"]) ;
    },
    'sw2': function () {
      var fp = test_FnParse(function (a) {
        switch (a) {
        case 1:
          return "123" ;
        default:
          return "456" ;
        }
      }, ["123", "456"]) ;
    },
    'sw3': function () {
      var fp = test_FnParse(function (a) {
        switch (a) {
        case 1:
          return "123" ;
        }
      }, [undefined, "123"]) ;
    },
    'sw4': function () {
      var fp = test_FnParse(function (a) {
        switch (a) {
        case 1:
          return "123" ;
        case 2:
          return "456" ;
        default:
          return "789" ;
        }
      }, ["123", "456", "789"]) ;
    },
    'sw5': function () {
      var fp = test_FnParse(function (a) {
        switch (a) {
        case 1:
          return "123" ;
        case 2:
          return "456" ;
        }
        return "789" ;
      }, ["123", "456", "789"]) ;
    },
    'sw6': function () {
      var fp = test_FnParse(function (a, b) {
        switch (a) {
        case 1:
          if (b)
            return "123" ;
          break ;
        default:
          return "456" ;
        }
      }, ["123", "456", undefined]) ;
    },
    'sw7': function () {
      var fp = test_FnParse(function (a, b) {
        switch (a) {
        case 1:
          if (b)
            return "123" ;
        default:
          return "456" ;
        }
      }, ["123", "456"]) ;
    },
    'sw8': function () {
      var fp = test_FnParse(function (a, b) {
        switch (a) {
        case 1:
          if (b)
            return "123" ;
        case 2:
          return "456" ;
        }
      }, ["123", "456", undefined]) ;
    },
    'sw9': function () {
      var fp = test_FnParse(function (a, b) {
        switch (a) {
        case 1:
          if (b)
            return "123" ;
        case 2:
          return "456" ;
        default:
          return "789" ;
        }
      }, ["123", "456", "789"]) ;
    },
    'sw10': function () {
      var fp = test_FnParse(function (a, b) {
        switch (a) {
        case 1:
          if (b)
            return "123" ;
        case 2:
          return "456" ;
        case 3:
          return "789" ;
        }
      }, ["123", "456", "789", undefined]) ;
    },
    
} ;
