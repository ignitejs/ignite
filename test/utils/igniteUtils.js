var igniteUtils = require('../../lib/utils/igniteUtils'),
    assert = require('assert'),
    util = require('util'),
    should = require('should') ;

module.exports = {
    'tableToText1': function () {
      var table = [
                   ["col1", "c2", "column3", "a", "b", "c"],
                   ["adsada", 451, 1, 332, "jfjd", 3],
                   [33, 13333, 123, 1, 54323, 121] ] ;
      var text = igniteUtils.tableToText("Heading", table) ;
//      util.debug(">>"+text+"<<") ;
    }
} ;
