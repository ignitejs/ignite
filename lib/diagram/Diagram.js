var _ = require('underscore'), 
      FnParse = require('../utils/FnParse'),
      util = require('util'),
      fs = require('fs'),
      SubMods = require('../utils/submods').SubMods ;


var processors = new SubMods(module, "processors");

/*=============================================================================
 * Local static definitions
 *===========================================================================*/
var sep = "_" ;
var defaultStates = {
    "@enter": {
      desc: "State machine entry point",
      graph: {
        type: "node",
        hints: {
          shape: "circle",
          fillcolor: "black",
          style: "filled",
          label: "",
          width: 0.2,
          height: 0.2
        }
      },
      "actions": {
        "start": function () {
          return this.startState ;
        }
      }
    },
    "@exit": {
      desc: "State machine exit point",
      graph: {
        type: "node",
        hints: {
          shape: "doublecircle",
          fillcolor: "black",
          style: "filled",
          label: "",
          width: 0.2,
          height: 0.2
        }
      }
    },
    "@error": {
      desc: "State machine exit with error point",
      graph: {
        type: "node",
        hints: {
          shape: "doublecircle",
          fillcolor: "red",
          style: "filled",
          label: "",
          width: 0.2,
          height: 0.2
        }
      }
    }
} ;    
        
/*=============================================================================
 * Local utility functions
 *===========================================================================*/
function join () {
  var args = Array.prototype.slice.call(arguments, 0) ;
  return args.join(sep) ;
}

/*=============================================================================
 * Diagram
 *===========================================================================*/

function Diagram (jsmFactory)
{
  // Set title to state machine name
  this.title = jsmFactory.name ;
  this._jsmFactory = jsmFactory ;
  
  this.elems = {} ;
  this.entry = ["@enter"] ;
  this.exits = ["@exit", "@error"] ;
  
  this.sep = sep ;
  
  // Create skeleton SM to analyse
  this._sm = jsmFactory.createSkeleton(defaultStates) ;
  jsmFactory.pluginMgr.initPlugins(this._sm) ;

  this.stateList = _.keys(this._sm.states) ;
  
  _.each(this._sm.states, this.analyseState, this) ;
}

Diagram.sep = sep ;

Diagram.prototype.analyseState = function analyseState (state, sname) {
  var cluster, returns, r ;
  var staten, statev ;
  var fnp ;
  
  cluster = this.elems[sname] = {
      type: "cluster",
      name: sname,
      fullname: sname,
      elems: {}
  } ;
   
  staten = join(sname, "state") ;
  cluster.entry = "state" ;
  
  statev = cluster.elems.state = {
      type: "node",
      subtype: "state",
      fullname: staten,
      name: "state",
      attributes: {
        internal: {
          pluginfns: {},
          trans: {},
          defer: {},
          ignore: {}
        },
        entry: {},
        exit: {},
        plugins: [],
        stereotypes: []
      },
      hints: {
        label: sname
      }
  } ;
      
  statev.desc = state.desc ;
  
  if (state.entry) {
    fnp = new FnParse(state.entry) ;
    statev.attributes.entry = {
        hidden: false, 
        fn: state.entry,
        FnParse: fnp,
        signature: fnp.getFnSignature()
    } ;
    returns = statev.attributes.entry.FnParse.getReturns() ;

    statev.attributes.transient = true ;
    for (r=0;r<returns.length;r++) {
      if (returns[r]) {
        this.addEdge(this, [sname, "_"+returns[r]], [sname, "state"], [returns[r], "entry"]) ;
      } else {
        statev.attributes.transient = false ;
      }
    }
  }
  if (state.exit) {
    fnp = new FnParse(state.exit) ;
    statev.attributes.exit = {
        hidden: false, 
        fn: state.exit,
        FnParse: fnp,
        signature: fnp.getFnSignature()
    } ;
  }  
  
  this.handlePlugins(statev, state, sname) ;
  
  if (state.graph) {
    if (typeof state.graph === "function") {
      state.graph.call(this, statev, state, sname) ;
    } else {
      _.extend(statev, state.graph) ;
    }
  }
  
  if (state.guard) {
    this.handleGuard(cluster, statev, state, sname) ;
  }
  
  this.handleActions(cluster, statev, state, sname) ;
  
} ;

Diagram.prototype.handlePlugins = function handlePlugins(statev, state, sname)
{
  var attr = statev.attributes ;
  var plugins = state._plugins ;
  
  _.each(plugins, function (plugin, piname) {
    if (!(piname in state)) {
      return false ;
    }
    
    attr.plugins.push(plugin) ;
    
    if (plugin.graph) {
      if (typeof plugin.graph === "object") {
        attr.stereotypes.push(piname) ;
        _.extend(statev, state.graph) ;
      } else if (typeof plugin.graph === "function") {
        plugin.graph.call(plugin, statev, state, sname, piname) ;
      }
    }
    
    if (plugin.graphfns) {
      _.each(plugin.graphfns, function (fnname) {
        var piObj = state[piname], pifn, args ;
        if (piObj[fnname]) {
          if (typeof piObj[fnname] === "function") {
            pifn = { 
                fn: piObj[fnname], 
                FnParse: new FnParse(piObj[fnname])
            } ;
            if (piObj["_"+fnname]) {
              pifn.text = piObj["_"+fnname] ;
            } else {
              pifn.text = pifn.FnParse.getFnSignature() ;
            }
          } else if (typeof piObj[fnname] === "string") {
            pifn = {
                text: piObj[fnname]
            } ;
          } else if (typeof piObj[fnname] === "object" && typeof piObj[fnname].name !== undefined) {
            pifn = {
                text: piObj[fnname].name
            } ;
          }
          if (pifn) {
            attr.internal.pluginfns[fnname] = pifn ;
          }
        }
      }) ; 
    }
  }) ;  
} ;

