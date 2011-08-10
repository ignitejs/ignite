# JSMachine: An Introduction

## Background

JSMachine is a package that makes it easy to design, implement, debug, comment and draw
UML2-alike state machines in JavaScript. It is designed to allow such machines to be
described in fairly natural JavaScript and has some special tricks to help support
writing node.js code.

State machines have been around for decades, and are a standard design methodology,
especially in embedded systems. They have a huge body of theory and practice behind
them, but somehow they have failed to explicitly permeate through to be commonly used
in JS, despite their ability to clearly layout asynchronous systems.

Traditional state machines can feel somewhat restrictive for typical uses, and so
we aim to support the extended capabilities of UML2 state machines. These include:

- State machine variables (aka Extended States)
- Guard conditions
- Entry and exit actions
- Internal (local) and external transitions
- Hierarchical states
- Event deferral


In order to make life easy for JavaScript (and especially node.js) programmers, JSMachine
has the following features:

- Different modes of usage - for debugging or for super-fast execution
- Use of standard JS patterns, such as closures.
- Use of standard node.js patterns, including:
    - standard async method signature
    - use of EventEmitters
- Support for the use of WebWorkers to off-load processing work to other threads
 

We recommend that before proceeding you read Wikipedia's excellent page on UML state
machines, in order to give you a bit of a background on what we're trying to produce. (And,
hopefully you'll spot the reasons why JS and state machines really fit together well).

## A Working Example

For the impatient amongst you, here is a simple, but fully working example to show
what a state machine looks like. The hope is that it is quite self-explanatory, so take
a look and see if you can work out what it does.

** INSERT CODE **

As you've probably worked out, this SM reads a file in, does some silly processing on it
and then writes a file back out again. But there is actually quite a lot going on here, so
lets take a closer look.

We'll spend the majority of our time looking within the `sm_desc()` function, as it is
here that the state machine is defined. So why do we use a function to define the
state machine, well:

1.  You don't have to, it can be an object (see below), but you probably want it to be.
2.  But more importantly, it allows us to build a closure, so that the variables
    defined within the function, and its arguments, belong to the state machine
    and are accessible from its functions.
        
You'll see in this function that we set a couple of things on the `this` object - the first
is just a descriptive name for the machine, the second, the states object is where things
start getting interesting.

The three sub-objects Read, Process and Write are the main states of the machine (three
other special states @entry, @exit and @error are automatically generated for you). Here's a
few points which should help you work out what is happening:

-   States can have 'entry' functions, which are called as the state is entered. These
        usually either kick off an asynchronous call (which the state is waiting for), or
        create an EventEmitter.
        
-   By adding `fire.` to the front of an asynchronous calls the SM does a lot of work
        for you - it creates a callback, which will automatically create either a `Done` or
        an `Err` event tailored to the call made.
        
-   Within the `actions` subobject of a state you can list the events handled by the
        state. If these are set to a string, then that is the target state, if they are
        a function then that function is called and should return the target state.
        
-   The process state has a `work` function, which is synchronous. When it completes, it
        returns an array, containing an event name and a number of arguments.
        
-   Jumping to either of the special states `@exit` or `@error` causes the state
        machine to complete.

At the end of the sm_desc function it returns a string - this is the initial function
that the state machine should enter on starting.
     
Lower down, you'll see how we actually create a state machine and start it. First we create
a factory for our particular state machine type. Then we can spawn a new instance of the
state machine, which will happily run and then call the callback when it's complete.

### Drawing it

Here comes the fun bit, as well as being a factory to spawn new machines, you can also ask
for diagrams to be drawn - these are great for the 3 D's - designing, documenting and
debugging.

Drawing the diagram is easy just add:

** INSERT CODE **


And this is what you get. As you would expect there are a range of options for controlling
the drawing.

### Verifying

JSMachine can also help to make sure your machine is 'sensible', it analyses the code
and makes sure you don't try and jump into any non-existent states, that you handle all
the events you should and much more.

** INSERT CODE **


### Compiling

