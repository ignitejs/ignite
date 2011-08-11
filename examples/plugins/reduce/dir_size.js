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
//
// This example finds the size of a specified directory, giving 
// results for both the total size of the directory as well as 
// the total size of the files contained in the directory. The 
// [reduce][REDUCE] plug-in is used to accumulate the total sizes 
// of each constituent of the directory. 
//
// The state machine has two states, `ReadDir` and `CalcSize`. 
// The `ReadDir` state reads the target directory and passes its 
// contents in an array to the `CalcSize` state. This state then 
// uses the `reduce` plug-in to iterate over the array, calling 
// the `fs.lstat` function for each element. The returned `stats` 
// object is then used to update the `memo` object to contain  
// the total sizes for both the desired results.
//
// Example Output:
// $ ./bin/ignite examples/plugins/reduce/dir_size.js
// Running examples/plugins/reduce/dir_size.js
// run: examples/plugins/reduce/dir_size.js Exited with no error.
// Directory size: files only=5799, all items=46759
// $ _ 
//
// Example Output:
// $ ./bin/ignite examples/plugins/reduce/dir_size.js badpath
// Running examples/plugins/reduce/dir_size.js
// run: examples/plugins/reduce/dir_size.js Exited with error:
// ENOENT, No such file or directory
// $ _ 
//

function dirSize (fire, dirPath) {
  this.startState = 'ReadDir';
  this.states = {
    ReadDir: {
      async: 'fs.readdir',
      actions: {
        '.done': 'CalcSize',
        '.err': '@error'
      }
    },

    CalcSize: {
      reduce: {
        fn: 'fs.lstat',
        iterator: function (memo, stats) {          
          if (stats.isFile()) {
            memo.file += stats.size;
          }
          memo.all += stats.size;
          return memo;
        },
        memo: { 
          file: 0, 
          all: 0 
        }
      },
      actions: {
        '.done': '@exit',
        '.err': '@error'
      }
    }
  }; 
};

dirSize.defaults = {
  imports: { fs: require('fs') },
  args: [ '.' ],
  callback: function (err, size) {
    if (!err) {
      console.log('Directory size: files only=%d, all items=%d', 
          size.file, size.all);
    }
  }
};

module.exports = dirSize;
