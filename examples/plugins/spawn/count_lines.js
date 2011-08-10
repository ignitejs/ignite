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
// This example finds all the files in a specified directory, 
// opens each and then counts the number of lines of text contained. 
// The example is contrived to use two state machines (defined with 
// [SMGFs][SMGFAPI] `countLines` and `counter`) to illustrate how the 
// [spawn][SPAWN] Plug-In is used.
//
// The `counter` state machine is responsible for counting the number 
// of lines in a single file. Its `ReadFile` state uses an asynchronous 
// guard function to check that the path it receives is a file path and 
// in which case the file in read and its data passed to the 
// `CountLines` state. This state uses the work Plug-In to perform the 
// counting process asynchronously.
//
// The `countLines` state machine has two states, `ReadDir` and `Spawn`. 
// The `ReadDir` state reads the target directory and passes its contents 
// in an array to the `Spawn` state. This state starts a new `counter` 
// state machine to perform the line counting process on each file. 
// Notice that it loops back on itself (line 60) until all elements of 
// the array have been used. It then waits in the state until the 
// `'CounterSpawner.quiet'` event is received, indicating that all the 
// spawned `counter` state machine have completed.
//
// Example Output:
// $ ignite examples/plugins/spawner/count_lines.js
// Running examples/plugins/spawn/count_lines.js
// index.js has 8 lines
// .project has 23 lines
// package.json has 57 lines
// todo.md has 57 lines
// .gitignore has 8 lines
// bsd3.txt has 27 lines
// .npmignore has 8 lines
// run: examples/plugins/spawn/count_lines.js Exited with no error.
// $_
//

var path = require('path');

function counter (fire, filePath) {
  this.startState = 'ReadFile';

  this.states = {
    ReadFile: {
      guard: {
        async: 'fs.stat',
        actions: {
          'async.done': function (stat) {
            if (!stat.isFile()) {
              return '@exit';
            }
          },
          'async.err': '@exit'
        }
      },
      async: 'fs.readFile',
      actions: {
        '.done': 'CountLines',
        '.err': '@exit'
      }
    },

    CountLines: {
      work: function (data) {        
        console.log('%s has %d lines', filePath, 
            String(data).split('\n').length);
        return [ 'done' ];
      },
      actions: {
        '.done': '@exit'
      }
    }
  };
};

function countLines (fire, dir) {
  this.startState = 'ReadDir';
  this.states = {
    ReadDir: {
      entry: function () {
        fire.$spawner('CounterSpawner', counter);
        fire.fs.readdir(dir) ;
      },
      actions: {
        '.done': 'Spawn',
        '.err': '@error'
      }
    },

    Spawn: {
      spawn: {
        factory: 'CounterSpawner',
        smArgs: function (files) {
          return path.join(dir, files.shift());
        }
      },
      actions: {
        '.done': function (files) {
          if (files.length) {
            return '@self';
          }
        },
        'CounterSpawner.quiet': '@exit'
      }
    }
  };
};

countLines.defaults = {
    imports: { fs: require('fs') },
    args: ['.']
};

module.exports = countLines;
