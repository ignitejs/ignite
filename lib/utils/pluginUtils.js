var util = require('util'),
    igniteUtils = require('./igniteUtils'),
    _ = require('underscore'),
    EachEmitter = require('./EachEmitter') ;

module.exports.EachEmitter = EachEmitter ;

function arrayEachEmitter (name, defarray) {
  var piObj = this.state[name], array, ee ;
  
  if (piObj.over) {
    if (typeof piObj.over === "function") {
      array = piObj.over.apply(this, this.args) ;
    } else {
      array = piObj.over ;
    }
  } else {
    array = defarray ;
  }
          
  ee = new EachEmitter(array, piObj.fn, piObj) ;
  
  this.fire.$regEmitter("_each", ee) ;
 
  return { ee: ee, array: array, src: { type: "plugin", name: name, meta: {}} } ;
}

module.exports.arrayEachEmitter = arrayEachEmitter ;

function convertToObj (sm, statename, state, piName, defaults) {
  defaults = defaults || {} ;
//  console.log(piName, ":", typeof state[piName]) ;
  if (typeof state[piName] === "function" || 
      typeof state[piName] === "string") {
    // Assume that this should be set as 'fn' within the object
    var obj = _.clone(defaults) ;
    
    obj.fn = state[piName] ;
    state[piName] = obj ;
  } else {
    throw sm._error("Bad property for plugin '"+piName+"'.", statename) ;
  }
}

module.exports.convertToObj = convertToObj ;


function strtofn (sm, statename, state, piName) {
  var piObj = state[piName], splitname ;
  if (typeof piObj.fn === "string") {
    piObj._fn = piObj.fn ;
    splitname = piObj.fn.split('.') ;
    piObj._fnname = splitname.pop() ;
    piObj._fnmodule = splitname.join('.') ;
    piObj.fn = igniteUtils.findFn(sm.jsmFactory.imports, piObj._fn) ;
  }
  
  if (typeof piObj.fn !== "function") {
    throw sm._error("Bad asynchronous function for '"+piName+"' plugin.", statename) ;
  }
}

module.exports.strtofn = strtofn ;