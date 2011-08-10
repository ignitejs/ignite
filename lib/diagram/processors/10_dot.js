/*jshint curly: false */
var _ = require('underscore'), 
    util = require('util'),
      Diagram = require('../Diagram');

/*=============================================================================
 * Local utility functions
 *===========================================================================*/
var calltemplate = function (templates, tmpltname, that)
{
  var tmplt = templates[tmpltname] ;
  var args = Array.prototype.slice.call(arguments, 3) ;
  if (tmplt) {
    if (typeof tmplt === "string") {
      return tmplt ;
    } else if (typeof tmplt === "function") {
      return tmplt.apply(that, args) ;
    }
  }
  return "" ;
} ;

var setifnotset = function (obj, key, val) {
  if (val === undefined)
    return ;
  
  if (!obj[key])
    obj[key] = val ;
  
  return val ;
} ;

var addifset = function (obj, keys, delimiter) {
  var text = "" ;
  if (!_.isArray(keys)) {
    keys = [keys] ;
  }
  _.each(keys, function (key) {
    if (key in obj) {
      text += key+'="'+obj[key]+'"'+delimiter ;
    }
  }) ;
  return text ;
} ;

var findObj = function (graph, namelist) {
  var pos = 0, obj = graph ;
  while (pos < namelist.length && obj) {
    obj = obj.elems[namelist[pos]] ;
    pos ++ ;
  }
  return obj ;
} ;

var getEdgeName = function (graph, namelist, level)
{
  var container ;
  namelist = namelist.slice(0, level) ;
  
  if (namelist[namelist.length-1] === "entry") {
    namelist.length -= 1 ;
    container = findObj(graph, namelist) ;
    if (!container) {
      return namelist.join(Diagram.sep) ;
    }
    
    container = container.elems[container.entry] ;
     namelist[namelist.length] = container.name ;
  }
  return namelist.join(Diagram.sep) ;
} ;

var quote = function (val) {
  if (!(typeof val === "string")) {
    return val.toString() ;
  }
  if (val.charAt(0) === '<') {
    return '<' + val + '>' ;
  } else {
    return '"' + val + '"' ;
  }
} ;

var toHTML = function (obj, tag) {
  var elem = "<"+tag ;
  
  if (obj[tag]) {
    _.each(obj[tag], function (val, key) {
      elem += " "+key+"="+quote(val) ;
    }) ;
  }
  
  elem += ">" ;
  return elem ;
} ;

var dotattr = function (obj, delimiter) {
  var dtext = "" ;
  _.each(obj, function (val, key) {
    if (val === undefined)
      return ;
    if (typeof val === "object") {
      dtext += key+" ["+dotattr(val, ",")+"]"+delimiter ;
    } else {
      dtext += key+'='+quote(val)+delimiter ;
    }
  }) ;
  return dtext ;
} ;

/*=============================================================================
 * Output templates
 *===========================================================================*/
var default_templates = {
  templates: {
    start:  function (graph, level) {
      if (level <= 1) {
        var dot = this.dot ;
        return 'digraph igniteSM {\n'+
               '  label="'+graph.title+'";\n  '+
               dotattr(dot, ";\n  ") + "\n" ;
      }
      return "" ;
    },
    end: function (graph, level) {
      if (level <= 1) {
        return '}\n' ;
      }
      return "" ;
    }
  },
  
  types: {
    "cluster": function (graph, cluster, level) {
        var text = ('subgraph "cluster_'+cluster.fullname+'" {\n  '+ 
                  "graph ["+dotattr(cluster.hints, ",")+"];\n"+
                 this.generate(graph, cluster, level+1) +
                 '}\n\n') ;

        // TODO: This is a kludge to get the entry and exit states
        //       nicely placed.
        if (cluster.fullname === "@enter") {
          text = 'subgraph {rank="source"; '+text+'}\n' ;
        } else if (cluster.fullname === "@exit") {
          text = 'subgraph {rank="sink"; '+text ;
        } else if (cluster.fullname === "@error") {
          text = text+'}\n' ;
        }
        return text ;
    },
    
    "node": function (graph, node) {
          var ntext = '"'+node.fullname+'"'+' [' ;
          ntext += " "+dotattr(node.hints, ",") ;
          return ntext + "];\n" ;
    },
    
    "edge": function (graph, edge) {
          var etext = '"'+edge.srcname+'" -> "'+edge.dstname+'" [' ;
          etext += " "+dotattr(edge.hints, ",") ;
          return etext + "];\n" ;
    }
  }
} ;

/*=============================================================================
 * Graph analysers
 *===========================================================================*/
