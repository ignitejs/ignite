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

var igniteTest = require('../../ignite').test.igniteTest,    
    util = require('util'),
    fs = require('fs'),
    url = require('url'),
    http = require('http');

var t = new igniteTest(module) ;

function httpClient (fire, method, remoteurl, fpath) {
  var req, parsedurl, readstream, outdata="" ;
  
  this.states = {
      "CreateReq": {
        "guard": function () {
          parsedurl = url.parse(remoteurl) ;
          if (parsedurl.protocol != 'http:') {
            return "@error" ;
          }
        },
        "entry": function () {
          var options ;
          
          options = {
              host: parsedurl.host,
              port: parsedurl.port || 80,
              path: parsedurl.pathname+
                  (parsedurl.search?parsedurl.search:"")+
                  (parsedurl.hash?parsedurl.hash:""),
              method: method
          } ;

          req = http.request(options) ;
          fire.$regEmitter("req", req, true) ;
          
          if (method === "POST") {
            return "WriteReq" ;
          } else {
            return "Wait4Server" ;
          }
        }
      },
      "WriteReq": {
        "entry": function () {
          readstream = fs.createReadStream(fpath) ;
          fire.$regEmitter("rs", readstream) ;
        },
        "exit": function () {
          readstream.destroy() ;
        },
        "actions": {
          "rs.data": function (data) {
            req.write(data) ;
            // no return, so internal transition
          },
          "rs.end": "Wait4Server",
          "rs.error": "AbortReq",
          "req.response": "Response"
        }
      },
      "AbortReq": {
        "entry": function () {
          req.abort() ;
          return "@error" ;
        }
      },
      "Wait4Server": {
        "entry": function () {
          req.end() ;
        },
        ignore: ["req.socket","req.finish", "req.drain"],
        "actions": {
          "req.response": "Response"
        }
      },
      "Response": {
        "guard": function (res) {
          if (res.statusCode == 200) {
            return null ;
          } else {
            return "@error" ;
          }
        },
        "entry": function (res) {
          fire.$deregEmitter("req") ;
          fire.$regEmitter("res", res) ;
        },
        ignore: ["res.newListener"],
        "actions": {
          "res.data": function (data) {
            outdata += data ;
          },
          "res.end": function () {
            return ["@exit", outdata] ;
          }
        }
      }
  } ;
  return "CreateReq" ;
};

t.regSM(httpClient);

t.expressoAddRun("httpClient run", ["GET", "http://www.darwinvets.com/"]) ;
t.expressoAddRun("httpClient run error", 
  ["GET", "http://www.darwinvets.com/nothing"], 'error') ;

