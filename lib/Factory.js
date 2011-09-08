//[
// Copyright (c) 2011, Richard Miller-Smith & David Hammond.
// All rights reserved. Redistribution and use in source and binary forms, 
// with or without modification, are permitted provided that the following 
// conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials provided
//       with the distribution.
//     * Neither the name of the ignite.js project, nor the names of its
//       contributors may be used to endorse or promote products derived
//       from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//]

/*jslint nodejs: true */
var _ = require('underscore'),
    _s = require('underscore.string'),
    igniteUtils = require('./utils/igniteUtils'),
    StateMachine = require('./StateMachine'),
    fireFactory = require('./fireFactory'),
    PluginMgr = require('./PluginMgr'),
    AddonMgr = require('./AddonMgr'),
    FnParse = require('./utils/FnParse'),
    EventEmitter = require('events').EventEmitter,
    util = require('util'),
    _firemethods = require('./fireMethods');

var _thresholdLogics ;

// Singleton factory ID - used to ensure a factory/machine name is always
// unique.
var _factoryId = 1 ;

/*=============================================================================
 * Defaults
 *===========================================================================*/

var _defaultOptions = {
    logLevel: 4,
    trackLevel: 3,
    plugins: {},
    addons: {}
} ;

/*=============================================================================
 * Local functions
 *===========================================================================*/

// Generate a method that broadcasts a particular event to all running machines
function _apiFn (fact, name) {
  name = "api." + name ;
  return function () {
    var args = Array.prototype.slice.call(arguments, 0) ;
    args.unshift(name) ;
    fact._broadcast(null, args) ; 
  } ;
}

//Generate a method that calls a method on all running machines
function _apiCall (fact, key, val) {
  return function () {
    var args = Array.prototype.slice.call(arguments, 0) ;
    _.each(this._running, function (jsm) {
      if (jsm[key]) {
        jsm[key].apply(this, args) ;
      }
    }, this) ;
  } ;
}

function _setCallback (jsm, cb) {
  jsm.once('exit', function () {
    var cbargs = Array.prototype.slice.call(arguments, 0) ;
    cbargs.unshift(null) ;
    cb.apply(jsm, cbargs) ;
    cb = null ; jsm = null ;
  }) ;
  jsm.once('error', function () {
    var cbargs = Array.prototype.slice.call(arguments, 0) ;
    cb.apply(jsm, cbargs) ;
    cb = null ; jsm = null ;
  }) ;
}

/*=============================================================================
 * Public API and methods
 *===========================================================================*/

/**
 * Constructor for a state machine factory. Once a Factory
 * has been constructed, it can be used to create and start
 * (spawn) many state machines sharing a constant structure. A Factory
 * object is also an EventEmitter, allowing the life-spans of
 * state machines to be studied.
 * 
 * @param {Function} desc  A function closure in which the 
 *                           state machine structure is described.
 * @param   {Object} imports An object which contains the asynchronous
 *                           functions that are accessible within 
 *                           the machine.
 * @param   {Object} options An object containing options to the state
 *                           machine.
 * @return {Object} New Factory object
 * @extends EventEmitter
 * @constructor
 */
function Factory (desc, imports, options) {
  var args, startState, firemethods ;

  EventEmitter.call(this) ;

  this.desc = desc ;
  
  // Get name
  this.name = this._getName() ;
  this.uniqueName = this.name + '#' + _factoryId.toString(16);
  _factoryId += 1 ;

  this.options = options || {} ;
  if (desc.defaults && desc.defaults.options) {
    this.options = _.defaults(this.options, desc.defaults.options) ;
  }
  this.options = _.defaults(this.options, _defaultOptions) ;
  
  this.imports = imports || {} ;
  if (desc.defaults && desc.defaults.imports) {
    this.imports = _.defaults(this.imports, desc.defaults.imports) ;
  }
  
  this.setMaxListeners(this.options.maxListeners || 50) ;
  
  this.pluginMgr = new PluginMgr(this, this.options.plugins) ;
  this.addonMgr = new AddonMgr(this, this.options.addons) ;
  
  firemethods = this.pluginMgr.getFireMethods() ;
  // Create factory to create 'Fire' proxy object to be used in state
  // handler functions.
  _.defaults(firemethods, _firemethods) ;
  this.firefactory = fireFactory(this, firemethods) ;
  this.firemethods = firemethods ;
  
  // Each spawned StateMachine has a unique ID generated from this: 
  this.maxid = 0 ; //new Date() ;
  
  this.startcount = 0 ;
  this._running = [] ;
  this._count = 0 ;
  
  // Create threshold helpers
  this.setThreshold = 
    Factory.prototype.setThreshold.bind(this) ;
  this.clearThreshold = 
    Factory.prototype.clearThreshold.bind(this) ;
  _.each(_thresholdLogics, function (logicfn, logicname) {
    this.setThreshold[logicname] = 
      Factory.prototype.setThreshold.bind(this, logicname) ;
    this.clearThreshold[logicname] = 
      Factory.prototype.clearThreshold.bind(this, logicname) ;
  }, this) ;
  this.thresholds = {  } ;
  
  // Set-up API on the factory. These are called for all running machines
  _.each(desc.prototype, function (val, key) {
    if (typeof key === "function") {
      this[key] = _apiCall(this, key, val) ;
    } else {
      this[key] = val ;
    }
  }, this) ;
  _.each(desc.api, function (key) {
      this[key] = _apiFn(this, key) ;
  }, this) ;
  
  if (this.addonMgr.initAddons()) {
    this.DebugEmitter = EventEmitter ;
  }
}