Diagram.prototype.handleGuard = function handleGuard(cluster, statev, state, sname)
{
  var guardn, guardv, returns ;
  
  guardn = "guard" ;
  guardv = cluster.elems.guard = {
      type: "node",
      subtype: "guard",
      name: guardn,
      fullname: join(sname, guardn),
      fn: state.guard,
      FnParse: new FnParse(state.guard)
  } ;
  cluster.entry = guardn ;
  
  returns = guardv.FnParse.getReturns() ;
  
  _.each(returns, function (retval) {
    var dest, graph ;
    if (retval == null) {
      retval = "state" ;
      dest = [sname, "state"] ;
      graph = cluster ;
    } else {
      dest = [retval, "entry"] ;
      graph = this ;
    }
    this.addEdge(graph, [sname, guardn, retval], [sname, guardn], dest) ; 
    
  }, this) ;
} ;


Diagram.prototype.handleActions = function handleActions (cluster, statev, state, sname)
{
  var that = this ;
  _.each(state.actions, function (action, evtname) {
    var edge, edgename, deststate, handleAction ;

    if (sname === "@enter" && evtname === "start") {
      action = that._sm.startState ;
    }
    
    handleAction = function (actstr, edgename, start)
    {
      var elem = that ;
      if (actstr.charAt(0) === '@') {
        if (actstr === "@self") {
          actstr = sname ;
          elem = cluster ;
        } else if (actstr === "@next") {
          actstr = state.next ? state.next : "@next" ;
        } else if (actstr === "@ignore") {
          statev.attributes.internal.ignore[evtname] = true ;
          return ;
        } else if (actstr === "@defer") {
          statev.attributes.internal.defer[evtname] = true ;
          return ;
        }
      }
      
      return that.addEdge(elem, edgename, start, [actstr, "entry"], evtname) ;
    } ;
    
    if (typeof action === "string") {
      handleAction(action, [sname, evtname], [sname, "state"]) ;
    } else if (_.isArray(action)) { 
    } else if (typeof action === "function") {
      var actfn, actfnname, returns, actFnParse ;
      actFnParse = new FnParse(action) ;
      returns = actFnParse.getReturns() ;
      
      if (returns.length === 1 &&
          !returns[0]) {
        // Internal transition only - remove actfn and edge and
        // place within state instead.
        statev.attributes.internal.trans[evtname] = {
            fn: action,
            FnParse: actFnParse,
            text: actFnParse.getFnSignature() 
        } ;
      } else {
        // Create action function for this state (if it does not exist)
        actfn = _.detect(cluster.elems, function (elem, key) {
          if (elem.type === "node" &&
              elem.subtype === "actfn" &&
              elem.fn === action) {
            actfnname = elem.name ;
            return true ;
          }
          return false ;
        }) ;
        if (!actfn) {
          actfnname = join("actfn",evtname) ;
          actfn = cluster.elems[actfnname] = {
              type: "node",
              subtype: "actfn",
              fn: action,
              FnParse: actFnParse,
              name: actfnname,
              fullname: join(sname, actfnname)
          } ;
        }
        // First edge into action function
        that.addEdge(cluster, [sname, evtname], [sname, "state"], [sname, actfnname], evtname) ;
      
        // Now we loop through possible exits from the
        // action function to see where we can go
        _.each(returns, function (retval) {
          var edge ;
          
          if (retval != null) {
            handleAction(retval, [sname, evtname, retval], [sname, actfnname]) ;
          } else {
            edge = that.addEdge(cluster, [sname, evtname, "int"], [sname, actfnname], [sname, "state"], evtname) ;
            edge.attributes.internal = true ;
          }
        }) ;
      }
    }
  }) ;
  
} ;

Diagram.prototype.addEdge = function addEdge (cluster, splitname, start, dest, evtname) {
  var startStatePos, destStatePos, edgeDir, edge, edgename = splitname.join('/') ;
  
  startStatePos = this.stateList.indexOf(start[0]) ;
  destStatePos = this.stateList.indexOf(dest[0]) ;
  
  if (start[0] === "@enter" || destStatePos > startStatePos) {
    edgeDir = 1 ;
  } else if (destStatePos < startStatePos) {
    edgeDir = -1 ;
  } else {
    edgeDir = 0 ;
  }
  
  edge = cluster.elems[edgename] = {
    type: "edge",
    name: edgename,
    fullname: edgename,
    attributes: {
      event: evtname,
      edgeDir: edgeDir
    },
    src: start,
    dst: dest
  } ;
  return edge ;
} ;

Diagram.prototype.process = function process (opts) {
  var processor, Processor ;
  opts.processor = opts.processor || processors.def ;
  opts.level = opts.level || 2 ;
  try {
    Processor = processors.load(opts.processor) ;
  } catch (e) {
    throw new Error("Unknown graph processor '"+opts.processor+"'") ;
  }
  
  processor = new Processor(this, opts.level, opts.options) ;
  
  return processor.generate() ;
} ;

Diagram.prototype.processAndWrite = function (filename, opts) {
  opts = opts || {} ;
  var text = this.process(opts) ;
  
  fs.writeFileSync(filename, text) ;
  return text ;
} ;


module.exports = Diagram ;