At this stage you might be worried that JSMachine will add a lot of overhead to your
system. Well, it's actually quite lightweight - but, if you really after speed, you can
ask JSMachine to compile an optimised static state machine for you, which will fly along.

** INSERT CODE **





## Writing a Machine

### The Bare Essentials

A state machine is typically described within a closure function, which, a bit like
a constructor, assigns values to the `this` object. The only thing that needs to be
assigned is the `states` object, which, fairly obviously, describes the states.

The minimum required in each state is either an `entry` or `work` function and an
`events` object. `entry` functions are typically used to start something asynchronous -
typically an asynchronous call or an EventEmitter, but they can also be used to 
initialise variables or allocate resources required in the state. `work` functions
should be synchronous and represent processing work which is done in the state.

The closure function should return the initial state of the machine.


### Plumbing

Along with the states, obviously one of the fundamental aspects of a state machine is
the plumbing which controls how the machine transitions between states and what actions
are taken on receiving events. These are defined within the states, within action objects
and guard functions.

#### Action objects

The keys within an action object acts as a lookup to control what happens when an 
event is received into a state. If the key's value is a string, then this specifies
that the action is a simple state transition to another state. If it is a function,
then that function is called - it can do some work (for example call `write()` on
a WriteStream object), but should not initiate any asynchronous calls. The return value
of the function indicates which state to transition to. If the return value is null
(or there is no return), then the SM stays in it's state, without leaving it (i.e.
it does an internal transition).

#### Guard functions

Sometimes you need to ensure that a state is only entered if some condition is
satisfied. This can be done with a guard function. If a state has a guard, then this
function is called **before** the state is entered. If it returns a null value, then
the machine does go on and enter the state, if not, then the guard should return the
name of another state to divert to. 


### Exit Functions

If a state has an `entry` function, then it can also have an `exit` function. These
can be useful to tidy up after a state, for example releasing resources.

## Using a Machine


## Event Sources

### 'Fired' calls

node.js has a standard signature for the majority of its asynchronous calls:
-   Calls take a callback as the last argument.
-   Callbacks have an error variable as their first argument.
    
As this is so common, JSMachine has a handy shortcut for using such calls. This uses
the 'fire' object which is passed as the first argument to the state machine description
function. This object acts as a proxy to the objects passed into the JSMachine constructor
(in the second argument, `imports`). Therefore, if imports is set up as:

        imports = { fs: require('fs') } ;
    
then, from within our entry function we can call:

        fire.fs.readFile(filepath) ;
    
This will call a curried version of `fs.readFile()`, with an auto-generated callback
that automatically checks the callback arguments and causes an `readFileDone` event
to be injected if there was no error, and a `readFileErr` event if there was a problem.
The callback also automatically assigns the arguments to the event (removing the first
one if there is not error).

### Event emitters

The other main source of events in node.js are EventEmitters. These are easily handled
within JSMachine by having a simple register/unregister mechanism.

EventEmitters are registered with a special helper function available also available
on the fire object (these are marked with a `$`). This is `fire.$eventEmitter()`, this
takes a string name for the emitter, the emitter itself, and an optional third argument
which dictates whether it is a short-term or long-term emitter.

        // Example entry function, showing EventEmitter registration
        "entry": function () {
          // Create a read stream event emitter
          readstream = fs.createReadStream(fpath) ;
          // Register it with the state machine (short term)
          fire.$eventEmitter("rs", readstream) ;
        }

or

        // Example entry function, showing long-term EventEmitter registration
        "entry": function (options) {
          // Create an http request event emitter
          req = http.request(options) ;
          // Register it (long term)
          fire.$eventEmitter("req", req, true) ;
          ...          
        }

The string name for the emitter is used to prepend any events emitted from it for the
purposes of the state machine (and hence to differentiate between multiple similar
emitters, if they are present).

      // Example state that uses a ReadStream
      "WriteFromStream": {
        "entry": function () {
          readstream = fs.createReadStream(fpath) ;
          fire.$eventEmitter("rs", readstream) ;
        },
        "exit": function () {
          readstream.destroy() ;
        },
        "actions": {
            "rs.data": function (data) {
              // do something, for example
              req.write(data) ;
              // no return, so internal transition
            },
            "rs.end":       "Wait4Server",
            "rs.error":     "AbortReq"
        }
      }

