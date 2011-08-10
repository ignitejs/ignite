var _ = require("underscore"),
util = require("util") ;


function SpawnPlugin (piApi, name) {
  var Factory = require("../../../Factory") ;

  piApi.registerStatePI(name, {
    initState: function (statename, state) {
      if (typeof state[name] !== "object") {
        state[name] = {
            factory: state[name]
        } ;
      }
      if (state[name].factory === undefined) {
        throw this._error("Spawn states need a factory name.") ;
      }
      if (typeof state[name].factory !== "string") {
        throw this._error("Spawn factory should be a string.") ;
      }
    },
    state: {
      entry: function () {
        var args, piObj = this.state[name], subFactory = this._spawn[piObj.factory];

        if (piObj.smArgs) {
          if (typeof piObj.smArgs === "function") {
            args = piObj.smArgs.apply(this, this.args) ;
          } else {
            args = piObj.smArgs ;
          }
          if (!_.isArray(args)) {
            args = [args] ;
          }
        } else {
          // Use slice to make a clone of the array
          args = this.args.slice(0) ;
        }
        subFactory._spawn(args) ;

        this._futureInject(null, "spawn.done") ;
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
  piApi.registerFireMethod("$spawner", 
      function (name, subFactory, imports, options) {
    if (typeof subFactory === "function") {
      imports = imports || {} ;
      options = options || {} ;
      _.defaults(options, this.jsmFactory.options) ;
      _.defaults(imports, this.jsmFactory.imports) ;

      subFactory = new Factory(subFactory, imports, options) ;
    }

    this._spawn = this._spawn || {} ;
    this._spawn[name] = subFactory ;

    this.fire.$regEmitter(name, subFactory, true) ;
    return subFactory ;
  }) ;
} ;

module.exports = SpawnPlugin ;