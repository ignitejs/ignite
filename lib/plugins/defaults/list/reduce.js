/* ignite.js Plugin 'reduce'
 * 
 * For each entry of an array kick off an asynchronous function and 
 * by calling a function for each of the results, create a single value.
 * 
 * Parameters:
 * 
 *    reduce {String|Function} Async function or, if a string, the name
 *                          of the asynchronous function (which can be
 *                          found in the JSFactory imports). Using a string
 *                          helps create better diagrams for very little
 *                          overhead.
 *    over {Array|Function} Allows the array which should be iterated over
 *                          to be set. 
 *    argfn {Function}      A function, called for each element of the array,
 *                          which should return an array of arguments to pass
 *                          to the async function. This function is passed
 *                          the current item on the array and its position.
 *                          If not set, then the async function is called with
 *                          a single argument - the current object on the array.
 *    iterator {Function}   The function to call for each result, called with
 *                          the memo value, followed by the non-error arguments
 *                          returned by the async function.
 *    memo {Anything}       The original value to set the memo to (default 0).
 *    par {Number}          Set the maximum number of parallel asynchronous
 *                          calls.
 *     
 * Events:
 * 
 *    "reduce.done" [result, inarray, errarray]
 *                          Reduce is complete. Returns the calculated value, 
 *                          along with the original array.
 *                          
 */
var util = require('util'),
    pluginUtils = require('../../../utils/pluginUtils') ;

function ReducePlugin (piApi, name) {
  piApi.registerStatePI(name, {
   initState: function (statename, state) {
//     if (typeof state[name] !== "object") {
//       pluginUtils.convertToObj(this, statename, state, name) ;
//     }
     
     pluginUtils.strtofn(this, statename, state, name) ;
   },
   state: {
     entry: function () {
       var state = this.state, piObj = state[name], _priv ;
       _priv = pluginUtils.arrayEachEmitter.call(this, name, arguments[0]) ;
       if ("memo" in piObj) {
         _priv.memo = piObj.memo ;
       } else {
         _priv.memo = 0 ;
       }
       _priv.errarray = [] ;
       state[name][this.privName] = _priv ;
       
       _priv.ee.launch() ;
     },
     exit: function () {
       delete this.state[name][this.privName] ;
     },
     actions: {
       "_each.newListener": "@ignore",
       "_each._fire": "@ignore",
       "_each._done": function (pos, fnargs, err) {
         var args , piObj = this.state[name], _priv = piObj[this.privName] ;
         if (err) {
           _priv.errarray[pos] = err ;
         } else {
           args = Array.prototype.slice.call(arguments, 2) ;
           args[0] = _priv.memo ;
           args[args.length] = fnargs ;
           _priv.memo = piObj.iterator.apply(this, args) ;
         }
       },
       "_each._alldone": function (length) {
         var piObj = this.state[name], _priv = piObj[this.privName] ;
         var evt = [name+".done", _priv.memo, _priv.array] ;
         this._inject(_priv.src, evt) ;
       }
     }
   },
   graph: pluginUtils.EachEmitter.graph,
   graphfns: pluginUtils.EachEmitter.stdFnList
  }) ;
} ;

module.exports = ReducePlugin ;