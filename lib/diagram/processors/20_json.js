var util = require('util') ;

function DiagramJson (graph, level, options)
{
  this.graph = graph ;
}

DiagramJson.prototype.generate = function () {
  return JSON.stringify(this.graph, function (key, val) {
    if (key[0] === "_") {
      return ;
    }
    return val ;
  }) ;
} ;

module.exports = DiagramJson ;