var analysers = {
  node: {
    pre: [
         ],
    post: [
           ],
    subtype: {
      state: [
              function (graph, level, state) {
                if (state.attributes.transient) {
                  state.attributes.stereotypes.push("transient") ;
                  setifnotset(state.hints, "fillcolor", "green4") ;
                } else {
                  setifnotset(state.hints, "fillcolor", "blue4") ;
                }
                setifnotset(state.hints, "shape", "none") ;
                setifnotset(state.hints, "id", state.fullname) ;
              },
              function (graph, level, state) {
                var attr = state.attributes ;
                var evt ;
                var dlines = state.hints.dlines = [] ;

                _.each(attr.internal.pluginfns, function (pifnobj, fnname) {
                  dlines.push({
                    td: {align: "center"},
                    font: {color: state.hints.fillcolor},
                    text: fnname + ": " + pifnobj.text
                  }) ;
                }) ;
                
                if (attr.entry && attr.entry.fn && !attr.entry.hidden) {
                  dlines.push({
                    td: {align: "left"},
                    font: {color: "black"},
                    text: "entry / "+attr.entry.signature
                  }) ;
                }
                if (attr.exit && attr.exit.fn && !attr.exit.hidden) {
                  dlines.push({
                    td: {align: "left"},
                    font: {color: "black"},
                    text: "exit / "+attr.exit.signature
                  }) ;
                }
                _.each(attr.internal.trans, function (obj, evtname) {
                  dlines.push({
                    td: {align: "left"},
                    font: {color: "blue"},
                    text: evtname+" / "+obj.text
                  }) ;
                }) ;
                
                _.each(attr.internal.ignore, function (evtname) {
                  dlines.push({
                    td: {align: "left"},
                    font: {color: "green"},
                    text: evtname+" / ignore"
                  }) ;
                }) ;
                _.each(attr.internal.defer, function (evtname) {
                  dlines.push({
                    td: {align: "left"},
                    font: {color: "green"},
                    text: evtname+" / defer"
                  }) ;
                }) ;
              },
              function (graph, level, state) {
                var label, stereotypes = "" ;
                if (state.hints.label === "") {
                  delete state.hints.dlines ;
                  return ;
                }
                setifnotset(state.hints, "label", "") ;
                label = state.hints.label ;
                
                if (state.attributes.stereotypes.length) {
                  _.each(state.attributes.stereotypes, function (st) {
                    stereotypes += " &laquo;"+st+"&raquo; " ;
                  }) ;
                  label = stereotypes+"<BR/>"+label ;                
                }
                
                label = (
                  '<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0">'+
                  '  <TR><TD BGCOLOR="'+state.hints.fillcolor+'" WIDTH="100" ALIGN="CENTER">'+
                  '  <FONT FACE="sans" COLOR="white">'+label+'</FONT></TD></TR>') ;
                
                _.each(state.hints.dlines, function (dline) {
                  label += '<TR>'+toHTML(dline, "td")+toHTML(dline, "font") ;
                  label += dline.text ;
                  label += '</font></td></TR>' ;
                }) ;
                
                label += '</TABLE>' ;
                state.hints.label = label ;
                delete state.hints.dlines ;
              }
              ],
      guard: [
              function (graph, level, state) {
                setifnotset(state.hints, "shape", "diamond") ;
                setifnotset(state.hints, "style", "filled") ;
                setifnotset(state.hints, "color", "blue3") ;
                setifnotset(state.hints, "fillcolor", "blue1") ;
                setifnotset(state.hints, "id", state.fullname) ;
              },
              function (graph, level, state) {
                setifnotset(state.hints, "label", "") ;
              }
             ],
      actfn: [
              function (graph, level, state) {
                setifnotset(state.hints, "shape", "diamond") ;
                setifnotset(state.hints, "style", "filled") ;
                setifnotset(state.hints, "color", "green3") ;
                setifnotset(state.hints, "fillcolor", "green1") ;
                setifnotset(state.hints, "id", state.fullname) ;
              },
              function (graph, level, state) {
                setifnotset(state.hints, "label", "") ;
              }
             ]              
          } 
      },
  edge: {
    pre: [
          function (graph, level, edge) {
            if (edge.attributes.event) {
              setifnotset(edge.hints, "label", edge.attributes.event) ;
            }
            if (edge.attributes.internal) {
              setifnotset(edge.hints, "style", "dashed") ;
            }
            if (edge.attributes.edgeDir < 0) {
              setifnotset(edge.hints, "constraint", "false") ;
            } else {
              setifnotset(edge.hints, "constraint", "true") ;
            }
            setifnotset(edge.hints, "id", edge.fullname) ;
            
            edge.srcname = getEdgeName(graph, edge.src, this.maxLevel) ;
            edge.dstname = getEdgeName(graph, edge.dst, this.maxLevel) ;
          }
         ]
  },
  cluster: {
    pre: [
          function (graph, level, cluster) {
            if (level < this.maxLevel) {
              setifnotset(cluster.hints, "label", "") ;
            } else {
              setifnotset(cluster.hints, "label", cluster.name) ;
            }
          },
          function (graph, level, cluster) {
            this.analyse(graph, level+1, cluster) ;
            if (!(level < this.maxLevel)) {
              cluster.type = "node" ;
            }
          }
          ],
    post: [
           function (graph, level, cluster) {
             var edgecount = _.reduce(cluster.elems, function (memo, elem, key) {
               return memo + ((elem.type === "edge") ? 1 : 0) ;
             }, 0) ;
             
             setifnotset(cluster.hints, "id", cluster.fullname) ;
             
             // No intenal edges => no guard or action functions
             // so don't draw any edge around the cluster
             if (level < this.maxLevel && edgecount === 0) {
               setifnotset(cluster.hints, "color", "transparent") ;
               setifnotset(cluster.hints, "fillcolor", "transparent") ;
               return ;
             }
             
             // If the maximum level is at the cluster - copy
             // some attributes up to this level - e.g. colors
             if (level >= this.maxLevel) {
               if (cluster.elems.state) {
                 var s = cluster.elems.state.hints ;
                 if (s.shape && s.shape !== "none") {
                   cluster.hints.label = s.label ;
                   setifnotset(cluster.hints, "shape", s.shape) ;
                 }
                 setifnotset(cluster.hints, "style", s.style) ;
                 setifnotset(cluster.hints, "color", s.color) ;
                 setifnotset(cluster.hints, "width", s.width) ;
                 setifnotset(cluster.hints, "height", s.height) ;
                 setifnotset(cluster.hints, "fillcolor", s.fillcolor) ;
               }
             } else {
               setifnotset(cluster.hints, "fillcolor", "transparent") ;
             }               
             setifnotset(cluster.hints, "fontcolor", "white") ;
             setifnotset(cluster.hints, "color", "black") ;
             setifnotset(cluster.hints, "shape", "rect") ;
             setifnotset(cluster.hints, "style", "filled,rounded") ;
           }
          ]
  }
} ;

