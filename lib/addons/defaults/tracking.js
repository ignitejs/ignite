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

/*=============================================================================
 * Default Tracking Add-on
 *===========================================================================*/

var _ = require('underscore'),
    igniteUtils = require('../../utils/igniteUtils'),
    util = require('util') ;

function _tracklist (format) {
  var trk = this ;
  var runninglist = [] ;
  var rl = [], el = [], header, tables=[] ;
  
  _.each(trk.db, function (sm, id) {
    if (trk.exitlist.indexOf(id)<0) {
      runninglist.push(id) ;
    }
  });
  
  header = ["ID", "Started at"] ;
  if (trk.levellist.indexOf("change")>=0) {
    header.push("#Chng") ;
    header.push("Cur. State") ;
  }
  if (trk.levellist.indexOf("event")>=0) {
    header.push("#Evnt") ;
    header.push("Last Event") ;
  }
  if (trk.levellist.indexOf("call")>=0) {
    header.push("#Call") ;
    header.push("Last Call") ;
  }
  rl.push(header) ;
  
  _.each(runninglist, function (smid) {
    var sm = trk.db[smid] ;
    var line = [sm.id, 
                igniteUtils.dateToTimeString(sm.started)] ;
    if (sm.changeCount !== undefined) {
      line.push(sm.changeCount) ;
      line.push(sm.state?sm.state:"-") ;
    }
    if (sm.eventcount !== undefined) {
      line.push(sm.eventcount) ;
      line.push(sm.lastevt?sm.lastevt:"-") ;
    }
    if (sm.callcount !== undefined) {
      line.push(sm.callcount) ;
      line.push(sm.lastcall?sm.lastcall:"-") ;
    }
    rl.push(line) ;
  }) ;
  tables.push({title: "Running", table: rl}) ;
  
  header = ["ID", "ERR", "Started at", "Exited at"] ;
  if (trk.levellist.indexOf("change")>=0) {
    header.push("#Chng") ;
    header.push("Cur. State") ;
  }
  if (trk.levellist.indexOf("event")>=0) {
    header.push("#Evnt") ;
    header.push("Last Event") ;
  }
  if (trk.levellist.indexOf("call")>=0) {
    header.push("#Call") ;
    header.push("Last Call") ;
  }
  el.push(header) ;
  _.each(trk.exitlist, function (smid) {
    var sm = trk.db[smid] ;
    var line = [sm.id, 
                sm.error?"Y":"", 
                igniteUtils.dateToTimeString(sm.started),
                igniteUtils.dateToTimeString(sm.exited)] ;
    if (sm.changeCount !== undefined) {
      line.push(sm.changeCount) ;
      line.push(sm.state?sm.state:"-") ;
    }
    if (sm.eventcount !== undefined) {
      line.push(sm.eventcount) ;
      line.push(sm.lastevt?sm.lastevt:"-") ;
    }
    if (sm.callcount !== undefined) {
      line.push(sm.callcount) ;
      line.push(sm.lastcall?sm.lastcall:"-") ;
    }
    el.push(line) ;
  }) ;

  tables.push({title: "Exited", table: el}) ;
  
  if (!format || format === "text") {
    var text = "" ;
    _.each(tables, function (tab) {
      text += igniteUtils.tableToText(tab.title+":", tab.table) ;
    }) ;
    return text ;
  }

  return tables ;
}

var _tracklevellists = [
                       // 0 = No tracking
                       [], 
                       // 1 = Basic life-time tracking
                       ["ctor", "enter", "done"], 
                       // 2 = State and event tracking
                       ["ctor", "enter", "change", "event", "done"],
                       // 3 = Full tracking
                       ["ctor", "enter", "change", "event", "call", "done"]
                       ] ;

var _trackfns = {
    "ctor": function (jsm) {
      var trk = this ;
      trk.db[jsm.id] = _.clone(trk.template) ;
      trk.db[jsm.id].id = jsm.id ;
    },
    "enter": function (jsm) {
      var trk = this ;
      trk.db[jsm.id].started = new Date() ;
    },
    "done": function (jsm, type, err) {
      var trk = this ;
      trk.db[jsm.id].exited = new Date() ;
      trk.db[jsm.id].error = (type === "error") ;
      trk.exitlist.unshift(jsm.id) ;
      while (trk.exitlist.length > trk.exitlistlen) {
        var oldid = trk.exitlist.pop() ;
        delete trk.db[oldid] ;
      }
    },
    "change": function (jsm, newstate, oldstate) {
      var trk = this ;
      trk.db[jsm.id].changeCount += 1 ;
      trk.db[jsm.id].state = newstate ;
    },
    "event": function (jsm, evtname) {
      var trk = this ;
      trk.db[jsm.id].eventcount += 1 ;
      trk.db[jsm.id].lastevt = evtname ;
    },
    "call": function (jsm, type, fn) {
      var trk = this ;
      trk.db[jsm.id].callcount += 1 ;
      trk.db[jsm.id].lastcall = type ;
    }
} ;

function trackingAddon (addonApi, name) {
  addonApi.registerAddon(name, {
    init: function (trk, factory) {
      if (factory.options.trackLevel <= 0) {
        return ;
      }
      var level = factory.options.trackLevel ;
      
      // State machine database
      trk.db = {} ;
      trk.exitlistlen = factory.options.trackHistLen || 10 ;
      trk.exitlist = [] ;
      
      trk.template = {
      } ;
    
      // Limit level to maximum defined
      level = (level >= _tracklevellists.length) ? _tracklevellists.length-1:level ;
      
      // Set-up event listeners for this track level
      trk.listeners = {} ;
      trk.levellist = _tracklevellists[level] ;
      _.each(trk.levellist, function (logevt) {
        trk.listeners[logevt] = _trackfns[logevt].bind(trk) ;
        if (logevt === "change") {
          trk.template.changeCount = 0 ;
        } else if (logevt === "event") {
          trk.template.eventcount = 0 ;
        } else if (logevt === "call") {
          trk.template.callcount = 0 ;
        }
      }, this) ;
      trk.list = _tracklist.bind(this) ;
    },
    attach: function (trk, factory, jsm) {
      var evt ;
      for (evt in trk.listeners) {
        jsm.on(evt, trk.listeners[evt]) ;
      }
    }, 
    detach: function (trk, factory, jsm) {
      var evt ;
      for (evt in trk.listeners) {
        jsm.removeListener(evt, trk.listeners[evt]) ;
      }
    }
  }) ;
  
  addonApi.registerAddonFn(name, "track", _tracklist) ; 
}


module.exports = trackingAddon ;