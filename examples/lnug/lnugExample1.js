var _ = require('underscore') ;
var colors = require('colors') ;

function lnugExample (fire, name) {
  
  return {
    startState: "HelloWorld",
    
    states: {
      
      "HelloWorld": {
        entry: function () {
          fire.process.stdout.write("Hello World\n".green) ;
        },
        actions: {
          "process.stdout.write.done": "HelloName",
          ".write.err": "@error"
        }
      },
      
      "HelloName": {
        guard: function () {
          if (!name || typeof name !== "string")
            return "@exit" ;
        },
        entry: function () {
          var str = "Hello "+name+", pleased to meet you.\n" ;
          fire.process.stdout.write(str.red) ;
        },
        actions: {
          ".write.done": "@exit",
          ".write.err": "@error"
        }
      }
       
    }
  } ;
}

lnugExample.defaults = {
  imports: { 
    process: process
  }
};

module.exports = lnugExample;