var submods = require('../../lib/utils/submods'),
    should = require('should') ;

module.exports = {
    ignite: function () {
      var modes = new submods.SubMods([module, "../../bin"], "ignite_modes") ;
      var actmodes = ["draw", "lint", "run", "test"] ;
//      console.log(modes) ;
      modes.submods.should.have.keys(actmodes) ;
    }
} ;
      
      