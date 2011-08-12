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
/** StateMachineachine - A JavaScript UML State Machine Engine
 */
var _ = require('underscore'),
    fs = require('fs'),
    EventEmitter = require('events').EventEmitter,
    util = require('util'),
    DeferList = require('./utils/DeferList').DeferList ;

var _defaultStates;

var _calcRightMatch = function (current, evtname) {
  var match = (/\w+?(\..+$)/).exec(current) ;
  if (match) {
    return match[1] ;
  }
  return "" ;
} ;

var _apiFn = function (jsm, name) {
  name = "api." + name ;
  return function () {
    var args = Array.prototype.slice.call(arguments, 0) ;
    args.unshift(name) ;
    jsm._futureInject(null, args) ; 
  } ;
} ;

/**
 * Create a state machine instance, based on a state machine factory.
 * 
 * @param {StateMachineachine} State machine factory
 * @param All other arguments passed to state machine init function.
 * 
 * @constructor
 */
var StateMachine = function StateMachine (jsmFactory, args, parent)
{
  var startState, s, ds, descargs = args.slice(0), that = this ;
  
  EventEmitter.call(this) ;
  
  // Initialise ID and name
  this.id = jsmFactory._getid() ;
  this.name = jsmFactory.name+':'+this.id ;
  
  // Private name - used by plugins to store SM private data
  this.privName = "_" + this.name ;
  
  // Parent is null by default
  this.parent = parent ;
  
  // Create special 'fire' object
  this.fire = jsmFactory.firefactory(this) ;
  
  // List of known EventEmitters
  this.emitters = {} ;

  // State change count
  this.changeCount = 0 ;
 
  descargs.unshift(this.fire) ;
  jsmFactory._skeleton(this, descargs, _defaultStates(this.fire)) ;
  
  // Analyse states for plug-in use
  // TODO: optimise what can be pre-calc'd in the factory
  jsmFactory.pluginMgr.initPlugins(this) ;

  jsmFactory._fix(this) ;

  // Set-up API by copying prototype and setting up functions on
  // the API list given on the SMGF
  _.each(jsmFactory.desc.prototype, function (val, key) {
    if (typeof key === "function") {
      this[key] = val.bind(this) ;
    } else {
      this[key] = val ;
    }
  }, this) ;
  _.each(jsmFactory.desc.api, function (key) {
      this[key] = _apiFn(this, key) ;
  }, this) ;
  
  // Critical is set to true when running entry & exit functions
  this._critical = false ;
  
  // Copy arguments
  this.args = args.slice(0) ;
  this.event = null ;
  
  // Clear deferred event list
  this.deferList = new DeferList(this) ;
  
  // Start in the "@enter" state
  this.stateName = "@enter" ;
  this.state = this.states[this.stateName] ;
  this.prevStateName = undefined ;
  
  process.nextTick(function () {
    that.emit('ctor', that) ;
    that._inject(null, 'start') ;
    that = null ;
  }) ;
} ;

// StateMachine is an event emitter
util.inherits(StateMachine, EventEmitter) ;

/*=============================================================================
 * Internal Methods
 *===========================================================================*/

/**
 * Inject an event on the next tick.
 * 
 * @param (evtarray) Array containing event name and arguments,
 *                   or string containing event name.
 */
StateMachine.prototype._futureInject = function (source, evtarray, argshift)
{
  var that = this ;
  process.nextTick(function () {
    that._inject(source, evtarray, argshift) ;
    that = null ;
  }) ;
} ;

/**
 * Function to inject an event, with associated arguments
 * and error, into the current state.
 * 
 * The argument should be an array, comprising:
 *      [evtname, args...]
 * or, a simple string representing the event name.
 * 
 * @param (source)   Event source
 * @param (evtarray) Array containing event name and arguments,
 *                   or string containing event name.
 */
