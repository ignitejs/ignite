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

var _ = require("underscore"),
    util = require("util"),
    path = require("path"),
    fs = require("fs"),
    net = require("net"),
    child_process = require("child_process"),
    workerUtils = require("../../utils/worker") ;

var workerPath = path.join(path.dirname(module.filename), "../../../../bin/worker") ;

function workDispatcher (fire) {
  var child = null, inBuffer = "", replyJsmMemo = null, server, skt;
  return {
    startState: "Start",
    states: {
      Start:
      {
        entry: function (id) {
          server = new net.Server() ;
          server.listen(id) ;
          fire.$regEventEmitter("server", server) ;
          
          child = child_process.spawn(workerPath, [id]) ;
//          child.stderr.pipe(process.stderr) ;
        },
        actions: {
          "server.listening": "@ignore",
          "server.connection": function (socket) {
            skt = socket ;
            skt.pause() ;
            skt.on("data", function (d) {});
            return "WaitForCommand" ;
          }
        }
  
      },
      
      "WaitForCommand":
      {
        actions: {
          "api.cmd": function (cmd, replyJsm) {
            replyJsmMemo = replyJsm ;
            return ["SendCommand", skt, cmd] ;
          },
          "api.exit": function () {
            skt.end() ;
            skt.destroy() ;
            server.close() ;
            return "@exit" ;
          }
        }
      },
      
      "SendCommand":
      {
        sub: workerUtils.TxMachine,
        actions: {
          "sub.exit":  function () {
            return ["WaitForReply", skt, inBuffer] ;
          },
          "sub.error": "@error"
        }          
      },
      
      "WaitForReply":
      {
        sub: workerUtils.RxMachine,
//        args: function () {
//          return [skt, inBuffer] ;
//        },
        actions: {
          "sub.exit": function (replyStr, remains) {
            if (replyStr === null) {
              return "@exit" ;
            }
            
            var reply = JSON.parse(replyStr) ;
            inBuffer = remains ;
            return ["HandleReply", reply] ;
          },
          "sub.error": "@error"
        }
      },
      
      "HandleReply":
      {
        entry: function (reply) {
          var args ;
          if (replyJsmMemo) {
            if (reply.ok) {
              if (typeof reply.result === "string") {
                reply.result = "work." + reply.result ;
              } else if (_.isArray(reply.result)) {
                reply.result[0] = "work." + reply.result[0] ;
              }
              replyJsmMemo._inject(this, reply.result) ;
            } else {
              // TODO: Handle exception case
            }
          }
          return "WaitForCommand" ;
        }
      }
    },
    defaults: {
      actions: {
        "api": "@defer"
      }
    }
  } ;
}

workDispatcher.defaults = {
    options: { logLevel: 0 }
} ;

workDispatcher.api = ["exit", "cmd"] ;


function WorkerPlugin (piApi, name) {
  var Factory = require("../../../Factory"), wdFactory, sktDir ;
  
  sktDir = "/tmp/worker."+process.pid.toString() ;
  fs.mkdirSync(sktDir, "777") ;
  process.on('exit', function () {
    fs.rmdirSync(sktDir) ;
  }) ;
  
  wdFactory = new Factory(workDispatcher) ;
  piApi.registerStatePI(name, {
    init: function () {
      if (this.name) {
        this._wd = wdFactory.spawn(sktDir+"/"+this.name) ;
        this._wdseq = 0 ;
      }
    },
    deinit: function () {
      if (this._wd) {
        this._wd.exit() ;
      }
    },
    initState : function(statename, state) {
      if (!this._wd) {
        return ;
      }
      this._wd.cmd({ id:"regfn", 
                      seq: this._wdseq++,
                      fnId: statename, 
                      fnString: state[name].toString(),
                      sandbox: state.sandbox,
                      require: state.require
      }) ;
    },
    state: {
      entry: function () {
        var ctx = null, state = this.state, args = this.args ;
        if (state.args) {
          if (typeof state.args === "function") {
            args = state.args.apply(this, this.args) ;
          } else {
            args = state.args ;
          }
        }
        if (state.ctx) {
          if (typeof state.ctx === "function") {
            ctx = state.ctx() ;
          } else {
            ctx = state.ctx ;
          }
        }
        
        this._wd.cmd({ id:"runfn", 
          seq: this._wdseq++,
          fnId: this.stateName,
          context: ctx,
          args: args
        }, this) ;
      }
    },
    
    graph: function (statev, state, sname, piname) {
      var attr = statev.attributes ;
      attr.stereotypes.push(name) ;
      statev.hints.fillcolor = "red" ;
      attr.entry.hidden = true ;
    },
    graphfns: [name]
  }) ;
}

module.exports = WorkerPlugin ;