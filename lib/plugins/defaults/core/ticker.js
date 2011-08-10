function TickerPlugin (piApi, name) {
  piApi.registerStatePI(name, {
   state: {
     entry: function () {
       var state = this.state ;
       var ms = this.state.ticker ;
       var tickcount = 0 ;
       var source = {
           type: "ticker",
           id: this._generateId(),
           meta: {
             ms: ms
           }
       } ;
       
       this.state._ticker = setInterval(function (jsm) {
         var evtname = "tick" ;
         if (jsm.uniquename) {
           evtname += ":" + jsm.uniquename ;
         }
         jsm._inject(source, [evtname, tickcount]) ;
         tickcount += 1 ;
       }, ms, this) ;
     },
     exit: function () {
       if (this.state._ticker) {
         clearInterval(this.state._ticker) ;
         delete this.state._ticker ;
       }
     }
   },
   graph: function (statev, state, sname, piname) {
     var attr = statev.attributes ;
     attr.stereotypes.push(name) ;
     attr.entry.hidden = true ;
   }
  }) ;
} ;

module.exports = TickerPlugin ;