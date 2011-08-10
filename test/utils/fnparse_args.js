var FnParse = require('../../lib/utils/FnParse'),
    assert = require('assert'),
    util = require('util'),
    should = require('should') ;

var test_FnParse_args = function (fn, args)
{
  var fp = new FnParse(fn), fpargs, i, c, fpc ;
  fpargs = fp.getArgs() ;
  
  assert.ok(args.length == fpargs.length) ;
  
  for (i in args) {
    assert.ok(fpargs.indexOf(args[i])>=0) ;
  }
  for (i in fpargs) {
    assert.ok(args.indexOf(fpargs[i])>=0) ;
  }   
} ;

module.exports = {
    'f1': function () {
      var fp = test_FnParse_args(function () {
      }, []) ;
    },
    'f2': function () {
      var fp = test_FnParse_args(function (a) {
      }, ["a"]) ;
    },
    'f3': function () {
      var fp = test_FnParse_args(function (a, b) {
      }, ["a", "b"]) ;
    },
    'f4': function () {
      var fp = test_FnParse_args(function (a, b, c) {
      }, ["a", "b", "c"]) ;
    },
    'f5': function () {
      var fp = test_FnParse_args(function (a, b, c, d) {
      }, ["a", "b", "c", "d"]) ;
    },
    'f6': function () {
      var fp = test_FnParse_args(function (arg0, arg1) {
      }, ["arg0", "arg1"]) ;
    },
} ;
