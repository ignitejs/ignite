var _ = require("underscore"),
    vm = require("vm"),
    util = require("util");

function WorkPlugin (piApi, name) {
  piApi.registerStatePI(name, {
    initState : function(statename, state) {
      var script, sandbox = state.sandbox || {} ;
      if (state.require) {
        _.each(state.require, function (modname) {
          sandbox[modname] = require(modname) ;
        });
      }
      sandbox.jsm_worker = {} ;
      script = "jsm_worker.fn = "+state[name].toString() + ";\n" ;
      vm.runInNewContext(script, sandbox, statename+".state") ;
      
      state._fn = sandbox.jsm_worker.fn ;
    },
    state: {
      entry: function () {
        var ctx = null, state = this.state, args = this.args, evt ;
        if (state.ctx) {
          if (typeof state.ctx === "function") {
            ctx = state.ctx() ;
          } else {
            ctx = state.ctx ;
          }
        }
        if (state.args) {
          if (typeof state.args === "function") {
            args = state.args.apply(this, this.args) ;
          } else {
            args = state.args ;
          }
        }

        evt = state._fn.apply(ctx, args) ;
        if (typeof evt === "string") {
          evt = name + "." + evt ;
        } else if (_.isArray(evt)) {
          evt[0] = name + "." + evt[0] ;
        }
        this._futureInject(null, evt) ;
      }
    },
    graph: function (statev, state, sname, piname) {
      var attr = statev.attributes ;
      attr.stereotypes.push(name) ;
      statev.hints.fillcolor = "red" ;
      attr.entry.hidden = true ;
    },
    graphfns: [name]
  }) ;
}

module.exports = WorkPlugin ;