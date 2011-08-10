var _ = require("underscore"),
    util = require("util") ;

function SubPlugin (piApi, name) {
  var Factory = require("../../../Factory") ;
  
  piApi.registerStatePI(name, {
   "initState": function (statename, state) {
     var piObj = state[name] ;
     var options, imports ;     
     if (typeof piObj !== "object") {
       piObj = state[name] = {
           factory: state[name]
       } ;
     }

     options = piObj.options || {} ;
     imports = piObj.imports || {} ;

     if (typeof piObj.factory === "function") {
       _.defaults(options, this.jsmFactory.options) ;
       _.defaults(imports, this.jsmFactory.imports) ;
       
       if (!options.name) {
         options.name = this.jsmFactory.name + ":" + statename ;
       }
       piObj.factory = new Factory(piObj.factory, 
             imports,
             options) ;
     } else if (piObj.factory instanceof Factory) {
       ;
     } else {
       state.entry = function () {
         throw this._error("Sub states need a factory.") ;
       } ;
     }
   },
   "state": {
     "entry": function () {
       var jsm, args = this.args, state = this.state, piObj = state[name] ;
       
       if (piObj.smArgs) {
         if (typeof piObj.smArgs === "function") {
           args = piObj.smArgs.apply(this, this.args) ;
         } else {
           args = piObj.smArgs.args ;
         }
       }
       
       jsm = piObj.factory._spawn(args, this) ;
       
       this.fire.$regEmitter("sub", jsm) ;
//       jsm.on("exit", this.fire.$cb("sub.exit")) ;
       
       // Make sure error event is ignored (and doesn't cause node to exit)
       jsm.on("error", function (){}) ;
     },
     "actions": {
       "sub.call": "@ignore",
       "sub.eemit": "@ignore",
       "sub.event": "@ignore",
       "sub.change": "@ignore",
       "sub.enter": "@ignore",
       "sub.done": "@ignore",
       "sub.ctor": "@ignore"
     }
   },
   graph: function (statev, state, sname, piname) {
     var attr = statev.attributes ;
     attr.stereotypes.push(name) ;
     statev.hints.fillcolor = "firebrick3" ;
     attr.entry.hidden = true ;
   },
   graphfns: ["factory", "smArgs"]
  }) ;
} ;

module.exports = SubPlugin ;