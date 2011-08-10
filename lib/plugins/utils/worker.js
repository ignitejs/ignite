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