StateMachine.prototype._inject = function _inject (source, inevent, argshift)
{
  var fullevtname, evtname, evterr, evtargs, splitevt, target, 
      evtRightMatch, evtlevel=0, l, evtarray,
      notquiet = true ; //(!source || !source.meta || !source.meta.quiet) ;
  

  if (!_.isArray(inevent)) {
    evtarray = [ inevent ].concat(this.args) ;
  } else {
    evtarray = inevent ;
  }
  
  evtname = evtarray[0] ;

  if (this.done) {
    this.emit('warn', this, this.stateName, evtname, "Unexpected event after SM exit.") ;
    return true ;
  }
  
  if (this._critical) {
    // We are in an entry or exit function and something is
    // trying to inject an event - usually because a synchronous
    // function is masquerading as an async function (with a callback).
    // We defer the event until the critical section has finished
    return this.deferList.append(source, evtarray, argshift) ;
  }
  
  this.event = evtarray ;
  
  if (notquiet) {
    this.emit('event', this, evtname, evtarray);
  }

  splitevt = evtname.split(':') ;
  if (splitevt.length > 1) {
    // This is a transient event, usually caused by an async
    // function's callback.
    
    // Need to match the state and count number to see if this
    // event is still valid.
    if (splitevt[1] !== this.uniquename) {
      this.emit('warn', this, this.stateName, evtname, "Late transient event (Current state: "+this.uniquename+").") ;
      return true ;
    }
  }
  
  fullevtname = evtname = splitevt[0] ;
  
  evtRightMatch = fullevtname ;
  evtRightMatch = _calcRightMatch(evtRightMatch, evtname) ;

  while (evtname) {   
    
    // Try left match
    target = this.state.actions[evtname] ;
    if (target) {
      evtargs = evtarray.slice(1) ;
      if (argshift && evtlevel<argshift.length) {
        evtargs = evtargs.slice(argshift[evtlevel]) ;
      }
    } else {
      // Try right match
      target = this.state.actions[evtRightMatch];
      if (target) {
        evtargs = evtarray.slice(1) ;
        if (argshift) {
          l = evtRightMatch === "" ? argshift.length : (evtRightMatch.split('.').length-2) ;
          if (l < argshift.length) {
            evtargs = evtargs.slice(argshift[l]) ;
          }
        }
      }
    }
    
    while (target) {
      if (typeof target === "string") {
        if (target === "@self") {
          // External transition
          return this._change(this.stateName, evtargs) ;
        } else if (target === "@defer") {
          return this.deferList.append(source, evtarray) ;
        } else if (target === "@ignore") {
          return true ;
        } else if (target === "@next") {
          return this._change(this.state.nextState, evtargs) ;
        }
        return this._change(target, evtargs) ;
      } else if (typeof target === "function") {
        // Guard function - returns either the state, "@self"
        // (for an external transition) or null (for an internal transition)
        if (notquiet) {
          this.emit('call', this, this.stateName+"/action/"+evtname) ;
        }
        
        try {
          target = target.apply(this, evtargs) ;
        } catch (err) {
          throw this._error("Exception in action for '"+evtname+"'", null, err) ;
        }
        
        if (!target) {
          // Internal transition
          return true ;
        }
      } else if (_.isArray(target)) { 
        evtargs = target.slice(1) ;
        target = target[0] ;
      } else {
        evtargs.unshift(new Error("Bad state change target: ["+target.toString()+"].")) ;
        return this._change("@error", evtargs) ;
      }
    }
    
    // Event not found, try higher level of event (e.g. readFile.done becomes readFile)
    splitevt = evtname.split('.') ;
    splitevt.pop() ;
    if (splitevt.length) {
      evtname = splitevt.join('.') ;
      evtlevel += 1 ;
      evtRightMatch = _calcRightMatch(evtRightMatch, evtname) ;
    } else {
      if (this.parent) {
        // Bubble event up to parent
        
        if (_.isArray(inevent)) {
          inevent[0] = fullevtname ;
        } else {
          inevent = fullevtname ;
        }
        
        this.parent._inject(this, inevent, argshift) ;
      } else {
        this.emit('warn', this, this.stateName, evtname, "Unexpected event '"+fullevtname+"'.") ;
        if (this.jsmFactory.options.strict) {
          evtargs.unshift(new Error("Event ["+evtname+"] received in ["+this.stateName+"].")) ;
          return this._change("@error") ;
        }
        
        // Otherwise ignore
        return true;
      }
    }
  }
} ;

