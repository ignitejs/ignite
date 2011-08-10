var _ = require("underscore") ;

function AsyncGuardPlugin (piApi, name) {
  piApi.registerStatePI(name, {
    match: function (piobj, piname, state) {
      return (state._asyncGuard) || (state.guard && (typeof state.guard === "object")) ;
    },
    initState: function (stateName, origState) {
      var states = this.states, guardState, coreState, coreStateName ;
      
      coreStateName = "_"+stateName ;
      states[coreStateName] = origState ;
      
      guardState = origState.guard ;
      guardState._plugins = origState._plugins ;
      delete origState.guard ;
      origState._guard = guardState ;
      
      _.clone(guardState._actions, guardState.actions) ;
      
      _.each(guardState.actions, function (val, key) {
        if (val == null) {
          guardState.actions[key] = coreStateName ;
        } else if (typeof val === "function") {
          guardState.actions[key] = function () {
            var ret = val.apply(this, arguments) ;
            if (ret == null) {
              this.state[this.privName].unshift(coreStateName) ;
              return this.state[this.privName] ;
            } else {
              return ret ;
            }
          } ;
        }
      }) ;
      
      states[stateName] = guardState ;
      guardState._asyncGuard = true ;
      
      return [coreStateName] ;
    },
    state: {
      entry: function () {
        this.state[this.privName] = Array.prototype.slice.call(arguments, 0) ;
      },
      exit: function () {
        delete this.state[this.privName] ;
      }
    }
  }) ;
} ;

module.exports = AsyncGuardPlugin ;
