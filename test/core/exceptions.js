var ignite = require('../../ignite');
var fs = require('fs') ;
var assert = require('assert') ;

function makeException (loc) {
  throw new Error("Exception raised in "+loc) ;
}

function raiseException (fire, location) {
  return {
    startState: "0",
    states: {
      "0": {
        "guard": function () {
          if (location == "guard") makeException(location) ;
        },
        "entry": function () {
          // Cause an exception.
          if (location == "entry") makeException(location) ;
        },
        "setTA": function () {
          if (location == "setTA") makeException(location) ;
        },
        timeout: 10,
        actions: {
          "timeout": function () {
            if (location == "actions") makeException(location) ;
            return "@exit" ;
          }
        },
        "exit": function () {
          // Cause an exception.
          if (location == "exit") makeException(location) ;
        },

      }
    }
  } ;
}

exceptionList = [] ;
var expressoHandler = process._events['uncaughtException'] ;
process.removeAllListeners('uncaughtException') ;

process.on('uncaughtException', function (err) {
  if (process.env.IGNITE_TEST_LOGLEVEL) {
    console.log(">> "+err.toString())
  }
  exceptionList.push(err) ;
})

var logLevel = process.env.IGNITE_TEST_LOGLEVEL || 0 ;
var fact = new ignite.Factory(raiseException, null, {logLevel: logLevel}) ;
fact.spawn('guard') ;
fact.spawn('entry') ;
fact.spawn('setTA') ;
fact.spawn('actions') ;
fact.spawn('exit') ;

module.exports = {
  testExc: function () {
    setTimeout(function () {
      try {
        assert.equal(exceptionList.length, 5) ;
        } catch (err) {
          expressoHandler(err) ;
        }
    }, 100) ;
  }
}