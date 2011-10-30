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

//
// A simple hello world example used as the introductory example during
// our [LNUG presentation][LNUGPRESENTATION]. For more details see the 
// [presentation slides][LNUGSLIDES].
//
// Example Output:
// $ ./bin/ignite examples/lnug/lnugExample1.js
// Running examples/lnug/lnugExample1.js
// <span style="color: green;">Hello World</span>
// run: examples/lnug/lnugExample1.js Exited with no error.
// $ _
//
// Example Output:
// $ ./bin/ignite examples/lnug/lnugExample1.js Steve
// Running examples/lnug/lnugExample1.js
// <span style="color: green;">Hello World</span>
// <span style="color: red;">Hello Steve, pleased to meet you.</span>
// run: examples/lnug/lnugExample1.js Exited with no error.
// $ _
//

var _ = require('underscore') ;
var colors = require('colors') ;

function lnugExample (fire, name) {
  
  return {
    startState: "HelloWorld",
    
    states: {
      
      "HelloWorld": {
        entry: function () {
          fire.process.stdout.write("Hello World\n".green) ;
        },
        actions: {
          "process.stdout.write.done": "HelloName",
          ".write.err": "@error"
        }
      },
      
      "HelloName": {
        guard: function () {
          if (!name || typeof name !== "string")
            return "@exit" ;
        },
        entry: function () {
          var str = "Hello "+name+", pleased to meet you.\n" ;
          fire.process.stdout.write(str.red) ;
        },
        actions: {
          ".write.done": "@exit",
          ".write.err": "@error"
        }
      }
       
    }
  } ;
}

lnugExample.defaults = {
  imports: { 
    process: process
  }
};

module.exports = lnugExample;
