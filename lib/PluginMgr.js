var _ = require('underscore'),
    util = require('util'),
    StateMachine = require('./StateMachine'),
    SubMods = require('./utils/submods').SubMods;

var defaultPIs, otherPIs;


function PiApi (destObj) {
  this.destObj = destObj ;
  
  if (!destObj.statePis) {
    destObj.statePis = {} ;
  }
  
  if (!destObj.fireMethods) {
    destObj.fireMethods = {} ;
  }
  this.defaultPriority = 50 ;
}

PiApi.prototype.setDefaultPriority = function (pri) {
  this.defaultPriority = pri ;
} ;

PiApi.prototype.registerStatePI = function (name, piobj) {
  var match = piobj.match ;
  this.destObj.statePis[name] = piobj ;
  if (! match) {
    piobj.match = function (piobj2, piname, state) {
      return (piname in state) ;
    } ;
  } else {
    if (typeof match === "boolean") {
      if (match) {
        piobj.match = function (piobj) {return true ;} ;
      } else {
        piobj.match = function (piobj) {return false ;} ;
      }
    } else if (typeof piobj.match === "string") {
      piobj.match = function (piobj2, piname, state) {
        return (match in state) ;
      } ;
    }
  }
  
  if (piobj.priority === undefined ||
      typeof piobj.priority !== "number") {
    piobj.priority = this.defaultPriority ;
  }
} ;

PiApi.prototype.registerFireMethod = function (name, method) {
  this.destObj.fireMethods[name] = method ;
} ;


// Pre-load default plug-in modules
(function Init () {
  defaultPIs = new SubMods(module, "plugins/defaults", null, true) ;
  defaultPIs.preLoadAll() ;
  
  otherPIs = new SubMods(module, "plugins/others", null, true) ;
})() ;


function PluginMgr (factory, pluginOpts) {
  pluginOpts = pluginOpts || {} ;
  
  this.piApi = new PiApi(this) ;
  
  if (_.isArray(pluginOpts)) {
    pluginOpts = { load: pluginOpts } ;
  }
  
  // load contains a list of (non-default) plugin names to load
  if (pluginOpts.load) {
    _.each(pluginOpts.load, function (piname) {
      if (otherPIs.exists(piname)) {
        this.runPlugin(piname, otherPIs.load(piname)) ;
      } else if (piname in defaultPIs) {
        // Do nothing - the plugin will be loaded anyway
      } else {
        throw new Error("Unknown plugin: "+piname) ;
      }
    }, this) ;
  }
  
  pluginOpts.exclude = pluginOpts.exclude || [] ;
  
  defaultPIs.each(function (mod, modname) {
    if (pluginOpts.exclude.indexOf(modname) < 0) {
      this.runPlugin(modname, mod.load(), mod.priority) ;
    }
  }, this) ;
  
  // loadAs is an object, where the plugins contained within
  // the values, are loaded as the names given in the strings.
  if (pluginOpts.loadAs) {
    _.each(pluginOpts.loadAs, function (origName, newName) {
      if (otherPIs.exists(origName)) {
        this.runPlugin(newName, otherPIs.load(origName), otherPIs.getPriority(origName)) ;
      } else if (origName in defaultPIs.submods) {
        // Do nothing - the plugin will be loaded anyway
        defaultPIs.alias(newName, origName) ;
      } else {
        throw new Error("Unknown plugin: "+origName) ;
      }
    }, this) ;
  }
  
  this.statePiList = _.sortBy(_.keys(this.statePis), function (key) {
    return this.statePis[key].priority ;
  }, this) ;

  this.jsmFactory = factory ;

  this._createStateCache() ;
}

PluginMgr.prototype.runPlugin = function (name, mod, priority) {
  if (typeof mod === "function") {
    this.piApi.setDefaultPriority(priority) ;
    mod(this.piApi, name, priority) ;
  }
} ;

PluginMgr.prototype.getFireMethods = function () {
  return _.clone(this.fireMethods) ;
} ;

PluginMgr.prototype.fixupState = function (state, statename) {
  
  _.each(state._plugins, function (pi, piname) {
    if (pi.match(pi, piname, state)) {
      if (pi.state) {
        if (pi.state.entry || pi.state.exit) {
          state._fnList.push([pi.state.entry, pi.state.exit]) ;
        }
        if (pi.state.preEntry || pi.state.postExit) {
          state._fnList.unshift([pi.state.preEntry, pi.state.postExit]) ;
        }
        _.each(pi.state.actions, function (action, evt) {
          if (!state.actions[evt]) {
            state.actions[evt] = action ;
          }
        }) ;
      }
    }
  }) ;
} ;

PluginMgr.prototype.initPlugins = function (jsm) {
  _.each(this.used, function (statepiname) {
    var statepi = this.statePis[statepiname] ;
    
    if (statepi.init) {
      statepi.init.call(jsm) ;
    }
    
    _.each(this.stateCache[statepiname], function (statename) {
      var state = jsm.states[statename] ;
      state._plugins = state._plugins || {} ;
      state._plugins[statepiname] = statepi ;
      if (statepi.initState) {
        statepi.initState.call(jsm, statename, state) ;
      }
    }, this) ;
  }, this) ;
} ;

PluginMgr.prototype.deinitPlugins = function (jsm) {
  _.each(this.used, function (piname) {
    var pi = this.statePis[piname] ;
    if (pi.deinit) {
      pi.deinit.call(jsm) ;
    }
  }, this) ;
  _.each(this.stateCache, function (pilist, statename) {
    _.each(pilist, function (pi, piname) {
      if (pi.deinitState) {
        pi.deinitState.call(jsm, statename, jsm.states[statename]) ;
      }
    }) ;
  }) ;
} ;

PluginMgr.prototype._createStateCache = function () {
  var used = [], cache = {}, sm = this.jsmFactory.createSkeleton() ;
  
  sm.name = this.jsmFactory.name ;
  sm._error = StateMachine.prototype._error.bind(sm) ;
  
  _.each(this.statePiList, function (statepiname) {
    var statepi = this.statePis[statepiname] ;
    cache[statepiname] = [] ;
    _.each(_.keys(sm.states), function (statename) {
      var state = sm.states[statename] ;
      if (statepi.match(statepi, statepiname, state)) {
        cache[statepiname].push(statename) ;
        if (used.indexOf(statepiname) < 0) {
          used.push(statepiname) ;
          if (statepi.init) {
            statepi.init.call(sm) ;
          }
        }
        if (statepi.initState) {
          statepi.initState.call(sm, statename, state) ;
        }
      }
    }) ;
  }, this) ;

  this.stateCache = cache ;
  this.used = used ;
} ;

//PluginMgr.prototype.getStatePlugins = function (statename) {
//  return this.stateCache[statename] ;
//} ;

module.exports = PluginMgr ;