var _ = require('underscore'),
    _s = require('underscore.string'),
    util = require('util');


function tableToText (heading, table) {
  var text = heading+"\n" ;
  var maxcols = 0 ;
  var colwidths = [] ;
  var i, j, row, val;
  
  for (i=0;i<table.length;i++) {
    row = table[i] ;
    maxcols = (row.length > maxcols) ? row.length : maxcols ;
    for (j=0;j<row.length;j++) {
      var width ;
      if (!colwidths[j])
        colwidths[j] = 0 ;
      
      width = row[j].toString().length + 1 ;
      colwidths[j] = (width > colwidths[j]) ? width : colwidths[j] ;
    }
  }
  
  for (i=0;i<table.length;i++) {
    row = table[i] ;
    for (j=0;j<maxcols;j++) {
      val = (row[j] === undefined) ? "-" : row[j].toString() ;
      text += "|"+_s.pad(val, colwidths[j]) ;
    }
    text += "|\n" ;
    if (i===0) {
      for (j=0;j<row.length;j++) {
        text += "|"+_s.pad("", colwidths[j],'-') ;
      }
      text += "|\n" ;
    }
  }
      
  return text ;
}

exports.tableToText = tableToText ;

function dateToTimeString (date)
{
  var str = "" ;
  str += _s.pad(date.getHours().toString(), 2, '0') + ":" ;
  str += _s.pad(date.getMinutes().toString(), 2, '0') + ":" ;
  str += _s.pad(date.getSeconds().toString(), 2, '0') + "+" ;
  str += _s.pad(date.getMilliseconds().toString(), 3, '0') ;
  return str ;
}

exports.dateToTimeString = dateToTimeString ;

function findFn (obj, string)
{
  var strlist = string.split('.') ;
  while (obj && strlist.length) {
    obj = obj[strlist.shift()] ;
  }
  return obj ;
}

exports.findFn = findFn ;

function expandListsIntoSubobj (srcobj, itemlist, subkey, destnames) {
  var i, j, item, dstobj, sublist, destname;
  
  if (subkey) {
    if (! srcobj[subkey] ) {
      srcobj[subkey] = {} ;
    }
    dstobj = srcobj[subkey] ;
  } else {
    dstobj = srcobj ;
  }
  
  for (i=0;i<itemlist.length;i++) {
    item = itemlist[i] ;
    if (destnames) {
      destname = destnames[i] ;
    } else {
      destname = item ;
    }
    sublist = srcobj[item] ;
    if (sublist) {
      for (j=0;j<sublist.length;j++) {
        dstobj[sublist[j]] = destname ;
      }
    }
    delete srcobj[item] ;
  }
}

exports.expandListsIntoSubobj = expandListsIntoSubobj ;

function arrayToSMGF (array, name) {
  var jsmobj = {} ;
  name = name || "Stage" ;
  
  _.each(array, function (obj, key) {
    var statename = name + key.toString() ;
    
    jsmobj[statename] = obj ;
  }) ;
  jsmobj.startState = name+"0" ;
  
  return jsmobj ;
}

exports.arrayToSMGF = arrayToSMGF ;
