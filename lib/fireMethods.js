/*=============================================================================
 * Special 'fire' object methods
 *===========================================================================*/
var util = require('util') ;
var _firemethods = {} ;

_firemethods.$cb = function (cbval)
{
  var jsm = this ;
  var src = {
      type: "cb"
  } ;

  return function() {
    var args, evtargs = Array.prototype.slice.call(arguments, 0) ;
    evtargs.unshift(cbval);
    args = [src, evtargs] ;
    jsm._inject.apply(jsm, args) ;
  } ;
} ;

_firemethods.$inject = function () {
  var args = Array.prototype.slice.call(arguments, 0) ;
  args.unshift(this) ;
  this._inject.apply(this, args) ;
} ;

_firemethods.$event = _firemethods.$machineEvent = 
function (evtname)
{
  this.emit.apply(this, arguments) ;
} ;

_firemethods.$factoryEvent = _firemethods.$eventFromFactory = 
function (evtname) {
  this.jsmFactory.emit.apply(this.jsmFactory, arguments) ;
} ;

_firemethods.$lastEvtName = function () {
	return this._lastEvtName() ;
} ;

module.exports = _firemethods ;