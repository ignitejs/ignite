var FnParse = require('../../lib/utils/FnParse'),
    assert = require('assert'),
    util = require('util'),
    should = require('should') ;

var test_FnParse_fire = function (fn, calls)
{
  var fp = new FnParse(fn), fpcalls, i, c, fpc ;
  fpcalls = fp.getCalls() ;
  
  assert.ok(calls.length == fpcalls.length) ;
  
  for (i=0;i<calls.length;i++) {
    c = calls[i] ;
    fpc = fpcalls[i] ;
    
    assert.ok(c.fn === fpc.fn) ;
    assert.ok(c.args.length === fpc.args.length) ;
    for (a=0;a<c.args.length;a++) {
      assert.ok(c.args[a] === fpc.args[a]) ;
    }
  }
} ;

module.exports = {
    'f1': function () {
      var fp = test_FnParse_fire(function (fire, path) {
        fire.fs.readFile(path);
      }, [{fn: "fire.fs.readFile", args: ["path"]}]) ;
    },
    'f2': function () {
      var fp = test_FnParse_fire(function (fire, path) {
        fire.
          fs.
            readFile(path);
      }, [{fn: "fire.fs.readFile", args: ["path"]}]) ;
    },
    'f3': function () {
      var fp = test_FnParse_fire(function (fire, path) {
        fire.
          fs.
            readFile(path);
      }, [{fn: "fire.fs.readFile", args: ["path"]}]) ;
    },
    'f4': function () {
      var fp = test_FnParse_fire(function (fire, path) {
          abc(a0, a1, a2, a3, a4);
      }, [{fn: "abc", args: ["a0", "a1", "a2", "a3", "a4"]}]) ;
    },
    'f5': function () {
      var fp = test_FnParse_fire(function (fire, path) {
          abc.def(a0, a1, a2, a3, a4);
      }, [{fn: "abc.def", args: ["a0", "a1", "a2", "a3", "a4"]}]) ;
    },
    'f6': function () {
      var fp = test_FnParse_fire(function (fire, path) {
          abc.def.ghi(a0, a1, a2, a3, a4);
      }, [{fn: "abc.def.ghi", args: ["a0", "a1", "a2", "a3", "a4"]}]) ;
    },
    'f7': function () {
      var fp = test_FnParse_fire(function (fire, path) {
          (function () {})(a0+a1, a2+a3, a4);
      }, [{fn: "function(){}", args: ["a0+a1", "a2+a3", "a4"]}]) ;
    },
    'f8': function () {
      var fp = test_FnParse_fire(function (fire, path) {
          abc(a0);
          def(a0, a1);
          ghi(a0, a1, a2);
          jkl(a0, a1, a2, a3);
      }, [{fn: "abc", args: ["a0"]},
          {fn: "def", args: ["a0", "a1"]},
          {fn: "ghi", args: ["a0", "a1", "a2"]},
          {fn: "jkl", args: ["a0", "a1", "a2", "a3"]}]) ;
    },
    'f9': function () {
      var fp = test_FnParse_fire(function (fire, path) {
          abc(
              def(
                  ghi(a0, a1, a2), jkl(a0, a1, a2, a3)));
      }, [ { fn: 'abc', args: [ 'def(ghi(a0,a1,a2),jkl(a0,a1,a2,a3))' ] },
           { fn: 'def', args: [ 'ghi(a0,a1,a2)', 'jkl(a0,a1,a2,a3)' ] },
           { fn: 'ghi', args: [ 'a0', 'a1', 'a2' ] },
           { fn: 'jkl', args: [ 'a0', 'a1', 'a2', 'a3' ] } ]
    ) ;
    }
} ;
