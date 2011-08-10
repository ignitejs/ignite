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
 * Default Logging Add-on
 *===========================================================================*/

var _ = require('underscore'),
    util = require('util') ;

var _loglevellists = [
                      [],
                      ["done"],
                      ["enter", "done"],
                      ["enter", "change", "done"],
                      ["enter", "warn", "change", "done"],
                      ["enter", "warn", "change", "event", "ext", "done"],
                      ["enter", "warn", "change", "event", "ext", "call", "done"],
                      ["enter", "warn", "change", "event", "ext", "call", "eemit", "done"]
                      ] ;

var _logfns = {
    "enter": function (jsm) {
      this.log(jsm.id, "ENTR") ;
    },
    "done": function (jsm, type, err) {
      if (type === "error") {
        this.log(jsm.id, "ERR ") ;
      } else {
        this.log(jsm.id, "EXIT") ;
      }
    },
    "change": function (jsm, newstate, oldstate) {
      this.log(jsm.id, "CHNG", "["+oldstate+"] -> ["+newstate+"]") ;
    },
    "event": function (jsm, evtname) {
      this.log(jsm.id, "EVNT", "["+evtname+"]") ;
    },
    "call": function (jsm, type, fn) {
      this.log(jsm.id, "CALL", "["+type+"]") ;
    },
    "warn": function (jsm, statename, evtname, desc) {
      this.log(jsm.id, "WARN", "["+statename+"/"+evtname+"]: "+desc) ;
    },
    "eemit": function (jsm, eename, occurrence) {
      this.log(jsm.id, "EMIT", "["+eename+"]: "+occurrence) ;
    },
    "ext": function (jsm, source, type) {
      var args = Array.prototype.slice.call(arguments, 2) ; 
      this.log(jsm.id, "EXT ", source.meta.type+": "+JSON.stringify(args)) ;
    }
} ;


function loggingAddon (addonApi, name) {
  addonApi.registerAddon(name, {
    init: function (lg, factory) {
      if (factory.options.logLevel <= 0) {
        return ;
      }
      var level = factory.options.logLevel ;
      
      // By default, send logging to stdout
      lg.writeStream = factory.options.logStream || process.stderr ;
  
      // Set default prefix
      lg.prefix = factory.options.logPrefix || ("IGNT:"+factory.name) ;
  
      // Basic log function - prepends prefix
      lg.log = factory.options.logFn || function (id, type, text) {
        var etext = text ? ": "+text : "" ;
        lg.writeStream.write(lg.prefix+":"+id+":"+type+etext+"\n") ;
      } ;
  
      // Limit level to maximum defined
      level = (level >= _loglevellists.length) ? _loglevellists.length-1:level ;
  
      // Set-up event listeners for this log level
      lg.listeners = {} ;
      lg.levellist = _loglevellists[level] ;
      _.each(lg.levellist, function (logevt) {
        lg.listeners[logevt] = _logfns[logevt].bind(lg) ;
      }) ;
    },
    attach: function (lg, factory, jsm) {
      var evt ;
      for (evt in lg.listeners) {
        jsm.on(evt, lg.listeners[evt]) ;
      }
    },
    detach: function (lg, factory, jsm) {
      var evt ;
      for (evt in lg.listeners) {
        jsm.removeListener(evt, lg.listeners[evt]) ;
      }
    }
  }) ;
}
  
module.exports = loggingAddon ;