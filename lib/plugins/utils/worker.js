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
    _s = require('underscore.string') ;

var util = require('util') ;

var _magic = "WRK$" ;

function packetise (object) {
  var pktStr = _magic, objStr = JSON.stringify(object)+"\n", lenStr = objStr.length.toString(16) ;
  
  switch (lenStr.length) {
  case 1:
    lenStr = "00000" + lenStr ;
    break ;
  case 2:
    lenStr = "0000" + lenStr ;
    break ;
  case 3:
    lenStr = "000" + lenStr ;
    break ;
  case 4:
    lenStr = "00" + lenStr ;
    break ;
  case 5:
    lenStr = "0" + lenStr ;
    break ;
  }
  
  pktStr += lenStr + "\n" + objStr;
  
  return pktStr ;
}

var _prefixLen = module.exports.prefixLen = 11 ;
module.exports.packetise = packetise ;

function checkMagic (data) {
  return !(data.substr(0, _magic.length) === _magic) ;
}
module.exports.checkMagic = checkMagic ;

function getDataLen (data) {
  var lenStr = data.substr(_magic.length, 6) ;
  return parseInt(lenStr, 16) ;
}
module.exports.getDataLen = getDataLen ;

function removePrefix(data) {
  return data.substr(module.exports.prefixLen) ;
}
module.exports.removePrefix = removePrefix ;

function sendCmd(outStream, cmd) {
  outStream.write(packetise(cmd)) ;
  outStream.flush() ;
}
module.exports.sendCmd = sendCmd ;

var emptyListener = function () {} ;

function TxMachine (fire, outStream) {
  return {
    startState: "TxInit",
    states: {
      "TxInit": {
        entry: function (unused, obj) {
          var data = packetise(obj) ;
          return ["TxSend", data] ; 
        }
      },
      
      "TxSend":
      {
        entry: function (data) {
          if (outStream.write(data)) {
            return "@exit" ;
          }
          outStream.on("drain", emptyListener) ;
          // Otherwise, register stream and wait for 'drain' event
          fire.$regEventEmitter("outStream", outStream) ;
        },
        actions: {
          "outStream.drain": function () {
            outStream.removeListener("drain", emptyListener) ;
            return "@exit" ;
          }
        }
      }
    }
  } ;
}

function RxMachine (fire, inStream) {
  return {
    startState: "RxInit",
    states: {
      "RxInit":
      {
        entry: function (unused, prevData) {
          fire.$regEventEmitter("inStream", inStream, true) ;
          return ["RxPrefixWait", prevData] ;
        }
      },
      
      "RxPrefixWait": function ()
      {
        var curDataMemo ;
        return {
          entry: function (curData) {
            var dataLen = 0 ;
            curDataMemo = curData ;
            if (curData.length >= _prefixLen) {
              if (checkMagic(curData)) {
                process.stderr.write("Input out of sync - resyncing.\n") ;
                return ["@self", curData.substr(1)] ;
              }
              
              dataLen = getDataLen(curData) ;
              
              return ["RxDataWait", removePrefix(curData), dataLen] ;
            }
        
            inStream.resume() ;
          },
          exit: function () {
            inStream.pause() ;
          },
          actions: {
            "inStream.data": function (data) {
              curDataMemo += data.toString() ;
              return ["@self", curDataMemo] ;
            },
            "inStream.end": function () {
              if (curDataMemo.length) {
                return ["@error", "Unexpected stream end."] ;
              }
              return ["@exit", null, null] ;
            },  
            "inStream.error": ["@error", "Input stream error."]
          }
        } ;
      },
      
      "RxDataWait": function ()
      {
        var curDataMemo, dataLenMemo ;
        return {
          entry: function (curData, dataLen) {
            var data ;
            curDataMemo = curData ;
            dataLenMemo = dataLen ;
            
            if (curData.length >= dataLen) {
              return ["@exit", curData.substr(0, dataLen), curData.substr(dataLen)] ;
            }
            
            inStream.resume() ;
          },
          exit: function () {
            inStream.pause() ;
          },
          actions: {
            "inStream.data": function (data) {
              curDataMemo += data.toString() ;
              return ["@self", curDataMemo, dataLenMemo] ;
            }
          }
        } ;
      }
    },
    
    "defaults": {
      "actions": {
        "inStream.close": ["@error", "Unexpected stream close."],  
        "inStream.end": ["@error", "Unexpected stream end."],  
        "inStream.error": ["@error", "Input stream error."]
      }
    }
  };
}

module.exports.RxMachine = RxMachine ;
module.exports.TxMachine = TxMachine ;
