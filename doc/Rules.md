# Rules and Guidelines

In order to get the most out of JSMachine there are a few guidelines which should
be followed.


1.  **State Machines have a static structure**
        
    The structure (i.e. the diagram) of a state machine should be static and
    hence guard and event function should be simple:
    
    -   They should have simple returns which are either strings (containing
        valid state names) or null. Don't return variables.
    -   They should be simple decision structures made with `if` and `switch`
        statements. Avoid loops.
    -   Never kick off an asynchronous call - they belong in the entry
        function of a state.
        
2.  **Entry function should be async. Work function should be sync.**

    Although entry functions can return a state name, in order to affect an
    immediate state change, this should be avoided as it moves the structure
    out of the guard and event functions.
    
    Entry functions should either kick off an asynchronous call or create/start
    and register an EventEmitter. Processing code should be placed in the `work`
    (or `webwork`) function.
    
3.  **Avoid storing things in the `this` object**
    
        