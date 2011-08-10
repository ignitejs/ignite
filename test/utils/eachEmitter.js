var EachEmitter = require('../../lib/utils/EachEmitter'),
    path = require('path'),
    util = require('util'),
    fs = require('fs') ;

module.exports = {
    'ee1': function () {
      var dirlist = fs.readdirSync('.') ;
      
      var ee = new EachEmitter(dirlist, fs.stat) ;
      ee.on('done', function (pos, arg, err, stat) {
        util.debug('done: '+pos) ; //+' '+util.inspect(stat)) ;
      }) ;
      ee.on('alldone', function (length) {
        util.debug('alldone: '+length) ;
      });
      ee.launch() ;
    },
    'ee2': function () {
      var dir = 'lib' ;
      var dirlist = fs.readdirSync(dir) ;
      
      var ee = new EachEmitter(dirlist, fs.stat, {
        argfn: function (p) {
          return [path.join(dir, p)] ;
        }
      }) ;
      ee.on('done', function (pos, arg, err, stat) {
        util.debug('done: '+pos+' '+arg[0]) ; //+' '+util.inspect(stat)) ;
      }) ;
      ee.on('alldone', function (length) {
        util.debug('alldone: '+length) ;
      });
      ee.launch() ;
    }
} ;