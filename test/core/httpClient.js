var igniteTest = require('../../index').test.igniteTest,
    path = require('path'),
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
//          util.log(util.inspect(parsedurl)) ;
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
//          util.log(util.inspect(options)) ;
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
        ignore: ["req.finish", "req.drain"],
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

