function TimeoutPlugin (piApi, name) {
  piApi.registerStatePI(name, {
   state: {
     entry: function () {
       var state = this.state ;
       var ms = this.state.timeout ;
       var source = {
           type: "timeout",
           id: this._generateId(),
           meta: {
             ms: ms
           }
       } ;
       
       this.state._timeout = setTimeout(function (jsm) {
         var evtname = "timeout" ;
         if (jsm.uniquename) {
           evtname += ":" + jsm.uniquename ;
         }
         jsm._inject(source, evtname) ;
       }, ms, this) ;
     },
     exit: function () {
       if (this.state._timeout) {
         clearTimeout(this.state._timeout) ;
         delete this.state._timeout ;
       }
     }
   },
   graph: function (statev, state, sname, piname) {
     var attr = statev.attributes ;
     attr.stereotypes.push(name) ;
   }
  }) ;
}

module.exports = TimeoutPlugin ;