var _ = require('underscore') ;

var util = require('util') ;

function DeferList (jsm) {
  this.jsm = jsm ;
  this.list = [] ;
  this.pos = 0 ;
  this.running = false ;
}


DeferList.prototype.append = function (source, evtarray, argshift) {
  var event ;
  
//  util.debug("defer append: "+util.inspect(evtarray)+" "+util.inspect(source)) ;
  // Don't defer already deferred events:
  if (source && source.deferred) {
    return false ;
  }
  
  // Remove unique name
  event = evtarray[0] ;
  evtarray[0] = event.split(':')[0] ;
  
  source = {} ;
  source.deferred = true ;
  this.list.push({ source: source, evtarray: evtarray, argshift: argshift }) ;
  return true ;
} ;

DeferList.prototype.run = function (curState) {
  var deferred ;
  // Escape now if we are calling this function if we have called
  // this function iteratively or there is nothing to do.
  if ((!this.list.length) || this.running) {
    return ;
  }
//  util.debug("defer run ("+curState+"): "+util.inspect(this.list)+"@"+this.pos) ;
  if (this.jsm.uniquename !== curState) {
    this.pos = 0 ;
    curState = this.jsm.stateName ;
  }
  this.running = true ;
  while (this.pos < this.list.length) {
    if (this.jsm.uniquename !== curState) {
      this.pos = 0 ;
      curState = this.jsm.stateName ;
    }
    
    deferred = this.list[this.pos] ;

    if (this.jsm._inject(deferred.source, deferred.evtarray, deferred.argshift)) {
      this.list.splice(this.pos, 1) ;
    } else {
      this.pos += 1 ;
    }
  }
  this.running = false ;
} ;

module.exports.DeferList = DeferList ;