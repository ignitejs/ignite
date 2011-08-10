//
// This example contains a state machine called `removeComments` that 
// demonstrates how to use the [work][WORK] Plug-In. The state machine reads 
// a source file, removes any comments from the text and finally saves 
// the amended text to a new file.
//
// The machine consists of three states, `Read`, `Process` and `Write`. 
// The `Process` state uses the `work` plug-in to perform the regex replace 
// work asynchronously.
//
// Example Output:
// $ ignite examples/plugins/work/remove_comments.js 
// Running examples/plugins/work/remove_comments.js
// run: examples/plugins/work/remove_comments.js Exited with no error.
// File saved to examples/plugins/work/remove_comments.js.nc
// $ _
//
// Example Output:
// $ ignite examples/plugins/work/remove_comments.js badfile.txt
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

