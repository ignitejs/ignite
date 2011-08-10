var igniteTest = require('../../index').test.igniteTest ;

var t = new igniteTest(module) ;

t.regSM([
    {
      entry: t.inject("event"),
      actions: {
        "event": "@next",
        "": "@error"
      }
    }, {
      entry: t.inject("event"),
      actions: {
        "": "@next"
      }
    }, {
      entry: t.inject("event.abc"),
      actions: {
        "event.abc": "@next",
        ".abc": "@error",
        "event": "@error",
        "": "@error"
      }
    }, {
      entry: t.inject("event.abc"),
      actions: {
        ".abc": "@next",
        "event": "@error",
        "": "@error"
      }
    }, {
      entry: t.inject("event.abc"),
      actions: {
        "event": "@next",
        "": "@error"
      }
    }, {
      entry: t.inject("event.abc"),
      actions: {
        "": "@next"
      }
    }, {
      entry: t.inject("event.abc.def"),
      actions: {
        "event.abc.def": "@next",
        ".abc.def": "@error",
        "event.abc": "@error",
        ".def": "@error",
        "event": "@error",
        "": "@error"
      }
    }, {
      entry: t.inject("event.abc.def"),
      actions: {
        ".abc.def": "@next",
        "event.abc": "@error",
        ".def": "@error",
        "event": "@error",
        "": "@error"
      }
    }, {
      entry: t.inject("event.abc.def"),
      actions: {
        "event.abc": "@next",
        ".def": "@error",
        "event": "@error",
        "": "@error"
      }
    }, {
      entry: t.inject("event.abc.def"),
      actions: {
        ".def": "@next",
        "event": "@error",
        "": "@error"
      }
    }, {
      entry: t.inject("event.abc.def"),
      actions: {
        "event": "@next",
        "": "@error"
      }
    }, {
      entry: t.inject("event.abc.def"),
      actions: {
        "": "@next"
      }
    }]) ;

t.expressoAddRun("events run", [], 'exit') ;