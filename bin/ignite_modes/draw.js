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

var ignite = require("../../ignite"),
    path = require("path"),
    fs = require("fs"),
    util = require('util'),
    child_process = require('child_process'),
    _ = require("underscore") ;

function draw (utils, donecb, jsmfile, jsmopts, jsmargs) {
  var jsmfact, level, graph, text, outfile, outstream,
      processOpts, ext;
  
  if (!jsmopts.quiet) {
    process.stderr.write("Drawing "+jsmfile+"\n") ;
  }
  
  jsmfact = utils.createFactory(jsmfile, jsmopts, jsmargs) ;
  
  level = jsmopts.level ;
  
  graph = new ignite.Diagram(jsmfact) ;
  
  // Set-up options for processor - don't worry if values
  // are not set, as they will be filled in by Diagram
  // (and then available to us through the object)
  processOpts = {
      processor: jsmopts.processor, 
      level: level
      } ;
  text = graph.process(processOpts) ;
  
  ext = processOpts.processor ;
  if (processOpts.processor === "dot" 
    && jsmopts.destfmt 
    && jsmopts.destfmt !== "dot") {
    ext = jsmopts.destfmt ;
  }
  
  outfile = jsmopts.outfile || (path.basename(jsmfile, ".js") + "." + ext) ;
  
  if (outfile === "-") {
    outstream = process.stdout ;
  } else {
    outstream = fs.createWriteStream(outfile) ;
  }

  if (processOpts.processor === "dot" 
      && jsmopts.destfmt 
      && jsmopts.destfmt !== "dot") {
    var cmd, args, dot ;
    
    cmd = "/usr/bin/env" ;
    args = ["dot", "-T", jsmopts.destfmt] ;
    
    dot = child_process.spawn(cmd, args) ;
    dot.stderr.pipe(process.stderr) ;
    dot.stdout.pipe(outstream) ;
    dot.stdin.end(text) ;
  } else {
    outstream.write(text) ;
    if (outfile !== "-") {
      outstream.end() ;
    }
  }
  
}

draw.opts = {
    "destfmt": {
      type:  "string",
      short: "-T",
      long: "--destfmt",
      desc: "Destination format."
    },
    "processor": {
      type:  "string",
      short: "-p",
      long: "--proc",
      desc: "Select the processor used to create the graph."
    },
    "level": {
      type:  "int",
      long:  "--level",
      desc: "Level of detail in SM diagram."
    },
    "outfile": {
      type: "string",
      short: "-o",
      long: "--outfile",
      desc: "Output filename"
    }
} ;

module.exports = draw ;