util.inherits(Factory, EventEmitter) ;

/**
 * Spawn a new state machine, forwarding the arguments.
 * 
 * @param {...} var_args State machine arguments
 * @return {Object} StateMachine state machine object (EventEmitter)
 */
Factory.prototype.spawn = function spawn () {
  var args = Array.prototype.slice.call(arguments, 0) ;
  return this._spawn(args) ;
} ;

/**
 * Spawn a new state machine, and register a callback function
 * to be invoked on the machine's exit. All but the last argument is
 * forwarded to the state machine, the last argument is the
 * callback.
 * 
 * @param {...} var_args State machine arguments
 * @param {Function} callback Callback
 * @return {Object} StateMachine state machine object (EventEmitter)
 */
Factory.prototype.spawnWithCb = function spawnWithCb () {
  var cb, jsm, args = Array.prototype.slice.call(arguments, 0) ;
  
  cb = args.pop(args) ;
  jsm = this._spawn(args) ;
  
  _setCallback(jsm, cb) ;
  return jsm ;
} ;

/**
 * Launch a new machine, using default vales
 * 
 * @param {Object} defaults Default values to use (overrides SMGF.defaults object) 
 * @return {Object} StateMachine state machine object (EventEmitter)
 */
Factory.prototype.launch = function launch ( defaults ) {
  var args, jsm ;

  defaults = defaults || {} ;
  _.defaults(defaults, this.desc.defaults || {}) ;
  if (defaults.args) {
    // Copy arguments list
    args = defaults.args.slice(0) ;
  } else {
    args = [] ;
  }

  jsm = this._spawn(args) ;
  
  if (defaults.callback) {
    _setCallback(jsm, defaults.callback) ;
  }
  
  if (defaults.on) {
    _.each(defaults.on, function (listener, evt) {
      jsm.on(evt, listener) ;
    }) ;
  }
  if (defaults.once) {
    _.each(defaults.once, function (listener, evt) {
      jsm.once(evt, listener) ;
    }) ;
  }
  
  return jsm ;
} ;

Factory.prototype.broadcast = function (eventName) {
	var evtargs = Array.prototype.slice.call(arguments, 0) ;
	return this._broadcast(null, evtargs) ;
} ;

/**
 * Create a skeleton state machine description object.
 */
Factory.prototype.createSkeleton = function createSkeleton (defaultStates) {
  return this._skeleton({}, [], defaultStates) ;
} ;

Factory.prototype.count = function () {
  return this._count ;
} ;

Factory.prototype.setThreshold = function (logic, level) {
  if (! _thresholdLogics[logic]) {
    return ;
  }
  
  this.thresholds[logic] = this.thresholds[logic] || [] ;
  
  this.thresholds[logic].push(level) ;
  
  if (_thresholdLogics[logic](level, this._count, 0)) {
    var that = this, count = this._count ;
    process.nextTick(function () {
      that.emit('threshold', logic, count, 0) ;
    }) ;
  }
} ;

Factory.prototype.clearThreshold = function (logic, level) {
  var t = this.thresholds[logic], index ;
  if ((! _thresholdLogics[logic]) || (!t)) {
    return ;
  }
  index = t.indexOf(level) ;
  if (index >= 0) {
    t.splice(index, 1) ;
  }
  return ;
} ;

/*=============================================================================
 * Internal methods
 *===========================================================================*/

