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




  
    
