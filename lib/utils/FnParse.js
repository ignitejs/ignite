var _ = require('underscore'),
    util = require('util'),
    jsparse = require('uglify-js/lib/parse-js'),
    ugProcess = require('uglify-js/lib/process');


var _dump = function (tree, indent) {
  var i ;
  if (!tree) return ;
  if (!indent) indent = "  " ;
  else indent += "  " ;
  
  for (i=0;i<tree.length;i++) {
    
    if (tree[i] === null) {
      util.debug(indent + i + ": null") ;
    } else if (typeof tree[i] === "object") {
      util.debug(indent + i + ": [Object]") ;
      _dump(tree[i], indent) ;
    } else {
      util.debug(indent + i + ": " + tree[i]) ;
    }
  }
} ;

/**
 * Constructor for a new FnParse instance bound to the
 * specified function.
 * 
 * @param {Function} fn Function to parse and analyse.
 * @constructor
 */
var FnParse = function (fn) {
  if (typeof fn !== "function") {
    throw new Error("Non function") ;
  }

  this.fns = "var fn = "+fn.toString() ;
//  util.debug(this.fns) ;
  this.ast = jsparse.parse(this.fns) ;
  // Skip top levels
  this.ast = this.ast[1][0][1][0][1] ;
  
  this.walker = ugProcess.ast_walker(this.ast) ;
  this.firename = "fire" ;
//  util.debug(util.inspect(this.past)) ;
  
//  _dump(this.ast) ;
} ;

/**
 * Return the name of a named function.
 */
FnParse.prototype.getFnName = function getFnName() {
  return (this.ast[1]) ;
} ;

/**
 * Return the name of a named function.
 */
FnParse.prototype.getFnSignature = function getSignatureName(anonText) {
  var i, sig = "",
      fnName = (this.ast[1]),
      args = this.ast[2].slice(0) ;

  fnName = fnName || anonText || "[fn] " ;
  
  sig = sig + fnName + "(" ;
  for (i=0;i<args.length;i++) {
    if (i > 0) {
      sig += ", " ;
    }
    sig += args[i] ;
  }
  sig += ")" ;
  return sig ;
} ;



/**
 * Return all the function calls made in the analysed function.
 * 
 * The returned array contains an object for each call, with the
 * object containing an 'fn' property, which is the textual name
 * of the function, and an 'args' property which is a list of
 * the textual arguments.
 * 
 * @return An array containing function calls.
 */
FnParse.prototype.getCalls = function getCalls() {
  var walker = this.walker, walk = walker.walk, ast = this.ast,
        calls = [] ;
  
  walker.with_walkers(
      {
        "call": function (expr, args) {
          var fntxt, fnargs=[], i ;
          
          fntxt = ugProcess.gen_code(expr) ;
          for (i=0;i<args.length;i++) {
            fnargs.push(ugProcess.gen_code(args[i])) ;
          }
          
          calls.push({fn: fntxt, args: fnargs}) ;
        }
      }, function () { 
        return walk(ast) ;
      }) ;
  
//  util.debug(util.inspect(calls)) ;
  return calls ;
} ;

/**
 * Return a list of the arguments to the function.
 * 
 * @return An array containing the functions argument names.
 */
FnParse.prototype.getArgs = function getReturns() {
  var walker = this.walker, walk = walker.walk, ast = this.ast,
        args ;

  args = [].concat(ast[2]) ;
  
//  util.debug(util.inspect(args)) ;
  return args ;
} ;

/**
 * Returns all the statically declared return values within a function.
 * 
 * @returns An array of return values
 */
//TODO: Lower probability in for, while and other loops
FnParse.prototype.getReturns = function getReturns() {
  var walker = this.walker, walk = walker.walk, ast = this.ast, topbody = ast[3] ;
  var probability = 1.0 ;
  var probsum = 0 ;
  var returns = [] ;
  var returns_push = function (v) {
    if (returns.indexOf(v) < 0) {
      returns.push(v) ;
    }
  } ;

  this.walker.with_walkers(
    {
      "return": function (expr) {
        var ret ;
//        util.debug("Found return! "+probability) ;
        probsum += probability ;
        if (!expr) {
          returns_push(undefined) ;
        }
        ret = [ this[0], walker.with_walkers(
            {
              "num": function (v) { returns_push(v); return true ; },
              "string": function (v) { returns_push(v); return true ; },
              "name": function (v) { 
                if (v === "null") returns_push(null);
                else if (v === "undefined") returns_push(undefined);
              },
              "array": function (v) {
                returns_push(v[0][1]) ;
                return true ;
              }
            }, function () { walk (expr); }) ];
        return ret ;
      },
      "if": function(cond, t, e) {
        var ret, wcond, wt, we ;
        
        wcond = walk(cond) ;
        probability = probability / 2 ;
        wt = walk(t) ;
        we = walk(e) ;
        probability = probability * 2 ;
        
        ret = [ this[0], wcond, wt, we ];
        return ret ;
      },
      "switch": function(expr, body) {
        var shift, rem, mult ;
        var bb = [] ;
        var ret = [ this[0], walk(expr), bb ] ;
        var has_default = false ;
        var prevprob = 0 ;
        _.each(body, function (branch) {
            if (!branch[0]) {
              has_default = true ;
            }
          }) ;
        
        /* Work out the nearest power of two to the number of elements in
         * the switch statements - this just ensures the floating point
         * maths doesn't get complicated with silly little rounding errors.
         */
        shift = Math.ceil(Math.LOG2E * Math.log(body.length+(has_default?0:1))) ;
        mult = 1.0 / ( 1 << shift) ;
        rem = (1.0 - (mult*(body.length-(has_default?1:0)))) ;
        
        _.each(body, function(branch){
          var bret, has_break ;
          var oldprob = probability ;
          
          if (branch[0]) {
            // Normal case statement
            probability = prevprob + (probability * mult) ;
            bret = [ walk(branch[0]), [_.each(branch[1], walk)] ];
          } else {
            // Default statement
            probability = prevprob + (probability * rem) ;
            bret = [ null, [_.each(branch[1], walk)] ];
          }
          has_break = _.reduce(branch[1], function (memo, s) {
            return memo || (s[0] === "break" || s[0] === "return") ;
          }, false) ;
          if (has_break) {
            prevprob = 0 ;
          } else {
            prevprob = probability ;
          }
          probability = oldprob ;
        }) ;
        return ret;
      },
      "function": function (fnname, args, body) {
        if (topbody === body) {
          return [ this[0], fnname, args.slice(), ugProcess.MAP(body, walk) ];
        } else {
          return false ;
        }
      }
    }, function () { 
      return walk(ast) ;
    }) ;
  
  if (probsum < 1) {
    returns_push(undefined) ;
  }
  return returns ;
} ;


module.exports = FnParse ;