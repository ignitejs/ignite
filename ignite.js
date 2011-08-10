/* ignite.js - Async state machines for node.js */

// State Machine Factory constructor
module.exports.Factory = require('./lib/Factory') ;


// State machine diagram generator
module.exports.Diagram = require('./lib/diagram/Diagram') ;

module.exports.test = require('./lib/utils/testUtils') ;

// Old names (deprecated)
module.exports.JSMFactory = module.exports.Factory ;
module.exports.JSMDiagram = module.exports.Diagram ;