If `fire.$eventEmitter()` has no third argument, or that argument is a `false` value,
then JSMachine assumes that the EventEmitter is short lived and is only relevant for
its state, i.e. it is automatically unregistered when the state is left. If it is `true`
then the emitter has to be unregistered later using `fire.$unregEventEmitter()`.

        "entry": function (res) {
          // Unregister previously registered EventEmitter
          fire.$unregEventEmitter("req") ;
        }

See example: httpClient.js

### Auto-generated callbacks

There are some places where you need a callback function to communicate with the
state machine, a simple, but common, requirement is for the callback to simply cause
an event to be fired (and for the arguments of the callback to be automatically assigned
to the event).

Such a callback can be easily generated with `fire.$cb()`, just pass the string name
of the event you would like to generate and it will do the rest. For example:

        "entry": function () {
          timerId = setInterval(fire.$cb("tick"), 200) ;
        }

will generate a tick event every 200 ms. See example: timer.js


### Timeouts and tickers 

It is fairly common practice, usually to act as a timeout, to require
an event after a particular period. This is easily achieved by adding
a timeout attribute to a state, which will cause an event called 'timeout'
to occur after the set number of milliseconds.

        "State": {
            "entry": ...
            "timeout": 10000, // timeout after 10s
            "actions": {
                "timeout": ...
                ...
            }
        }

If the state is left before the timeout fires, then it is automatically
cancelled.

A state can also specify a 'ticker' which will cause a 'tick' event to be
repeated fired, with a certain interval, whilst the machine stays in the state.

        "State": {
            "entry": ...
            "ticker": 100, // tick every 0.1s
            "actions": {
                "tick": ...
                ...
            }
        }


### Roll your own

If all else fails, you can still write your own callback and use some of the low-level
methods on the state machine (such as `inject()`, which inserts an event). However,
we hope you don't have to do that, it will break quite a bit, including the diagram
drawing.


## Pretty Pictures


## Multi-levels

### State internal machines

UML2 allows states to be hierarchical - so that the action within a state is actually
controlled by another machine, and that state will not exit until the sub-machine exits.

A sub-machine is started by specifying an 'sm' object in the state. If this exits via the
`@exit` state then an `exit` event occurs in the upper state, if it is by the `@error`
state then it is an `error` event.

    "IntState": {
        "sm": function (fire, arg0) {
            this.states = {
                ...
            } ;
        },
        "actions" {
            "exit": "NextState",
            "error": "@error"
        }
    }

A sub-machine can cause other states to occur at the parent with `fire.$parentevt()` which
takes the event's name and any number of arguments.

     fire.$parentevt("evtname", arg0, arg1) ;
     
        
### Spawning new machines

Another common use case, is the need to start an associated state machine. The typical
example of this is web server, which has a top-level state machine receiving the
initial connections from clients, this then needs to start new machines to handle
each request. There could, therefore, be many request SMs, but only one server SMs.
There is still an association between the server SM and the request SMs, as for example
you may not want the server SM to enter certain states if requests are outstanding.

    "SpawnState": {
        "spawn": function (fire, arg0) {
            this.states = {
                ...
            } ;
        }
    }

A state machine can register the special internal `spawnmgr` Event Emitter.

    "Init" {
        "entry": function () {
            fire.$regSpawnMgr("spawnmgr") ;
         }
    }
    
This can cause the following events to occur:

-   **new** when a new SM is spawned
-   **done** when a SM has finished
-   **quiet** when all spawned SMs have exited
-   **threshold** when a threshold value is crossed (set up with 
        `spawnmgr.setThreshold()`) - which is useful for throttling.

## Fully Specifying

TODO:
-   Describe "ignore", "error" and "defer" event lists
-   Describe default action specification

## Heavy lifting

TODO:
-   Describe off-loading work to webworkers (change "work" function to
        "webwork")
        
## Advanced Usage