Factory.prototype._spawn = function _spawn (args, parent) {
  var jsm, evt, jsmfact=this ;
  
  // Create new state machine (won't start until nextTick())
  jsm = new StateMachine(this, args, parent) ;
  
  // Emit 'new' event
  jsm.once('enter', function () {
    jsmfact.emit('entry', jsm.id, jsm) ;
  }) ;
  
  // Register listeners to catch state machine's exit
  jsm.once('done', function (jsmdone, type, err) {
                    var pos, args = Array.prototype.slice.call(arguments, 0) ;
                    jsmfact._count -= 1 ;
                    
                    pos = jsmfact._running.indexOf(jsmdone) ;
                    if (pos >= 0) {
                      jsmfact._running.splice(pos, 1) ;
                    }
                    
                    jsmfact._checkThresholds(jsmfact._count, -1) ;
                    if (jsmfact._count === 0) {
                      jsmfact.emit('quiet') ;
                    }
                    
                    args.unshift("done") ;
                    jsmfact.emit.apply(jsmfact, args) ;
                    
                    jsmfact = null ; jsm = null ; evt = null ;
                  }) ;

  this.addonMgr.attachAddons(jsm) ;
  
  // Increase running count and check threshold
  this._count += 1 ;
  this._running.push(jsm) ;
  jsmfact._checkThresholds(jsmfact._count, 1) ;
  
  return jsm ;
} ;

Factory.prototype._broadcast = function (source, evtarray, argshift) {
  _.each(this._running, function (jsm) {
    jsm._futureInject(source, evtarray, argshift) ;
  }) ;
} ;

Factory.prototype._checkThresholds = function _checkThresholds (count, change)
{
  _.each(_thresholdLogics, function (logicfn, logicname) {
    var i, list = this.thresholds[logicname] ;
    if (!list) {
      return ;
    }
    for (i=0;i<list.length;i++) {
      if (logicfn(list[i], count, change)) {
        this.emit('threshold', logicname, count, change) ;
      }
    }
  }, this) ;
} ;

Factory.prototype._getid = function _getid () {
  this.maxid += 1 ;
  return _s.pad(this.maxid.toString(16), 4, '0') ;
} ;

/* Work out the state machines name - this is found by looking
 * through the following until a non-null name is found:
 *   - the state machine description's function name
 *   - a name attribute set on the state machine's description (sm_desc.name)
 *   - a name set within the description
 *   - a auto-generated name based on creation time
 */
Factory.prototype._getName = function _getName () {
  var fnp = new FnParse(this.desc), i, name,
      tryfns = [
                function () {
                  return fnp.getFnName() ;
                },
                function () {
                  return this.desc.smName ;
                },
                function () {
                  return this.createSkeleton().name ;
                },
                function () {
                  if (this.options) {
                    return this.options.name ;
                  }
                },
                function () {
                  return "StateMachine:"+ new Date().toUTCString().substring(0,21) ;
                }
                ] ;
  for (i=0;i<tryfns.length;i++) {
    name = tryfns[i].apply(this) ;
    if (name) {
      return name ;
    }
  }
  return "Should Not Have This Name" ;
} ;

Factory.prototype._skeleton = function _skeleton (sm, args, defaultStates) {
  var startState, s ;
  
  startState = this.desc.apply(sm, args) ;
  if (typeof startState === "object") {
    _.extend(sm, startState) ;
    startState = sm.startState ;
  }
  if (! sm.startState) {
    sm.startState = startState ;
  }

  if (sm.defaults) {
    igniteUtils.expandListsIntoSubobj(sm.defaults, 
        ["ignore", "error", "defer"], "actions", 
        ["@ignore", "@error", "@defer"]) ;
  }
  s = sm ;
  _.each(sm.states, function (state, sname) {
    if (typeof state === "function") {
      sm.states[sname] = state = state.apply(this) ;
    }
    
    if (!state.actions) {
      state.actions = {} ;
    }
    
    igniteUtils.expandListsIntoSubobj(state, 
        ["ignore", "error", "defer"], "actions",
        ["@ignore", "@error", "@defer"]) ;

    if (sm.defaults) {
      _.defaults(state.actions, sm.defaults.actions) ;
      _.defaults(state, sm.defaults) ;
    }
  }) ;

  if (!defaultStates) {
    defaultStates = {
        "@enter": {},
        "@exit": {},
        "@error": {}
    } ;
  } 

  // Create special '@' states, if they aren't already defined
  for (s in defaultStates) {
    if (!(s in sm.states)) {
      sm.states[s] = defaultStates[s] ;
    }
  }
  
  sm.jsmFactory = this ;
  
  return sm ;
} ;
  

Factory.prototype._fix = function _skeleton2 (sm) {
  _.each(sm.states, function (state, sname) {
    state._fnList = [] ;
    if (state.entry || state.exit) {
      state._fnList.push([state.entry, state.exit]) ;
    }
    
    this.pluginMgr.fixupState(state, sname) ;
  }, this) ;
  return sm ;
} ;

var _thresholdLogics = {
    "lessthan": function (level, count, change) {
      return (count < level) ;
    },
    "greaterthan": function (level, count, change) {
      return (count > level) ;
    },
    "high": function (level, count, change) {
      return (count === level) && (change > 0) ;
    }, 
    "low": function (level, count, change) {
      return (count === level) && (change < 0) ;
    }
} ;

module.exports = Factory ;