/**
 * Method to return the name of the last event received by
 * the state machine.
 */
StateMachine.prototype._lastEvtName = function _lastEvtName () {
  if (!this.event) {
    return null ;
  }
  
  return ((this.event[0]).split(':'))[0] ;
} ;

StateMachine.prototype._makeUniqueToState = function _makeUniqueToState(evtname) {
  return evtname + ":" + this.uniquename ;
} ;

StateMachine.prototype._error = function _error (msg, statename, origErr) {
  var err, postfix = " (SM: "+this.name ;
  statename = statename || this.stateName ;
  
  if (statename) {
    postfix += ", State: "+statename ;
  }
  postfix += ")" ;
  
  msg = msg + postfix;

  if (origErr) {
    origErr.message = origErr.message + "\n\tignite info: " + msg ;
    err = origErr ;
  } else {
    err = new Error(msg) ;
  }

  if (this instanceof StateMachine) {
    err.ignite = {
      stateName: this.stateName,
      prevStateName: this.prevStateName,
      lastEvent: _.clone(this.event),
      TA: _.clone(this.args)
    } ;
  } ;

  return err ;
} ;

StateMachine.prototype._enterOrExit = function (leg, args) 
{
  var state = this.state, fnList = state._fnList,
        pos = state._fnList.length, result=null, fn ;
  
  this._critical = true ;
  
  if (leg === 0) {
    // Entry leg - call entry functions in turn
    // escaping back down the exit leg if any function
    // returns a non-false result
    pos = 0 ;
    while (pos < fnList.length) {
      fn = fnList[pos][0] ;
      if (fn) {
        this.emit("call", this, this.stateName+"/entry/"+pos) ;
        try {
          result = fn.apply(this, args) ;
        } catch (err) {
          throw this._error("Exception in entry function ("+pos.toString()+")", null, err) ;
        }
      }
      pos += 1 ;
      if (result) {
        break ;
      }
    }
    
    // Made it completely through the leg - return now
    if (!result) {
      this._critical = false ;
      return ;
    }
    
//    // As we are not entering the state, remove any
//    // events added whilst in the entry functions.
//    this.deferred.list.length = inDeferLen ;
  }
  
  // Exit leg - rewind through list calling exit functions
  
  pos -= 1 ;
  while (pos >= 0) {
    fn = fnList[pos][1] ;
    if (fn) {
      this.emit("call", this, this.stateName+"/exit/"+pos) ;
      try {
        fn.apply(this, args) ;
      } catch (err) {
        throw this._error("Exception in exit function ("+pos.toString()+")", null, err) ;
      }
    }
    pos -= 1 ;
  }
  
  this._critical = false ;
  return result ;
} ;

/**
 * Internal function to affect a state change.
 */
