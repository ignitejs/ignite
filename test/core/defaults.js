var igniteTest = require('../../index').test.igniteTest,
    _ = require('underscore') ;

var t = new igniteTest(module) ;

function defaults0 (fire) {
  this.states = {
      "0": {
        "entry": function () {
          return "1" ;
        },

        "error": ["error.1", "error.2"],
        "defer": ["defer.1", "defer.2", "defer.3"],
        "ignore": ["ignore.1", "ignore.2", "ignore.3", "ignore.4"]
      },
      "1": {
        "entry": function () {
          return "@exit" ;
        }
      }
  } ;
  
  this.defaults = {
      "actions": {
      },
      "error": ["deferror.1"],
      "ignore": ["defignore.1", "defignore.2", "defignore.3"],
      "defer": ["defdefer.1", "defdefer.2"]
  } ;
  
  return "0" ;
}
t.regSM(defaults0);

t.expressoAdd("defaults0 expansion", function (beforeExit, factory) {
  var skeleton = factory.createSkeleton(), 
        defaults = skeleton.defaults,
        state0 = skeleton.states["0"],
        state1 = skeleton.states["1"],
        as = state0.actions ;
  
  _.each(state0.error, function (evt) {
    assert.eql(as[evt], "@error") ;
  }) ;
  _.each(state0.defer, function (evt) {
    assert.eql(as[evt], "@defer") ;
  }) ;
  _.each(state0.ignore, function (evt) {
    assert.eql(as[evt], "@ignore") ;
  }) ;
  _.each(defaults.error, function (evt) {
    assert.eql(as[evt], "@error") ;
  }) ;
  _.each(defaults.defer, function (evt) {
    assert.eql(as[evt], "@defer") ;
  }) ;
  _.each(defaults.ignore, function (evt) {
    assert.eql(as[evt], "@ignore") ;
  }) ;
  
  as = state1.actions ;
  _.each(state0.error, function (evt) {
    assert.isUndefined(as[evt]) ;
  }) ;
  _.each(state0.defer, function (evt) {
    assert.isUndefined(as[evt]) ;
  }) ;
  _.each(state0.ignore, function (evt) {
    assert.isUndefined(as[evt]) ;
  }) ;
  _.each(defaults.error, function (evt) {
    assert.eql(as[evt], "@error") ;
  }) ;
  _.each(defaults.defer, function (evt) {
    assert.eql(as[evt], "@defer") ;
  }) ;
  _.each(defaults.ignore, function (evt) {
    assert.eql(as[evt], "@ignore") ;
  }) ;
}) ;

t.expressoAddRun("defaults0 run") ;



