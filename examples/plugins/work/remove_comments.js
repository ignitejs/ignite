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
// This example contains a state machine called `removeComments` that 
// demonstrates how to use the [work][WORK] plug-in. The state machine 
// reads a source file, removes any comments from the text and finally 
// saves the amended text to a new file.
//
// The machine consists of three states, `Read`, `Process` and `Write`. 
// The `Process` state uses the [work][WORK] plug-in to perform the 
// regex replace work asynchronously.
//
// Example Output:
// $ ./bin/ignite examples/plugins/work/remove_comments.js 
// Running examples/plugins/work/remove_comments.js
// run: examples/plugins/work/remove_comments.js Exited with no error.
// File saved to examples/plugins/work/remove_comments.js.nc
// $ _
//
// Example Output:
// $ ./bin/ignite examples/plugins/work/remove_comments.js badfile.txt
// Running examples/plugins/work/remove_comments.js
// run: examples/plugins/work/remove_comments.js Exited with error:
// ENOENT, No such file or directory 'badfile.txt'
// $ _
//

function removeComments (fire, filePath) {
  this.startState = 'Read';
  this.states = {
    Read: {
      async: 'fs.readFile',
      actions: {
        '.done': 'Process',
        '.err': '@error'
      }
    },

    Process: {
      work: function (data) {
        data = String(data).replace(/\/\*.+?\*\/|\/\/.*(?=[\n\r])/g, '');
        return [ 'done', data ];
      },
      actions: {
        '.done': 'Write'
      }
    },

    Write: {
      entry: function (data) {
        fire.fs.writeFile(filePath + '.nc', data);
      },
      actions: {
        '.done': '@exit',
        '.err': '@error'
      }
    }
  };
};

removeComments.defaults = {
  imports: { fs: require('fs') },
  args: [ module.filename ],
  callback: function (err, transArgs) {
    if (!err) {
      console.log('File saved to %s', transArgs[0]);
    }
  }
};

module.exports = removeComments;