StateMachine.prototype._change = function (newstatename, args)
{
  /* LEAVE OLD STATE */
  
  this._enterOrExit(1, args) ;
  
  /* ENTER NEW STATE */
  
  while (newstatename) {
    this.prevStateName = this.stateName ;

    if (_.isArray(newstatename)) {
      args = newstatename ;
      newstatename = args.shift() ;
    }
    if (newstatename.charAt(0) === "@") {
      if (newstatename === "@exit" || newstatename === "@error") {
        // Do nothing - just catch this quickly
      } else if (newstatename === "@self") {
        newstatename = this.stateName ;
      } else if (newstatename === "@next") {
        if (this.state.next) {
          newstatename = this.state.next ;
        } else {
          newstatename = "@error" ;
        }
      } else if (newstatename === "@terminate") {
        return ;
      } else {
        args.unshift(new Error("Unknown special target ["+newstatename+"] received in ["+
            this.stateName+"].")) ;
        newstatename = "@error" ;
      }
    }          
      
    this.args = args;
    
    this.emit('change', this, newstatename, this.stateName) ;
    
    this.state = this.states[newstatename] ;
    if (!this.state) {
      this.state = this.states["@error"] ;
      args.unshift(new Error("Unknown state: "+newstatename)) ;
      newstatename = "@error" ;
    }
    this.stateName = newstatename ;
    
    // Run state guard function, if present
    if (this.state.guard) {
      if (typeof this.state.guard !== "function") {
        throw this._error("guard should be a function");
      }

      this.emit("call", this, this.stateName+"/guard") ;
      try {
        newstatename = this.state.guard.apply(this, args) ;
      } catch (err) {
        throw this._error("Exception in guard function.", null, err) ;
      }
      if (newstatename) {
        continue ;
      }
    }
    
    // Allow transition arguments to be changed
    if (this.state.setTA) {
      if (typeof this.state.setTA === "function") {
        this.emit("call", this, this.stateName+"/setTA") ;
        try {
          args = this.args = this.state.setTA.apply(this, args) ;
        } catch (err) {
          throw this._error("Exception in setTA function.", null, err) ;
        }
      } else if (_.isArray(this.state.setTA) || _.isArguments(this.state.setTA)) {
        args = this.args = this.state.setTA ;
      } else {
        throw this._error("setTA property should be set to a function or array.")
      }
    }
    
    this.changeCount += 1 ;
    this.uniquename = this.stateName + this.changeCount.toString() ;
  
    newstatename = null ;
    
    // Call entry function (if present).
    // Note that this is not scheduled with nextTick() or similar
    // to ensure that it is run before any other events are
    // received.
    newstatename = this._enterOrExit(0, args) ;
  }
  
  // Try inserting deferred events
  this.deferList.run(this.stateName) ;
  
  return true ;
} ;

/**
 * Cause the state machine to exit - this triggers
 * both a 'done' event to be emitted, as well as another
 * event of the specified type, which is usually
 * 'exit' or 'error'.
 */
StateMachine.prototype._exit = function (type)
{
  var that = this ;
  var args = ["done", this, type].concat(this.args) ;
  
  this.done = true ;
  
  this.emit.apply(this, args) ;
  
  delete this.args ;
  process.nextTick(function () {
    var ntargs = [type].concat(args.slice(3)) ;
    that.emit.apply(that, ntargs) ;
  }) ;
  
  this.jsmFactory.pluginMgr.deinitPlugins(this) ;
  // Help the garbage collector
//  this.emitters = null ;
//  this.event = null ;
//  this.jsmFactory = null ;
//  this.fire = null ;
//  this.args = null ;
//  this.state = null ;
//  this.states = null ;
//  this.deferred = null ;
} ;


// Generate a unique ID - used to identify event sources
StateMachine.prototype._generateId = function ()
{
  var id = 0 ;
  this._generateId = function () {
    id = id + 1 ;
    return id ;
  } ;
  return id ;
} ;

/*=============================================================================
 * Basic entry and exit states
 *===========================================================================*/
_defaultStates = function (fire) {
  return {
    "@enter": {
      "exit": function () {
        this.emit('enter', this) ;
      },
      "actions": {
        "start": function () {
          return this.startState ;
        }
      }
    },
    "@exit": {
      "entry": function () {
        // Clear any error condition for a clean exit
        this._exit("exit") ;
        return "@terminate" ;
      }
    },
    "@error": {
      "entry": function (err) {
        //TODO: Make this a better error
        if (!err) {
          err = "State Machine Error" ;
          this.args = [err] ;
        }
        this._exit("error") ;
        return "@terminate" ;
      }
    }
  } ;
} ;

module.exports = StateMachine ;