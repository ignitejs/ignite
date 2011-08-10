//
//
// This example finds the size of a specified directory, giving 
// results for both the total size of the directory as well as 
// the total size of the files contained in the directory. The 
// `reduce` Plug-In is used to accumulate the total sizes of 
// each constituent of the directory. 
//
// The state machine has two states, `ReadDir` and `CalcSize`. 
// The `ReadDir` state reads the target directory and passes its 
// contents in an array to the `CalcSize` state. This state then 
// uses the `reduce` Plug-In to iterate over each element in the 
// array. At each iteration the `fs.lstat` function is called. 
// The returned `stats` object is then used to update the `memo` 
// object, which contains the total sizes for both the desired 
// results.
//
// Example Output:
// $ ignite examples/plugins/reduce/dir_size.js
// Running examples/plugins/reduce/dir_size.js
// run: examples/plugins/reduce/dir_size.js Exited with no error.
// Directory size: files only=5799, all items=46759
// $ _ 
//
// Example Output:
// $ ignite examples/plugins/reduce/dir_size.js badpath
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
