var path = require("path"),
    _ = require("underscore") ;

function run (utils, donecb, jsmfile, jsmopts, jsmargs) {
  var jsmfact, jsm, cb, jsmOptsToMerge ;

  if (!jsmopts.quiet) {
    process.stderr.write("Running "+jsmfile+"\n") ;
  }
  
  jsmfact = utils.createFactory(jsmfile, jsmopts, jsmargs) ;
  
  jsmOptsToMerge = _.clone(jsmfact.desc.runner) ;
  
  if (jsmargs.length) {
    jsmOptsToMerge.args = jsmargs ;
  }
  
  jsm = jsmfact.launch( jsmOptsToMerge ) ;
  jsm.once("exit", function () {
    var args = Array.prototype.slice.call(arguments, 0) ;
    args.unshift(null) ;
    donecb.apply(jsmfact, args) ;
  }) ;
  jsm.once("error", function () {
    var args = Array.prototype.slice.call(arguments, 0) ;
    donecb.apply(jsmfact, args) ;
  }) ;
}

run.opts = {
    "strict": {
      short: "-s",
      long: "--strict",
      desc: "Switch state machine into strict mode"
    },
    "modpath": {
      type: "list",
      short: "-l",
      long: "--modpath",
      desc: ["Append the specified (comma separated) directories to the node",
             "search path."]
    },
    "jsonargs": {
      short: "-j",
      long: "--json",
      desc: ["Parse the first cmd-line argument after the SM name as JSON",
             "and use the resulting array as the arguments to the state machine."]
    },
    "logLevel": {
      type: "int",
      short: "-L",
      long: "--loglevel",
      desc: ["Parse the first cmd-line argument after the SM name as JSON",
             "and use the resulting array as the arguments to the state machine."]
    }
} ;

module.exports = run ;