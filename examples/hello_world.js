//
// The following defines a state machine with a single state 
// (`HelloWorld`) that prints `"hello world`" and then exits.
//
// Example Output:
// $ ignite examples/hello_world.js
// Running examples/hello_world.js
// hello world
// run: examples/hello_world.js Exited with no error.
// $ _
//

function helloWorld (fire) {
  this.startState = 'HelloWorld';
  this.states = {
    HelloWorld: {
      entry: function () {
        console.log('hello world');
        return '@exit';
      }
    }
  };
};

module.exports = helloWorld;
