//
// This example finds all the files in a specified directory, 
// opens each and then counts the number of lines of text contained. 
// The example is contrived to use two state machines (defined with 
// SMGFs `countLines` and `counter`) to illustrate how the `spawn` 
// Plug-In is used.
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
// `"CounterSpawner.quiet"` event is received, indicating that all the 
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
