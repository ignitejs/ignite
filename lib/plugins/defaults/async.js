/*jslint nodejs: true */
/* Plugin 'async'
 * 
 * Kick off an asynchronous function and wait for the reply.
 * 
 * Parameters:
 * 
 *    async {String|Function} Async function or, if a string, the name
 *                            of the asynchronous function (which can be
 *                            found in the JSFactory imports). Using a string
 *                            helps create better diagrams for very little
 *                            overhead.
 *    args  {Array|Function}  Arguments to pass to function. Either a static
 *                            array, or a function returning an array. If not
 *                            set, the current state machine arguments will be
 *                            used.
 * 
 * Events:
 * 
 *    "done" (-err) [args...] Asynchronous function completed with no error.
 *                            Arguments are as returned by the function but
 *                            with the first (error) argument removed.
 *    "err" [err, args...]    Asynchronous function had an error. Arguments
 *                            are as returned by the async function
 */
var pluginUtils = require('../../utils/pluginUtils') ;

function AsyncPlugin (piApi, name) {
  piApi.registerStatePI(name, {
    initState: function (statename, state) {
      if (typeof state[name] !== "object") {
        pluginUtils.convertToObj(this, statename, state, name) ;
      }

      pluginUtils.strtofn(this, statename, state, name) ;
    },
    state: {
      entry: function () {
        var state = this.state, piObj = state[name], cb, args ;

        if (piObj.fnArgs) {
          if (typeof piObj.fnArgs === "function") {
            args = piObj.fnArgs.apply(this, arguments) ;
          } else {
            args = piObj.fnArgs ;
          }
        } else {
          args = this.args ;
        }

        cb = function (err) {
          var cbargs = Array.prototype.slice.call(arguments, 0),
          evt, argshift;
          if (err) {
            evt = name+".err" ;
          } else {
            evt = name+".done" ;
            argshift = [1] ;
          }
          evt = this._makeUniqueToState(evt) ;
          cbargs.unshift(evt) ;
          cbargs.push(args) ;
          this._inject(null, cbargs, argshift) ;
          args = null ; state = null ; cb = null ;
        } ;
        cb = cb.bind(this) ;

        args.push(cb) ;
        try {
          piObj.fn.apply(this, args) ;
        } catch (err) {
          cb(err) ;
        }
      }
    },
    graph: function (statev, state, sname, piname) {
      var attr = statev.attributes ;
      attr.stereotypes.push(name) ;
      statev.hints.fillcolor = "aquamarine3" ;
      attr.entry.hidden = true ;
    },
    graphfns: ["fn", "fnArgs"]
  }) ;
}

module.exports = AsyncPlugin ;