var _ = require("underscore") ;

var privName = "_eventEmitters" ;

/**
 * Register an event emitter with the state machine. This is registered
 * with the specified name (such that events emitted from it are called
 * 'name.event'). If persistent is not true, then the event emitter is
 * automatically deregistered when the current state is exited.
 */
function _regEventEmitter (name, evtemitter, persistent, emitFnName)
{
  var ems = this[privName], emitter = {} ;
  
  if (name in ems.emitters) {
    this.emit('warn', this, this.stateName, null, "Overwriting EventEmitter '"+name+"'") ;
  }
  
  if (evtemitter._meta) {
    emitter.meta = evtemitter._meta ;
  } else {
    emitter.meta = {
        type: "eventemitter",
        object: "Anon",
        module: "anon"
      } ;
  }
  emitter.type = "eventemitter" ;
  emitter.name = name ;
  emitter.id = this._generateId() ;
  emitter.eventEmitter = evtemitter ;
  emitter.active = [] ;
  emitter.listeners = {} ;
  emitter.persistent = persistent ;
  emitter.emitFnName = emitFnName || "emit" ;
  emitter.origEmitFn = evtemitter[emitter.emitFnName] ;
  
  ems.emitters[name] = emitter ;
  ems.addList.push(name) ;
  if (!persistent) {
    ems.tmpList.push(name) ;
  }

}

/**
 * Deregister the specified event emitter.
 */
function _deregEventEmitter (name)
{
  var ems = this[privName] ;
  
  ems.delList.push(name) ;
}

function _getEventEmitter (name) {
  var ems = this[privName] ;

  if (name in ems.emitters) {
    return ems.emitters[name].eventEmitter ;
  }
  return ;
}


function wrapEmit (jsm, emitter, name) {
  var ee = emitter.eventEmitter, origEmit = ee[emitter.emitFnName] ;
  
  ee[emitter.emitFnName] = function (type) {
    var ret, args = Array.prototype.slice.call(arguments, 0) ;
    
    ret = origEmit.apply(ee, arguments) ;
    args[0] = name + "." + type ;
    ret = jsm._inject(emitter, args) || ret ;
    
    return ret ;
  } ;
  
  ee._restoreEmit = function () {
    ee[emitter.emitFnName] = origEmit ;
    delete ee._restoreEmit ;
  } ;
  
}

function EventEmitterPlugin (piApi, name) {
  piApi.registerStatePI(name, {
    match: true,
    init: function () {
      this[privName] = {
          emitters: {},
          addList: [],
          delList: [],
          tmpList: []
      } ;
    },
    state: {
      entry: function () {
        var ems = this[privName], em, emName ;
        
        while (ems.delList.length) {
          emName = ems.delList.shift() ;
          em = ems.emitters[emName] ;
          em.eventEmitter._restoreEmit() ;
          this.emit('eemit', this, emName, "deregister") ;
          delete ems.emitters[emName] ;
        }
        
        while (ems.addList.length) {
          emName = ems.addList.shift() ;
          em = ems.emitters[emName] ;
          wrapEmit(this, em, emName) ;
          this.emit('eemit', this, emName, "register") ;
          if (em.meta.jsmext && em.meta.jsmext.reg) {
            em.meta.jsmext.reg(this, em.eventEmitter, em) ;
          }
        }
      },
      exit: function () {
        var ems = this[privName], em, emName ;
        while (ems.tmpList.length) {
          emName = ems.tmpList.shift() ;
          em = ems.emitters[emName] ;
          em.eventEmitter._restoreEmit() ;
          this.emit('eemit', this, emName, "deregister") ;
          delete ems.emitters[emName] ;
        }
      }
    },
    deinit: function () {
      var ems = this[privName] ;
      _.each(ems.emitters, function (em, emName) {
        if (em.eventEmitter.hasOwnProperty("_restoreEmit")) {
          em.eventEmitter._restoreEmit() ;
        }
      }, this) ;
    }      
  }) ;
  piApi.registerFireMethod(       "$regEmitter",   _regEventEmitter) ;
  piApi.registerFireMethod(     "$deregEmitter", _deregEventEmitter) ;
  
} ;

module.exports = EventEmitterPlugin ;
