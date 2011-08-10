var pluginUtils = require('../../utils/pluginUtils'),
    _ = require("underscore") ;

function WorkPlugin (piApi, name) {
  piApi.registerStatePI(name, {
    initState: function (statename, state) {
      if (typeof state[name] !== "object") {
        pluginUtils.convertToObj(this, statename, state, name) ;
      }
      
      pluginUtils.strtofn(this, statename, state, name);
    },
   state: {
     entry: function () {
       var ctx = this, state = this.state, piObj = state[name], args = this.args, evt ;
       if (piObj.ctx) {
         if (typeof piObj.ctx === "function") {
           ctx = piObj.ctx() ;
         } else {
           ctx = piObj.ctx ;
         }
       }
       if (piObj.fnArgs) {
         if (typeof piObj.fnArgs === "function") {
           args = piObj.fnArgs.apply(this, this.args) ;
         } else {
           args = piObj.fnArgs ;
         }
       }

       evt = piObj.fn.apply(ctx, args) ;
       if (typeof evt === "string") {
         evt = name + "." + evt ;
       } else if (_.isArray(evt)) {
         evt[0] = name + "." + evt[0] ;
       }
       this._futureInject(null, evt) ;
     }
   },
   graph: function (statev, state, sname, piname) {
     var attr = statev.attributes ;
     attr.stereotypes.push(name) ;
     statev.hints.fillcolor = "red" ;
     attr.entry.hidden = true ;
   },
   graphfns: ["work"]
  }) ;
} ;

module.exports = WorkPlugin ;