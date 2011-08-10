var _ = require('underscore') ;

var EventEmitter = require('events').EventEmitter,
    stream = require('stream'),
    fs = require('fs'),
    http = require('http'),
    net = require('net'),
    tls = require('tls'),
    child_process = require('child_process'),
    dgram = require('dgram'),
    readline = require('readline'),
    tty;

var metaname = "_meta" ;

var meta = {
    type: "eventemitter",
    object: "Anon",
    module: "anon",
    events: []
} ;
    

Object.defineProperty(EventEmitter.prototype, metaname, {
  value: meta,
  writeable: false,
  configurable: false,
  enumerable: false
}) ;

Object.defineProperty(stream.Stream.prototype, metaname, {
  value: {
    type: "eventemitter",
    object: "Stream",
    module: "stream",
    events: []
  },
  writeable: false,
  configurable: false,
  enumerable: false
}) ;

Object.defineProperty(fs.ReadStream.prototype, metaname, {
  value: {
    type: "eventemitter",
    object: "ReadStream",
    module: "fs",
    events: ["open", "error", "end", "data", "close", "fd"]
  },
  writeable: false,
  configurable: false,
  enumerable: false
}) ;
Object.defineProperty(fs.WriteStream.prototype, metaname, {
  value: {
    type: "eventemitter",
    object: "WriteStream",
    module: "fs",
    events: ["open", "error", "end", "drain", "close"]
  },
  writeable: false,
  configurable: false,
  enumerable: false
}) ;

Object.defineProperty(net.Socket.prototype, metaname, {
  value: {
    type: "eventemitter",
    object: "Socket",
    module: "net",
    events: ["connect", "data", "end", "timeout", "drain", "error", "close"]
  },
  writeable: false,
  configurable: false,
  enumerable: false
}) ;
Object.defineProperty(net.Server.prototype, metaname, {
  value: {
    type: "eventemitter",
    object: "Server",
    module: "net",
    events: ["connection", "close"]
  },
  writeable: false,
  configurable: false,
  enumerable: false
}) ;




  
    