/*=============================================================================
 * DiagramDot - main object
 *===========================================================================*/
function DiagramDot (graph, maxLevel, dotSettings)
{
  var output = "", segments = [], 
    segno=0, mkcallback, t, allstarted=false, check_if_done ;
  
  this.dot = {} ;
  this.maxLevel = maxLevel ;
  dotSettings = dotSettings || {} ;
  
  _.defaults(this.dot, dotSettings, {
    rankdir: "TB",
    ranksep: 0.2,
    size: "12,9",
    ratio: "auto",
    node: {
      shape: "none",//"plaintext",
      fontsize: 10,
      margin: 0
    },
    edge: {
      fontsize: 8
    }
  }) ;
  
  if (!(graph instanceof Diagram)) {
    graph = new Diagram(graph) ;
  }
  this.graph = graph ;
  this.templates = default_templates ;
  this.analyse(graph, 1, graph) ;
  
  return this ;
}

DiagramDot.prototype.analyse = function (graph, level, obj) {
  _.each(obj.elems, function (elem, elemname) {
    elem.hints = elem.hints || {} ;
    if (elem.type in analysers) {
      var analyser = analysers[elem.type] ;
      var fnlist = [], i ;
      if (analyser.pre) fnlist = fnlist.concat(analyser.pre) ;
      if (analyser.subtype && elem.subtype && 
          (elem.subtype in analyser.subtype)) fnlist = fnlist.concat(analyser.subtype[elem.subtype]) ;
      if (analyser.post) fnlist = fnlist.concat(analyser.post) ;
      for (i=0;i<fnlist.length;i++) {
        fnlist[i].call(this, graph, level, elem) ;
      }
    }
  }, this) ;
} ;

var indent = function (text, level) {
  var i, itext = "", inlines, outlines ;
  
  if (text === "") {
    return text ;
  }
  
  for (i=0;i<level;i++) {
    itext += "  " ;
  }
  inlines = text.split('\n') ;
  outlines = _.map(inlines, function (line) {
    if (line === "") {
      return line ;
    }
    return itext+line ;
  }) ;
  return outlines.join('\n') ;
} ;

DiagramDot.prototype.generate = function (graph, elem, level) {
  var tmplts = this.templates ;
  var start, mid = "", end, text = "" ;
  if (!graph)
    graph = this.graph ;
  if (!elem)
    elem = graph ;
  if (!level)
    level = 1 ;
  
  start = calltemplate(tmplts.templates, "start", this, elem, level) ;
 
  _.each(elem.elems, function (elem, ename) {
    mid += calltemplate(tmplts.types, elem.type, this, graph, elem, level) ;
  }, this) ;
  
  
  end = calltemplate(tmplts.templates, "end", this, elem, level) ;

  mid = indent(mid, 1) ;
  
  text = start + mid + end ;
  return text ;
} ;

module.exports = DiagramDot ;