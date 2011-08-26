//[
// Copyright (c) 2011, Richard Miller-Smith & David Hammond.
// All rights reserved. Redistribution and use in source and binary forms, 
// with or without modification, are permitted provided that the following 
// conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials provided
//       with the distribution.
//     * Neither the name of the ignite.js project, nor the names of its
//       contributors may be used to endorse or promote products derived
//       from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//]

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
  var fnObj = { fn: null, ctx: null } ;
  while (obj && strlist.length) {
    fnObj.ctx = obj ;
    obj = obj[strlist.shift()] ;
  }
  if (strlist.length === 0) {
    fnObj.fn = obj ;
    return fnObj ;
  } else {
    return undefined ;
  }
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
